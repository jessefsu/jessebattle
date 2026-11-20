Crops used for the homepage listing cards. Regenerate with tools/web-photo.sh:

  tools/web-photo.sh "Site photos/Dover.jpg"           img/listings/dover.jpg            0.50  0.53  0.55
  tools/web-photo.sh "Site photos/Saxony.jpg"          img/listings/saxony.jpg           0.52  0.583 0.42

Args are <source> <dest> <cx> <cy> <zoom>. Sources are 1600x899 aerials, already
16:9, so the house is a speck at zoom 1; each crop pulls in on the subject.
Saxony is aimed to start just below the red map pin baked into kymcoyle.com's
sky, which sits directly on the centre unit's roof ridge.

Note: web-photo.sh now bakes in EXIF rotation before cropping and strips the
EXIF block from the output. Re-running the commands above reproduces the same
crop but a slightly smaller file than the one committed, because the committed
files still carry their original APP1 metadata. They contain no GPS data.

bayou-grande.jpg (6062 Bayou Grande Blvd NE) was not made with web-photo.sh. Its
source is kymcoyle.com's 1200x799 first gallery photo (a front elevation at dusk,
not an aerial), cropped full width from y=30 to y=705 for 16:9, resized to
1024x576, saved at JPEG q82 progressive with no EXIF (123 KB).
