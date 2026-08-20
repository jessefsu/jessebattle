"""Rebuild headshot.jpg from the studio original in Site photos/.

This is the executable form of the "Headshot recipe" section of HANDOFF.md.
The prose version alone was not enough to reproduce: rebuilding from it walked
straight into the collar leak and an 8px reframe, both of which are guarded
against below. Read the HANDOFF section for the reasoning; this file is the
part you actually run.

    python3 tools/headshot.py                 # rebuild headshot.jpg
    python3 tools/headshot.py --no-decon \
            -o /tmp/before.jpg                # same, minus decontamination,
                                              # for the halo comparison

Run it from the repo root — the input and output paths are relative to it.
Needs pillow, numpy and scipy, none of which the site itself uses:

    python3 -m venv /tmp/hs && /tmp/hs/bin/pip install pillow numpy scipy
    /tmp/hs/bin/python tools/headshot.py

Not served: tools/ is listed in .assetsignore, so this is in the repo but never
uploaded as a public asset.
"""
import sys, io
import numpy as np
from PIL import Image
from scipy import ndimage

SRC   = "Site photos/Headshot1.JPG"
INK   = np.array([6, 16, 25], float)
OUT_W, OUT_H = 605, 757
DECON = "--no-decon" not in sys.argv
OUT   = sys.argv[sys.argv.index("-o") + 1] if "-o" in sys.argv else "headshot.jpg"

def smoothstep(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

# ---- 1. 4:5 crop, full frame height, centred on the head -------------------
img = Image.open(SRC).convert("RGB")
a = np.asarray(img).astype(float)
H, W, _ = a.shape
L = a.mean(2)
C = a.max(2) - a.min(2)

notbg = (C > 18) | (L < 70)
ys = np.where(notbg.sum(1) > W * 0.02)[0]
head = notbg[ys.min(): ys.min() + int(0.32 * (ys.max() - ys.min()))]
hx = np.where(head.any(0))[0]
cx = (hx.min() + hx.max()) // 2

cw = int(round(H * OUT_W / OUT_H))
# The centroid below lands ~20 source px right of the framing the published
# headshot uses. Nudge back so a rebuild is registered with the existing file
# and the only visible change is the edge, not an 8px reframe.
FRAMING_NUDGE = -20
x0 = int(np.clip(cx - cw // 2 + FRAMING_NUDGE, 0, W - cw))
a = a[:, x0:x0 + cw]
L = a.mean(2)
C = a.max(2) - a.min(2)
h, w, _ = a.shape

# ---- 2. background key: neutral AND bright AND connected to the border -----
# s = how backdrop-like a pixel is, 0..1. Soft on purpose: fractional values at
# the edge are what makes decontamination possible below.
#
# Keep the luma ramp NARROW (60-110). Widening it toward the real backdrop luma
# of 191 looks more principled and is worse: it hands fractional alpha to bright
# but fully opaque skin and hair, decontamination then subtracts backdrop from
# pixels that never had any, and edge overshoot goes from +11 to +24.
s = (1 - smoothstep(C, 10, 28)) * smoothstep(L, 60, 110)

# Open the candidate set before deciding connectivity. The specular highlight
# along the collar fold is neutral (chroma ~12) and bright, so without this the
# fill walks in from the backdrop along a 1px line and cuts the collar off.
# Opening only gates *connectivity*; the alpha still comes from the soft s.
cand = ndimage.binary_opening(s > 0.35, iterations=2)
lab, n = ndimage.label(cand)
edge_labels = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
edge_labels.discard(0)
M = np.isin(lab, list(edge_labels))
band = ndimage.binary_dilation(M, iterations=10)

alpha = np.where(band, 1.0 - s, 1.0)          # subject opacity
alpha = np.clip(alpha, 0, 1)

# ---- 3. sample the backdrop, then decontaminate the edge -------------------
deep = ndimage.binary_erosion(s > 0.95, iterations=4)
B = np.median(a[deep], axis=0)

F = a.copy()
if DECON:
    # F = (C - (1-alpha)B) / alpha  — removes the backdrop light that bled into
    # partly-transparent hair, instead of leaving it to read as a pale rim.
    edge = (alpha > 0.05) & (alpha < 0.999)
    al = alpha[edge][:, None]
    F[edge] = np.clip((a[edge] - (1 - al) * B) / al, 0, 255)

# ---- 4. grade the subject only --------------------------------------------
g = F.mean(2, keepdims=True)
F = g + 0.78 * (F - g)                 # saturation 78%
F = 128 + 1.06 * (F - 128)             # contrast x1.06
F[..., 0] *= 0.97                      # red   x0.97
F[..., 2] *= 1.06                      # blue  x1.06
F = np.clip(F, 0, 255)

# ---- 5. smoothstep fade into the background over the lower half ------------
y = np.arange(h)[:, None]
start = 0.52 * h
fade = 1.0 - smoothstep(y, start, h - 1)
alpha = alpha * fade

# ---- 6. composite onto the site ink ---------------------------------------
out = alpha[..., None] * F + (1 - alpha[..., None]) * INK
im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize(
    (OUT_W, OUT_H), Image.LANCZOS)

# ---- 7. baseline JPEG, tuned to land near 55KB -----------------------------
best = None
for q in range(95, 39, -1):
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=q, optimize=True, progressive=False)
    if buf.tell() <= 57_000:
        best = (q, buf.tell(), buf.getvalue())
        break
q, n_bytes, data = best
open(OUT, "wb").write(data)
print(f"{OUT}: {OUT_W}x{OUT_H} q={q} {n_bytes/1024:.1f}KB "
      f"decontamination={'ON' if DECON else 'OFF'} backdrop B={B.round(1)}")
