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
  tools/web-photo.sh "Site photos/PGE Gen.jpg"                                 img/reno-generator.jpg      0.47 0.55 0.82  800 1:1       400
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

Pavers (added later, two separate jobs):

  tools/web-photo.sh "Site photos/shelllock pavers 2.jpeg" img/reno-pavers-large.jpg  0.45 0.55 0.90 1600 16:9 400
  tools/web-photo.sh "Site photos/travertine pavers.jpeg"  img/reno-pavers-detail.jpg 0.50 0.65 1.00  800 4:3  400

reno-pavers-large   Shell-lock pavers, canal-front rectangular pool and raised
                    spa. Native 4:3 landscape, so 16:9 is an easy crop. zoom
                    0.90 at cx 0.45 drops the white lanai post on the right
                    edge that cuts through the frame at zoom 1.
reno-pavers-detail  Travertine pavers, freeform pool, open water. The source is
                    EXIF orientation 6 (a 4032x3024 raster that displays
                    3024x4032 portrait), so the rotation has to be baked in
                    before measuring or the band comes off the wrong axis.
                    cy 0.65 fills the frame with the paver field and the curved
                    coping; cy 0.72 pulls in palms and horizon and reads as a
                    scene rather than a detail.

Both are phone photos of client properties. web-photo.sh strips the EXIF block,
which is what takes the GPS coordinates off them -- verified clean on both.

reno-generator      Replaced 2026-09-18. The original was an AI-generated image
                    with a garbled decal and an invented model number on a real
                    Generac trademark; it shipped as a placeholder and is now
                    retired, along with its source. This is a real install
                    photographed by PGE, Jesse's electrical partner: 1504x2016
                    portrait, so a square crop has 1504px to work with against
                    an 800px slot. zoom 0.82 at cy 0.55 fills the tile with the
                    unit and keeps the concrete pad and a marking flag in frame.
