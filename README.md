# goCart

Full rebuild of [Tilebox](https://github.com/Inventsable/Tilebox) for modular, single artboard/map support:

![](https://thumbs.gfycat.com/CreamyEachBedlingtonterrier-size_restricted.gif)

* Any base tile size
* Auto-detects zoom level of base artboard
* Custom output path
* Custom naming pattern (`{z}-{x}-{y}.png`)
* Support for PNG, JPG [SVG, TIFF, PSD]
* Realtime file syncing shows existing and missing tiles
* Easily render full or partial maps with interactive, diagnostic display
* Hover radius of grid controlled with mousewheel scroll


## Pre-build install
``` bash
# Adobe application must not be open
git clone https://github.com/Inventsable/goCart.git
npm install
npm run build
npm run serve

# GoCart will show in Windows > Extensions after next Illustrator launch
```
