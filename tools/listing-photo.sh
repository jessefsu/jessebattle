#!/bin/bash
# Crop a listing photo to 16:9 aimed at the house, resize to 1024x576, and step
# the JPEG quality down until it is under 300KB.
#
#   tools/listing-photo.sh <source> <dest.jpg> [cx cy zoom]
#
#     cx, cy  centre of the crop as a fraction of the source (0-1). Default .5 .5
#     zoom    fraction of the source WIDTH the crop spans. 1 = whole frame,
#             .6 = a 60% wide crop, i.e. tighter on the subject. Default 1
#
# These aerials are wide, so the house is a speck at zoom 1. Aim with cx/cy and
# pull in with zoom until the house carries the frame. 1024px out is still 2x the
# widest a card ever renders (446 CSS px at a 600px viewport), and keeping the
# output this size stops a tight crop from being upscaled into mush.
set -euo pipefail
src="$1"; dest="$2"; cx="${3:-0.5}"; cy="${4:-0.5}"; zoom="${5:-1}"; max=307200
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

W=$(sips -g pixelWidth  "$src" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')

read cw ch left top <<<"$(python3 -c "
W,H=$W,$H; cx,cy,z=$cx,$cy,$zoom
cw=min(W,max(16,round(W*z))); ch=round(cw*9/16)
if ch>H: ch=H; cw=round(ch*16/9)
left=min(max(round(W*cx-cw/2),0),W-cw)
top =min(max(round(H*cy-ch/2),0),H-ch)
print(cw,ch,left,top)")"

sips -s format jpeg "$src" --out "$tmp/a.jpg" >/dev/null
sips --cropToHeightWidth "$ch" "$cw" --cropOffset "$top" "$left" "$tmp/a.jpg" >/dev/null
sips --resampleHeightWidth 576 1024 "$tmp/a.jpg" >/dev/null
for q in 72 64 58 52 46 40; do
  sips -s formatOptions "$q" "$tmp/a.jpg" --out "$dest" >/dev/null
  [ "$(stat -f%z "$dest")" -le "$max" ] && break
done
echo "$(basename "$dest")  src=${W}x${H}  crop=${cw}x${ch}+${left}+${top}  out=1024x576  q=$q  $(( $(stat -f%z "$dest") / 1024 ))KB"
