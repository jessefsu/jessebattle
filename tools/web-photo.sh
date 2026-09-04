#!/bin/bash
# Crop a photo to 16:9 aimed at the subject, resize, and step the JPEG quality
# down until the file is under 300KB.
#
#   tools/web-photo.sh <source> <dest.jpg> [cx cy zoom outWidth]
#
#     cx, cy    centre of the crop as a fraction of the source (0-1). Default .5 .5
#     zoom      fraction of the source WIDTH the crop spans. 1 = whole frame,
#               .6 = a 60% wide crop, i.e. tighter on the subject. Default 1
#     outWidth  output width in px. Default 1024 (listing cards). Use 1600 for
#               the full-column images on inspiration.html.
#
# Dimensions are read AFTER sips normalises the file, because phone photos carry
# an EXIF rotation flag: bathroom_demo.JPG stores a 5712x4284 raster that
# displays as 4284x5712 portrait. Measuring the original would crop the wrong axis.
set -euo pipefail
src="$1"; dest="$2"; cx="${3:-0.5}"; cy="${4:-0.5}"; zoom="${5:-1}"; ow="${6:-1024}"; max=307200
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

sips -s format jpeg "$src" --out "$tmp/a.jpg" >/dev/null

# Bake in any EXIF rotation before measuring. sips carries the orientation tag
# through every operation and reports the raw raster, so a phone photo shot
# upright (orientation 6, a 5712x4284 raster that displays 4284x5712) would be
# measured and cropped on the wrong axis and then still display rotated.
ORIENT=$(python3 -c "
import struct,sys
d=open(sys.argv[1],'rb').read(400000)
i=d.find(b'Exif\x00\x00')
print(1) if i<0 else None
if i>=0:
    t=d[i+6:]; bo='>' if t[:2]==b'MM' else '<'
    off=struct.unpack(bo+'I',t[4:8])[0]
    n=struct.unpack(bo+'H',t[off:off+2])[0]; v=1
    for k in range(n):
        e=off+2+k*12
        if struct.unpack(bo+'H',t[e:e+2])[0]==0x0112: v=struct.unpack(bo+'H',t[e+8:e+10])[0]
    print(v)" "$tmp/a.jpg")
case "$ORIENT" in
  3) sips -r 180 "$tmp/a.jpg" >/dev/null ;;
  6) sips -r  90 "$tmp/a.jpg" >/dev/null ;;
  8) sips -r 270 "$tmp/a.jpg" >/dev/null ;;
  1|"") ;;
  *) echo "warning: EXIF orientation $ORIENT (mirrored) not handled" >&2 ;;
esac

W=$(sips -g pixelWidth  "$tmp/a.jpg" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$tmp/a.jpg" | awk '/pixelHeight/{print $2}')

read cw ch left top oh <<<"$(python3 -c "
W,H=$W,$H; cx,cy,z,ow=$cx,$cy,$zoom,$ow
cw=min(W,max(16,round(W*z))); ch=round(cw*9/16)
if ch>H: ch=H; cw=min(W,round(ch*16/9)); ch=round(cw*9/16)
left=min(max(round(W*cx-cw/2),0),W-cw)
top =min(max(round(H*cy-ch/2),0),H-ch)
print(cw,ch,left,top,round(ow*9/16))")"

sips --cropToHeightWidth "$ch" "$cw" --cropOffset "$top" "$left" "$tmp/a.jpg" >/dev/null
sips --resampleHeightWidth "$oh" "$ow" "$tmp/a.jpg" >/dev/null
for q in 72 64 58 52 46 40 34; do
  sips -s formatOptions "$q" "$tmp/a.jpg" --out "$dest" >/dev/null
  # Drop the EXIF block: it still carries the now-baked-in orientation tag,
  # which would rotate the image a second time in the browser, and phone
  # photos carry GPS coordinates that have no business on a public site.
  python3 -c "
import sys
p=sys.argv[1]; d=open(p,'rb').read()
o=bytearray(d[:2]); i=2
while i<len(d)-1 and d[i]==0xFF:
    m=d[i+1]
    if m in (0xD8,0xD9) or 0xD0<=m<=0xD7: i+=2; continue
    if m==0xDA: o+=d[i:]; break
    L=int.from_bytes(d[i+2:i+4],'big')
    if m not in (0xE1,0xE2,0xED,0xEE): o+=d[i:i+2+L]
    i+=2+L
open(p,'wb').write(bytes(o))" "$dest"
  [ "$(stat -f%z "$dest")" -le "$max" ] && break
done
echo "$(basename "$dest")  src=${W}x${H}  crop=${cw}x${ch}+${left}+${top}  out=${ow}x${oh}  q=$q  $(( $(stat -f%z "$dest") / 1024 ))KB"
