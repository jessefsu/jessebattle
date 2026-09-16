Crops used for the renovation page derivatives. Regenerate with tools/web-photo.sh:

  tools/web-photo.sh "Site photos/uad-3-6-framing.jpg"                         img/reno-hero-framing.jpg   0.50 0.48 0.90 2560 2560:1200 600
  tools/web-photo.sh "Site photos/bathroom_demo.JPG"                           img/reno-demo.jpg           0.50 0.42 1.00 2560 2560:1200 600
  tools/web-photo.sh "Site photos/kitchen wide angle.jpg"                      img/reno-kitchen-large.jpg  0.50 0.52 0.90 1600 16:9      400
  tools/web-photo.sh "Site photos/bathroom modern.jpg"                         img/reno-bath-large.jpg     0.50 0.56 1.00 1600 16:9      400
  tools/web-photo.sh "Site photos/tile floor.jpg"                              img/reno-flooring.jpg       0.33 0.62 0.50 1600 16:9      400
  tools/web-photo.sh "Site photos/kitchen with island.jpg"                     img/reno-kitchen-island.jpg 0.42 0.48 0.70  800 4:3       400
  tools/web-photo.sh "Site photos/kitchen.jpg"                                 img/reno-kitchen-range.jpg  0.58 0.50 0.55  800 4:3       400
  tools/web-photo.sh "Site photos/bathroom shower large format tile niche.jpg" img/reno-bath-tub-niche.jpg 0.33 0.50 0.65  800 4:3       400
  tools/web-photo.sh "Site photos/bathroom_wide_angle.jpg"                     img/reno-bath-guest.jpg     0.55 0.55 0.70  800 4:3       400
  tools/web-photo.sh "Site photos/floor-plan.jpg"                              img/reno-floor-plan.jpg     0.50 0.50 1.00 1400 1:1       400
  tools/web-photo.sh "Site photos/generator website.jpg"                       img/reno-generator.jpg      0.50 0.52 1.00  800 1:1       400
  tools/web-photo.sh "Site photos/car charger.jpg"                             img/reno-ev-charger.jpg     0.42 0.45 0.70  800 1:1       400

Args are <source> <dest> <cx> <cy> <zoom> <outWidth> <aspect> <maxKB>. The last
two are new; calls written before they existed default to 16:9 and 300KB and
reproduce byte for byte.

Crop notes:

reno-demo      bathroom_demo.JPG carries EXIF orientation 6 (a 5712x4284 raster
               that displays 4284x5712). web-photo.sh bakes the rotation in
               before measuring; anything that skips that step crops the wrong
               axis. A 2560x1200 band out of a portrait frame keeps roughly a
               third of the height, so cy is aimed at 0.42 to land on the stud
               bays and rough-in plumbing. Centring it (cy 0.55) puts the
               foreground worker's waistband in the middle of the frame.
reno-bath-large bathroom modern.jpg is 2:3 portrait; a 16:9 band drops about 63%
               of the height. cy 0.56 keeps the floating vanity whole and the
               shower entry visible. Higher bands slice the toilet mid-bowl.
reno-flooring  The source has a floral dress across the right third and only
               the area near the feet is in the focal plane. zoom 0.50 at
               cx 0.33 / cy 0.62 clears the dress, stays on sharp tile, and
               keeps one sandal in the corner for scale.
reno-kitchen-* All three kitchen photos were shot wide open and the background
               planes go soft. Nothing is cropped past zoom 0.50.
reno-floor-plan Square source, resized only. Do not crop to 16:9: it cuts either
               the garage or the two right-hand bedrooms.
