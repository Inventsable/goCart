// alert('Hello there')
var previewPath = null;
var tempAB = null;
var tempABIndex = null;

var rx = {
    z: /\{z\}/i,
    x: /\{x\}/i,
    y: /\{y\}/i,
};

var options = {
    size: 256,
    ext: '.png',
    min: 0,
    max: 5,
    path: null,
    previewPath: null,
    pattern: null,
    baseZoom: 0,
    mapTypeID: null,
    baseWidth: 0,
}

function setPreviewPath(path) {
    previewPath = path;
    // alert(path);
}

function setOptions(opts) {
    let list = ['ext', 'size', 'max', 'min', 'path', 'pattern', 'mapTypeID', 'previewPath']
    for (let i = 0; i < list.length; i++) {
        const opt = list[i];
        options[opt] = opts[opt];
    }
    showOptions();
    // alert(opts)
}

function setAutoOptions(opts) {
    // alert('Hello')
    opts = JSON.parse(opts)
    setOptions(opts)
}


function showOptions() {
    console.log(options.ext + " \r\n" + options.size + " \r\n" + options.max + " \r\n" + options.min + " \r\n" + options.path + " \r\n" + options.pattern + " \r\n" + options.mapTypeID + " \r\n" + options.baseWidth + " \r\n" + options.baseZoom)
}

function readArtboards(opts) {
    // alert('trying')
    opts = JSON.parse(opts);
    setOptions(opts)
    var rx = new RegExp(opts.mapTypeID, "i");
    var doc = app.activeDocument;
    var targs = [];
    // console.log(rx)
    for (var i = 0; i < doc.artboards.length; i++) {
        // if artboard name has keyword
        if (rx.test(doc.artboards[i].name)) {
            targs.push(i);
            // console.log('Match found')
        }
    }
    if (!targs.length)
        return JSXEvent('failedScan');

    var message = [];
    for (var t = 0; t < targs.length; t++) {
        var index = targs[t];
        var ab = doc.artboards[index];
        // if artboard width is evenly divisible by defined tile size
        if ((isInt((ab.artboardRect[2] - ab.artboardRect[0]) / opts.size))
            // and artboard is a square
            && ((ab.artboardRect[2] - ab.artboardRect[0]) == (ab.artboardRect[1] - ab.artboardRect[3]))) {
            var map = {
                name: ab.name,
                index: index,
                width: ab.artboardRect[2] - ab.artboardRect[0],
                height: ab.artboardRect[1] - ab.artboardRect[3],
                pos: ab.artboardRect,
                tilecount: null,
                tilerows: null,
                
            };
            options.baseWidth = map.width;
            map.tilerows = map.width / 256;
            map.tilecount = Math.pow(map.tilerows, 2);
            message.push(map);
            app.activeDocument.artboards.setActiveArtboardIndex(index);
        }
    }
    return JSON.stringify(message);
}

function exportTilemap(tiles) {
    console.log(tiles);
    tiles = JSON.parse(tiles);
    createSnapshotArtboard(tiles[0].rect);
    for (let i = 0; i < tiles.length; i++) {
        generateTile(tiles[i]);
    }
    deleteSnapshotArtboard();
    return true;
}

function createSnapshotArtboard(startpos) {
    tempAB = app.activeDocument.artboards.add(startpos);
    tempABIndex = app.activeDocument.artboards.length - 1;
    tempAB.name = options.mapTypeID + 'Snapshot';
    app.activeDocument.artboards.setActiveArtboardIndex(tempABIndex);
}

function deleteSnapshotArtboard() {
    let tempAB = app.activeDocument.artboards.getByName(options.mapTypeID + 'Snapshot');
    tempAB.remove();
}


function generateTile(tile) {
    tempAB.artboardRect = tile.rect;
    var fileSpec = new File(options.path + tile.name);
    var snapshot = getExportParams(tile);
    // let exportType = null;
    app.activeDocument.exportFile(fileSpec, snapshot.type, snapshot.options);
}

function getExportParams(tile) {
    return {
        type: getExportType(),
        options: getExportOptions(tile)
    }
}

function getExportOptions(tile) {
    let opts = null;
    if (/png/.test(options.ext)) {
        opts = new ExportOptionsPNG24;
        opts.artBoardClipping = true;
        opts.horizontalScale = tile.scale.toFixed(1);
        opts.verticalScale = tile.scale.toFixed(1);
    } else if (/jp/.test(options.ext)) {
        opts = new ExportOptionsJPEG;
        opts.artBoardClipping = true;
        opts.horizontalScale = tile.scale.toFixed(1);
        opts.verticalScale = tile.scale.toFixed(1);
    } else if (/svg/.test(options.ext)) {
        opts = new ExportOptionsSVG;
        opts.fontType = SVGFontType.OUTLINEFONT;
        opts.svgId = SVGIdType.SVGIDREGULAR;
        opts.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;
    } else if (/tiff/.test(options.ext)) {
        opts = new ExportOptionsTIFF;
    } else if (/gif/.test(options.ext)) {
        opts = new ExportOptionsGIF;
    } else if (/psd/.test(options.ext)) {
        opts = new ExportOptionsPhotoshop;
    } 

    return opts;
}

function getExportType() {
    if (/png/.test(options.ext))
        return ExportType.PNG24;
    else if (/jp/.test(options.ext))
        return ExportType.JPEG;
    else if (/svg/.test(options.ext))
        return ExportType.SVG;
    else if (/tiff/.test(options.ext))
        return ExportType.TIFF;
    else if (/gif/.test(options.ext))
        return ExportType.GIF;
    else if (/psd/.test(options.ext))
        return ExportType.PHOTOSHOP;
}

function generateThumbnail() {
    var fileSpec = new File(options.previewPath);
    var opts = getThumbnailOptions();
    app.activeDocument.exportFile(fileSpec, ExportType.PNG24, opts);
}

function getThumbnailOptions() {
    var opts = new ExportOptionsPNG24();
    opts.antiAliasing = true;
    opts.transparency = true;
    opts.artBoardClipping = true;
    opts.horizontalScale = 12.0;
    opts.verticalScale = 12.0;
    return opts;
}




















// function readArtboardsOld(opts) {
//     opts = JSON.parse(opts);
//     setOptions(opts)
//     var rx = new RegExp(opts.keyword, "i");
//     var doc = app.activeDocument;
//     var targs = [];
//     for (var i = 0; i < doc.artboards.length; i++) {
//         // if artboard name has keyword
//         if (rx.test(doc.artboards[i].name)) {
//             targs.push(i);
//         }
//     }
//     JSXEvent(targs.length, 'startload');
//     var message = [];
//     for (var t = 0; t < targs.length; t++) {
//         var index = targs[t];
//         var ab = doc.artboards[index];
//         // if artboard width is evenly divisible by defined tile size
//         if ((isInt((ab.artboardRect[2] - ab.artboardRect[0]) / opts.size))
//         // and artboard is a square
//         && ((ab.artboardRect[2] - ab.artboardRect[0]) == (ab.artboardRect[1] - ab.artboardRect[3]))) {
//             var map = {
//                 name: ab.name,
//                 index: index,
//                 width: ab.artboardRect[2] - ab.artboardRect[0],
//                 height: ab.artboardRect[1] - ab.artboardRect[3],
//                 pos: ab.artboardRect,
//                 tilecount: null,
//                 tilerows: null,
//                 checked: false
//             };
//             map.tilerows = map.width / 256;
//             map.tilecount = Math.pow(map.tilerows, 2);
//             message.push(map);
//             generatePreview(index);
//         }
//     }
//     return JSON.stringify(message);
// }
// function generatePreview(index) {
//     // not necessary with screen capture, doesn't use active artboard.
//     // fitin command flashes to end, artboards don't snap in sequence
//         // app.activeDocument.artboards.setActiveArtboardIndex(index);
//         // app.executeMenuCommand("fitin");
//     var fileSpec = new File(dest + index + '.png');
//     try {
//         app.activeDocument.imageCapture(fileSpec, app.activeDocument.artboards[index].artboardRect);
//     } catch (err) {
//         alert(err);
//     } finally {
//         JSXEvent(index, 'step');
//     }
// }


// function exportTilemap(opts) {
//     opts = JSON.parse(opts);
//     setOptions(opts);
//     for (let i = 0; i < opts.boards.length; i++)
//         exportTileBoard(opts.boards[i]);

//     let message = 'Exporting complete'
//     return true;
// }

// function exportSelectedTiles(group) {
//     // alert(group)
//     group = JSON.parse(group);

//     for (let i = 0; i < group.length; i++) {
//         const tile = group[i];
//         // console.log(options.path + tile.name + ', ' + tile.rect.join(','))
//         exportTile(tile.name, options.path, tile.rect);
//     }
//     return true;
// }

// function exportTileBoard(board) {
//     for (let i = 0; i < board.grid.length; i++) {
//         const cell = board.grid[i];
//         exportTile(cell.name, options.path, cell.rect)
//     }
// }


// function exportTile(name, path, rect) {
//     var fileSpec = new File(path + name);
//     try {
//         app.activeDocument.imageCapture(fileSpec, rect);
//     } catch (err) {
//         console.log(err);
//     } finally {
//         console.log("Exported > " + path + name + ' at ' + rect.join())
//     }
// }


function isInt(value) {
    var x;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

// function JSXEvent(payload, eventType) {
//     try {
//         var xLib = new ExternalObject("lib:\PlugPlugExternalObject");
//     } catch (e) {
//         JSXEvent(e, 'console')
//     }
//     if (xLib) {
//         var eventObj = new CSXSEvent();
//         eventObj.type = eventType;
//         eventObj.data = payload;
//         eventObj.dispatch();
//     }
//     return;
// }