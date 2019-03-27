<template>
  <v-app dark>
    <notification ref="notification" :text="notificationText" :color="notificationStatus" />
    <navbar />
    <v-progress-linear
      v-model="progress.value"
      :active="progress.show"
      :indeterminate="progress.query"
      :query="true"
      :style="bumpLoaderUp()"
      height="3"
      :color="checkProgress()"
      ></v-progress-linear>
    <v-content id="content">
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
import HelloWorld from './components/HelloWorld'
import navbar from './components/nav/main'
import notification from './components/notification'

export default {
  name: 'App',
  components: {
    navbar,
    notification
  },
  data: () => ({
    macOS: false,
    csInterface: null,
    preview: null,
    gridsAreLoaded: false,
    boards: [],
    notificationText: 'Done!',
    notificationStatus: 'primary',
    progress: {
      value: 0,
      show: true,
      query: false,
    },
    
    masterBoard: null,
    autoOpts: ['ext', 'keyword', 'path', 'pattern', 'size', 'mapTypeID'],
    settings: {
      boards: null,
      ext: null,
      baseZoom: 4,
      keyword: null,
      mapTypeID: null,
      max: 5,
      min: 0,
      path: null,
      pattern: null,
      size: 256,
      previewPath: null,
    },
    rx: {
      z: /\{z\}/i,
      x: /\{x\}/i,
      y: /\{y\}/i,
    },
    exponents: [],
    context: {
      menu: [
        { id: "scan", label: "Scan artboards", enabled: true, checkable: false, checked: false, },
        { id: "refresh", label: "Refresh panel", enabled: true, checkable: false, checked: false, },
        { label: "---" },
        { id: "localhost", label: "Launch debug", enabled: true, checkable: false, checked: false, },
        // { id: "resetoptions", label: "Reset options to default", enabled: true, checkable: false, checked: false, },
      ]
    },
  }),
  computed: {
    storage() {
      return window.localStorage;
    },
    menuString() { return JSON.stringify(this.context); },
    localhost() {
      const debug = window.cep.fs.readFile(`${this.csInterface.getSystemPath(SystemPath.EXTENSION)}/.debug`);
      const port = new RegExp(`\\<Host\\sName\\=\\"${this.csInterface.hostEnvironment.appName}\\"\\sPort\\=\\"(\\d*)`);
      return `http://localhost:${debug.data.match(port)[1]}`;
    },
    realPath() {
      if (this.settings.path) {
        let trailcheck = /[^\/|\\]$/;
        if (trailcheck.test(this.settings.path))
          this.settings.path = this.settings.path + '/'
        if (!this.macOS && this.settings.path) {
          return this.settings.path.split('\\').join('\/');
        } else {
          return this.settings.path;
        }
      } else {
        return this.root + 'src/preview/'
      }
    },
    fileType() {
      return '.' + this.settings.ext.toLowerCase();
    },
    boardCount() {
      return this.settings.max - this.settings.min + 1;
    },
    boardList() {
      let mirror = [];
      for (let i = 0; i < this.boardCount; i++)
        mirror.push(this.settings.min + i);
      return mirror;
    },
    previewFullPath() {
      return `${this.root}/src/preview/grid.png`;
    }
  },
  mounted() {
    if (navigator.platform.indexOf('Win') > -1) { this.macOS = false; } else if (navigator.platform.indexOf('Mac') > -1) { this.macOS = true; }
    this.csInterface = new CSInterface;
    window.csExtra = new CSInterface;
    console.log(this.csInterface)
    if (navigator.platform.indexOf('Win') > -1) { this.macOS = false; } else if (navigator.platform.indexOf('Mac') > -1) { this.macOS = true; }
    this.root = this.csInterface.getSystemPath(SystemPath.EXTENSION);
    this.loadUniversalScripts();
    this.csInterface.addEventListener('console', this.consoler);
    this.csInterface.addEventListener('failedScan', this.failedScan);
    this.csInterface.addEventListener('getScan', this.getScan);
    this.getPowers();
    this.setContextMenu();
    this.getStorage();
    console.log('App is mounted')
  },
  methods: {
    consoler(msg) {
      console.log(msg.data);
    },
    runScript(data) {
      this.csInterface.evalScript(data);
    },
    getStorage() {
      this.autoOpts.forEach(item => {
        this.settings[item] = this.storage.getItem(item);
      });
      this.settings.size = +this.settings.size;
      // this.storage.setItem('baseZoom', 0);
      this.settings.baseZoom = +this.storage.getItem('baseZoom');
      console.log(this.settings);
      // this.runScript(`setPreviewPath('${this.root}/preview/')`)
      this.updateOptions();
    },
    failedScan() {
      alert('Scan failed!')
    },
    updateOptions() {
      let opts = JSON.stringify(this.getOptions());
      this.runScript(`setAutoOptions('${opts}')`)
    },
    getOptions() {
      return {
        ext: this.fileType,
        keyword: this.settings.keyword,
        max: this.settings.max,
        min: this.settings.min,
        path: this.realPath,
        pattern: this.settings.pattern,
        size: this.settings.size,
        mapTypeID: this.settings.mapTypeID,
        previewPath: `${this.root}/src/preview/grid`,
      }
    },
    readBoards() {
      this.csInterface.evalScript(`readArtboards('${JSON.stringify(this.getOptions())}')`, this.getScannedArtboard)
    },
    getScannedArtboard(msg) {
      msg = JSON.parse(msg)
      // @@ This currently only accepts the first match
      this.masterBoard = msg[0];
      this.constructBoards();
    },
    constructBoards() {
      this.boards = [];

      this.baseZoom = this.findZoomLevel(this.masterBoard.width/this.settings.size)
      for (let i = 0; i < this.boardList.length; i++) {
        const index = this.boardList[i];
        if (index !== this.baseZoom) {
          let baseScale = this.masterBoard.width / Math.sqrt(this.exponents[i]);
          this.boards.push({
            zoomLevel: i,
            name: this.masterBoard.name,
            height: this.masterBoard.height,
            width: this.masterBoard.width,
            pos: this.masterBoard.pos,
            tilecount: this.exponents[i],
            tilerows: Math.sqrt(this.exponents[i]),
            grid: [],
            scale: this.settings.size / baseScale * 100, 
          })
        } else {
          this.boards.push({
            zoomLevel: this.baseZoom,
            name: this.masterBoard.name,
            height: this.masterBoard.height,
            width: this.masterBoard.width,
            pos: this.masterBoard.pos,
            tilecount: this.masterBoard.tilecount,
            tilerows: this.masterBoard.tilerows,
            grid: [],
            scale: 100, 
          });
        }
      }
      this.constructGrids();
    },
    constructGrids() { 
      this.boards.forEach(board => {
        // board.zoomLevel = this.findZoomLevel(board.width/this.opts.size);
        let mirror = [];
        for (let i = 0; i < board.tilecount; i++) {

          const inverseScale = 100 / board.scale;

          console.log(inverseScale);
          const scaledSize = inverseScale * this.settings.size;
          const column = i % board.tilerows;
          const row = (i >= board.tilerows) ? Math.floor(i/board.tilerows) : 0;
          const x1 = (column * scaledSize) + board.pos[0];
          const y1 = (row * scaledSize)*-1 - board.pos[1];
          if (y1 === -0)
            y1 = 0;
          const x2 = (+x1) + (+scaledSize);
          const y2 = y1 - scaledSize;
          let quad = null;
          if (column + 1 > (board.tilerows/2)) {
            // targ is E
            if (row + 1 > (board.tilerows/2)) {
              quad = 3;
            } else {
              quad = 1;
            }
          } else {
            if (row + 1 > (board.tilerows/2)) {
              quad = 2;
            } else {
              quad = 0;
            }
            // targ is W
          }
          mirror.push({
            name: null,
            x: column,
            y: row,
            z: board.zoomLevel,
            quadrant: quad,
            exists: false,
            selected: false,
            hover: false,
            rect: [x1, y1, x2, y2],
            scale: board.scale,
          });
          // console.log(`calculated zoom: ${board.zoomLevel}, tile ${i} at column ${column}, row ${row} has rect: [${x1}, ${y1}, ${x2}, ${y2}]`)
        }
        board.grid = mirror;
      });
      this.injectNameFromPattern();
      // console.log(this.boards)
      this.gridsAreLoaded = true;
    },
    injectNameFromPattern() {
      let mirror = [];
      this.boards.forEach(board => {
        board.grid.forEach(cell => {
          // let str = this.settings.pattern + this.fileType;
          let str = this.settings.pattern;
          str = str.replace(this.rx.z, cell.z);
          str = str.replace(this.rx.x, cell.x);
          str = str.replace(this.rx.y, cell.y);
          str = str.replace(/\.{2,}/, '.');
          cell.name = str;
        })
      }) 
    },
    checkProgress() {
      if ((!this.progress.query) && (this.progress.value == 0))
        return 'transparent'
      else
        return 'primary'
    },
    bumpLoaderUp() {
      return `
        position: absolute;
        top: 19px;
        z-index: 1000;
      `
      // return ``
    },
    startProgressLoader() {
      this.progress.query = true
      this.progress.show = true
      this.progress.value = 0
    },
    stopProgressLoader() {
      this.progress.query = false;
    },
    loadUniversalScripts() {
      this.csInterface.evalScript(`$.evalFile('${this.root}/src/host/universal/json2.jsx')`)
      this.csInterface.evalScript(`$.evalFile('${this.root}/src/host/universal/Console.jsx')`)
      this.csInterface.evalScript(`$.evalFile('${this.root}/src/host/${this.csInterface.hostEnvironment.appName}/host.jsx')`)
      // console.log(`${this.root}/src/host/${this.csInterface.hostEnvironment.appName}/host.jsx`)
    },
    findZoomLevel(num) {
      for (let i = 0; i < this.exponents.length; i++) {
        const exp = this.exponents[i];
        if (i > 0) {
          if (Math.sqrt(exp) == num)
            return i;
        } else {
          if (exp == num)
            return 0;
        }
      }
    },
    getPowers() {
      for (let i = 0; i < 10; i++)
        this.exponents.push(Math.pow(4, i))
    },
    setContextMenu() {
      this.csInterface.setContextMenuByJSON(this.menuString, this.contextMenuClicked);
    },
    contextMenuClicked(id) {
      if (id == 'refresh')
        location.reload()
      else if (id == 'scan')
        this.readBoards();
      else if (id == 'localhost')
        cep.util.openURLInDefaultBrowser(this.localhost);
    },
    getCSS(prop) {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop);
    },
    setCSS(prop, data) {
      document.documentElement.style.setProperty('--' + prop, data);
    },
  }
}
</script>


<style>
:root {
  --color-bg: #323232;
  --color-dark: #1f1f1f;
  --color-selection: #46a0f5;
  --color-disabled: #525252;
  --color-hover: rgba(255,255,225,.2);
  --color-icon: #b7b7b7;
  --color-scrollbar: #2a2a2a;
  --color-scrollbar-thumb: #3e3e3e;
  --color-scrollbar-thumb-hover: #525252;
  --scrollbar-width: 14px;
  --scrollbar-thumb-width: 14px;
  --scrollbar-thumb-radius: 20px;

  --grid-width: calc(100vw - 32px);

  /* --navbar-height: 36px; */
  --content-height-offset: 40px;
  --content-height: calc(100vh - var(--content-height-offset));
}

body::-webkit-scrollbar {
  display: none;
}

/* ::-webkit-scrollbar {
  display: none;
} */


.theme--dark.v-toolbar {
  background-color: var(--color-dark);
}
.theme--dark.application {
  background: var(--color-bg);
}


.v-content__wrap {
  height: var(--content-height);
  /* border: 2px solid red; */
  overflow-y: auto;
}


::-webkit-scrollbar {
  background-color: var(--color-scrollbar);
  width: var(--scrollbar-width);
}
::-webkit-scrollbar-thumb {
  width: var(--scrollbar-width);
  background: var(--color-scrollbar-thumb);
  border-radius: var(--scrollbar-thumb-radius);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}
::-webkit-scrollbar-resizer{
  display: none;
}
::-webkit-scrollbar-button {
  height: 0px;
}
</style>
