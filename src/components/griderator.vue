<template>
    <v-container style="height:100%;">
        <v-layout v-if="hasGrids" 
            class="mb-2">
            <v-flex xs12>
                <v-alert
                    :value="true"
                    :type="getAlertType()"
                    >
                        <div class="annoSplit">
                            <div>
                                <!-- <span>ID:</span> -->
                                <span class="headline">{{app.settings.mapTypeID}}</span>
                            </div>
                            <span>{{getMissingAnno()}}</span>
                        </div>
                </v-alert>
            </v-flex>
        </v-layout>
        <v-layout v-if="hasGrids">
            <v-flex xs2>
                <v-btn color="grey darken-3" block
                    :disabled="selectedCells.length !== activeGrid.length ? false : true"
                    @click="selectAllCells()">
                    <v-icon>select_all</v-icon>
                </v-btn>
            </v-flex>
            <v-flex xs2>
                <v-btn color="grey darken-3" block
                    :disabled="selectedCells.length == activeGrid.length ? true : missingCells.length ? missingAreSelected ? true : false : true"
                    @click="selectMissingCells()">
                    <v-icon>image_search</v-icon>
                </v-btn>
            </v-flex>
            <v-flex xs2>
                <v-btn color="grey darken-3" block
                    :disabled="selectedCells.length ? false : true"
                    @click="deselectAllCells()">
                    <v-icon>clear</v-icon>
                </v-btn>
            </v-flex>
            <v-flex xs2>
                <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                        <v-btn
                        block
                        color="grey darken-3"
                        v-on="on"
                        >
                            <v-icon>{{activeTool.icon}}</v-icon>
                        </v-btn>
                    </template>
                    <v-btn
                        v-for="tool in tools" :key="tool.name"
                        v-show="activeTool.name !== tool.name" 
                        block color="grey darken-3"
                        @click="toolName = tool.name">
                        <v-icon>{{tool.icon}}</v-icon>
                    </v-btn>
                    <!-- <v-btn 
                        v-show="activeTool.name !== 'auto'" 
                        block color="grey darken-3"
                        @click="toolName == 'auto'">
                        <v-icon>find_replace</v-icon>
                    </v-btn> 
                    <v-btn 
                        v-show="activeTool.name !== 'adder'" 
                        block color="grey darken-3"
                        @click="toolName == 'adder'">
                        <v-icon>add_box</v-icon>
                    </v-btn>
                    <v-btn 
                        v-show="activeTool.name !== 'eraser'" 
                        block color="grey darken-3"
                        @click="toolName == 'eraser'">
                        <v-icon>indeterminate_check_box</v-icon>
                    </v-btn> -->
                </v-menu>
            </v-flex>
            <v-flex xs4>
                <v-layout v-if="hasGrids">
                    <v-flex xs4>
                        <v-btn color="grey darken-3" block
                            @click="lastStep">
                            <v-icon>arrow_left</v-icon>
                        </v-btn>
                    </v-flex>
                    <v-flex xs4>
                        <span class="grey darken-3 zoomNumber headline">{{currentLevel}}</span>
                    </v-flex>
                    <v-flex xs4>
                        <v-btn block color="grey darken-3" block
                            @click="nextStep">
                            <v-icon>arrow_right</v-icon>
                        </v-btn>
                    </v-flex>
                </v-layout>
            </v-flex>
        </v-layout>
        <!-- <v-btn-toggle v-model="toggle_multiple" multiple>
            <v-btn flat>
                <v-icon>format_align_left</v-icon>
            </v-btn>
            <v-btn flat>
                <v-icon>format_align_center</v-icon>
            </v-btn>
            <v-btn flat>
                <v-icon>format_align_right</v-icon>
            </v-btn>
            <v-btn flat>
                <v-icon>format_align_justify</v-icon>
            </v-btn>
        </v-btn-toggle> -->
        <div v-if="hasGrids" 
            class="square" 
            :style="setPreview()" 
            @mouseenter="inGrid = true;" 
            @mouseleave="deprepGrid()">
            <div class="gridBox" :style="getGridStyle()">
                <div 
                    class="gridCell"
                    v-for="(cell,index) in activeGrid" :key="index"
                    :style="getCellStyle(cell)"
                    @click="clickCell(cell, $event)"
                    @mouseenter="hoverOn(cell, $event)"
                    @mouseleave="hoverOff(cell, $event)"
                    >
                    <span>{{getAbbr(cell.name)}}</span>
                </div>
            </div>
        </div>
        <v-layout>
            <v-flex v-if="hasGrids" xs12>
                <v-btn 
                    @click="exportSelection()"
                    :loading="loading"
                    :disabled="loading ? true : selectedCells.length ? false : true"
                    :color="loading ? 'primary' : 'grey darken-3'" block>
                        <!-- <v-icon>save_alt</v-icon> -->
                        export
                </v-btn>
            </v-flex>                
        </v-layout>
    </v-container>
</template>

<script>
export default {
    name: 'griderator',
    data: () => ({
        toggle_multiple: [0, 1, 2],
        // fakeGrid: [],
        loader: null,
        loading: false,
        currentLevel: 0,
        fileNodes: [],
        lastNodeLength: 0,
        inGrid: false,
        isRoute: false,
        shine: 0,
        activeCell: null,
        dragOrigin: null,
        clickActive: false,
        mods: [false, false, false],
        lastMods: [],
        isPainting: false,
        toolIndex: 0, 
        isAuto: true,
        toolName: 'auto',
        lastToolName: 'auto',
        tools: [
            {
                name: 'auto',
                icon: 'find_replace',
                tooltip: 'Inverse of cell clicked'
            },
            {
                name: 'adder',
                icon: 'add_box',
                tooltip: 'Add to selection',
            },
            {
                name: 'eraser',
                icon: 'indeterminate_check_box',
                tooltip: 'Subtract from selection',
            },
            
        ]
    }),
    computed: {
        app() {
            return this.$root.$children[0];
        },
        activeTool() {
            return this.tools.find((tool) => {
                return tool.name == this.toolName;
            });
        },
        hasGrids() {
            if (this.app.gridsAreLoaded) {
                return true;
            } else {
                return false;
            }
        },
        missingAreSelected() {
            let res = true;
            this.missingCells.forEach((cell) => {
                if (!cell.selected)
                    res = false;
            })
            return res;
        },
        activeBoard() {
            if (this.hasGrids) {
                return this.app.boards.find((board) => {
                    return board.zoomLevel == this.currentLevel;
                });
            }
        },
        activeGrid() {
            if (this.hasGrids) {
                return this.app.boards.find((board) => {
                    return board.zoomLevel == this.currentLevel;
                }).grid;
            }
        },
        selectedCells() {
            if (this.hasGrids) {
                return this.activeGrid.filter((cell) => {
                    return cell.selected;
                })
            } else {
                return [];
            }
        },
        missingCells() {
            if (this.hasGrids) {
                return this.activeGrid.filter((cell) => {
                    return !this.cellExists(cell);
                })
            } else {
                return [];
            }
        },
        isDragging() {
            return this.clickActive;
        },
        Ctrl() {
            return this.mods[0];
        },
        Shift() {
            return this.mods[1];
        },
        Alt() {
            return this.mods[2];
        },
        toolIsAuto() {
            if (name !== 'auto')
                return false;
            else
                return true;
        }
        // mods() {
        //     return [].push(this.Ctrl).push(this.Shift).push(this.Alt);
        // }
    },
    watch: {
        hasGrids(state) {
            if (state) {
                this.app.csInterface.evalScript(`generateThumbnail()`)
            }
        },
        Shift(state) {
            
        }
        
    },
    mounted() {
        console.log('Griderator mounted');
        this.currentLevel = this.app.settings.min;
        setInterval(this.checkFileNodes, 200);
        window.addEventListener('keydown', this.checkMods);
        window.addEventListener('keyup', this.checkMods);
        window.addEventListener('mousedown', this.clickIsDown);
        window.addEventListener('mouseup', this.clickIsUp);
        window.addEventListener('wheel', this.mouseWheel);
    },
    methods: {
        getAlertType() {
            if (this.missingCells.length) {
                return 'error';
            } else {
                return 'success';
            }
        },
        getMissingAnno() {
                if (this.missingCells.length) {
                    return `${this.activeGrid.length - this.missingCells.length} of ${this.activeGrid.length}`;
                } else {
                    return `${this.activeGrid.length} tile${this.activeGrid.length !== 1 ? 's' : ''}`
                }
        },
        selectMissingCells() {
            this.missingCells.forEach((cell) => {
                cell.selected = true;
            })
        },
        selectAllCells() {
            this.activeGrid.forEach((cell) => {
                cell.selected = true;
            })
        },
        deselectAllCells() {
            this.selectedCells.forEach((cell) => {
                cell.selected = false;
            })
        },
        exportSelection() {
            console.log(this.selectedCells)
            console.log('Export to Illustrator')
            this.loading = true;
            this.app.startProgressLoader();
            this.app.updateOptions();
            this.app.csInterface.evalScript(`exportTilemap('${JSON.stringify(this.selectedCells)}')`, this.confirmExport)
            this.clearAllSelected();
        },
        confirmExport(msg) {
            console.log(msg);
            this.loading = false;
            this.app.stopProgressLoader();
            this.app.$refs.notification.show();
        },
        deprepGrid() {
            this.inGrid = false;
            this.clearAllHovers();
        },
        convertHoversToSelection(state) {
            this.activeGrid.forEach((cell) => {
                if (cell.hover) {
                    cell.selected = state;
                }
            })
        },
        nextStep() {
            if (this.currentLevel === this.app.settings.max) {
                this.currentLevel = this.app.settings.min;
            } else {
                this.currentLevel++;
            }
            // console.log(this.currentLevel);
        },
        lastStep() {
            if (this.currentLevel === this.app.settings.min) {
                this.currentLevel = this.app.settings.max;
            } else {
                this.currentLevel--;
            }
            this.limitShine();
            // console.log(this.currentLevel);
        },
        getGridStyle(board) {
            return `
                display: grid;
                grid-template-columns: repeat(${(this.activeBoard) ? this.activeBoard.tilerows : 0}, 1fr);
                width: 100%;
                height: 100%;
                border: ${this.currentLevel > 2 ? '.5' : '.75'}px solid var(--color-disabled);
            `
        },
        mouseWheel(evt) {
            if (this.inGrid) {
                if (this.$route.name !== 'settings') {
                    let state = null;
                    if (evt.deltaY < 0)
                        state = true;
                    else
                        state = false;
                    this.incrementShine(state);
                }
            }
        },
        limitShine() {
            if (this.shine > this.activeBoard.tilerows) {
                this.shine = this.activeBoard.tilerows;
                console.log(`Shine limited to ${this.shine}`);
            }
        },
        incrementShine(state) {
            if (state) {
                if (this.shine < this.activeBoard.tilerows - 1) {
                    this.shine++;
                }
            } else {
                this.limitShine();
                if (this.shine > 0)
                    this.shine--;
            }
            this.clearAllHovers();
            // console.log(this.shine);
            // if (this.shine)
            this.highlightShineRadius();
        },
        highlightShineRadius() {
            if (!this.Ctrl) {
                this.activeGrid.forEach((cell) => {
                    let match = false;
                    if (((cell.x >= this.activeCell.x - this.shine)
                        && (cell.x <= this.activeCell.x + this.shine)) 
                        && ((cell.y >= this.activeCell.y - this.shine)
                        && (cell.y <= this.activeCell.y + this.shine))) {
                            cell.hover = true;
                    } else {
                        cell.hover = false;
                    }
                })
            }
            if (this.isPainting) {
                this.convertHoversToSelection(this.activeCell.selected)
            } else {

            }
        },
        MouseWheelHandler(e) {
            // cross-browser wheel delta
            var e = window.event || e; // old IE support
            var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
            console.log(delta);
            // return false;
        },
        clickIsDown() {
            if (this.inGrid) {
                // console.log(this.activeCell);
                this.isRoute = false;
                this.clickActive = true;
                if (!this.Ctrl) {
                    if (this.activeTool.name == 'auto') {
                        this.isAuto = true;
                        this.lastToolName = 'auto';
                        // this.toolIsAuto = true;
                        this.activeCell.selected = !this.activeCell.selected;
                        if (this.activeCell.selected) {
                            this.toolName = 'adder';
                        } else {
                            this.toolName = 'eraser';
                        }
                    } else if (this.activeTool.name == 'adder') {
                        this.activeCell.selected = true;
                    } else if (this.activeTool.name == 'eraser') {
                        this.activeCell.selected = false;
                    }
                    this.isPainting = this.activeCell.selected;
                    this.dragOrigin = this.activeCell;
                } else {
                    this.convertHoversToSelection(!this.activeCell.selected)
                }
                if (this.shine) {
                    this.convertHoversToSelection(this.activeCell.selected)
                }
            }
        },
        clickIsUp(evt) {
            if (this.inGrid) {
                // if (this.toolIsAuto) {
                //     if ((!evt.shiftKey) || (!evt.altKey)) {

                //         this.toolName = 'auto';
                //     } else {
                //         console.log('not')
                //     }
                // }
                this.clickActive = false;
                this.isPainting = false;
                if (this.isAuto)
                    this.toolName = this.lastToolName;
            }
        },
        checkMods(evt) {
            if (this.$route.name !== 'settings') {
                if (/up/i.test(evt.type)) {
                    if (/arrow/i.test(evt.key)) {
                        if (/up/i.test(evt.key))
                            this.incrementShine(true)
                        else if (/down/i.test(evt.key))
                            this.incrementShine(false)
                    }
                }
                let x, y, z;
                if (((!this.app.macOS) && (evt.ctrlKey)) || ((this.app.macOS) && (evt.metaKey))) {
                    x = true;
                } else {
                    x = false;
                }
                if (evt.shiftKey)
                    y = true;
                else
                    y = false;
                if (evt.altKey) {
                    evt.preventDefault();
                    z = true;
                } else {
                    z = false;
                };
                this.mods = [x, y, z];
                if (!this.arraysEqual(this.lastMods, this.mods)) {
                    this.lastMods = this.mods;
                    if (/control|meta/i.test(evt.key)) {
                        if (!this.Ctrl) {
                            this.clearAllHoversExceptActive()
                        } else {
                            this.highlightQuadrantOf(this.activeCell, true);
                        }
                    }
                    if (/shift/i.test(evt.key)) {
                        if (!this.Shift) {
                            this.toolName = this.lastToolName;
                        } else {
                            this.lastToolName = this.toolName;
                            this.toolName = 'adder';
                            this.isAuto = false;
                        }
                    }
                    if (/alt/i.test(evt.key)) {
                        if (!this.Alt) {
                            this.toolName = this.lastToolName;
                        } else {
                            this.lastToolName = this.toolName;
                            this.toolName = 'eraser';
                        }
                        this.isAuto = false;
                    }
                }
            }
            
        },
        arraysEqual(a1,a2) {
            return JSON.stringify(a1)==JSON.stringify(a2);
        },
        clickCell(cell, evt) {
            if (!this.isPainting) {
                this.activeCell = cell;
                if (!this.dragOrigin == cell) {
                    console.log('This.')
                    this.convertHoversToSelection(!cell.selected);
                    // cell.selected = !cell.selected;
                }
            } else {
                // pass
            }
            
        },
        clearAllHoversExceptActive() {
            this.activeGrid.forEach(cell => {
                cell.hover = false;
            })
            this.activeCell.hover = true;
        },
        clearAllHovers() {
            this.activeGrid.forEach(cell => {
                cell.hover = false;
            })
        },
        clearAllSelected() {
            this.activeGrid.forEach(cell => {
                cell.selected = false;
            })
        },
        hoverOn(cell, evt) {
            this.activeCell = cell;
            cell.hover = true;
            // console.log(this.isDragging)
            if (this.dragOrigin !== cell)
                this.isRoute = true;
            
            
            if (this.isDragging) {
                // cell.selected = this.isPainting;
                this.convertHoversToSelection(this.isPainting)
                // console.log('Here?')
            } else {
                if (this.Ctrl)
                    this.highlightQuadrantOf(cell, true);
            }
            if (this.shine) {
                this.highlightShineRadius();
            }
        },
        hoverOff(cell, evt) {
            cell.hover = false;
            // if (this.shine)
            //     this.highlightShineRadius();
        },
        highlightQuadrantOf(targ, state) {
            this.activeGrid.forEach(cell => {
                if (cell.quadrant == targ.quadrant) 
                    cell.hover = true;
                else
                    cell.hover = false;
            })
        },
        getCellStyle(cell) {
            // console.log('hello')
            let style = `
                display: flex;
                justify-content: center;
                align-items: flex-end;
                padding-bottom:.25rem;
                overflow: hidden;
                border-width: ${this.currentLevel > 2 ? '.5' : '.75'}px;
                font-size: ${this.currentLevel < 3 ? '1rem' : '.5rem'};
            `
            if (cell.selected) {
                style += `border-color: var(--color-selection);
                color: var(--color-selection);
                background-color: rgba(70, 160, 245, 0.075);`
            } else if (cell.hover) {
                style += `border-color: white;
                color: white;
                background-color: rgba(160,160,160,0.075);`
            } else {
                style += `border-color: ${(this.cellExists(cell)) ? 'green' : 'red'};
                color: ${(this.cellExists(cell)) ? 'green' : 'red'};
                background-color: rgba(${(this.cellExists(cell)) ? '0,160,0' : '160,0,0'},0.075);`
            }
            
            return style;
        },
        setPreview() {
            if (this.hasGrids) {
                return `background-image: url(${this.app.previewFullPath});`
            } else {
                return ``;
            }
        },
        getAbbr(name) {
            const rx = /[^\d][\d].*/gm;
            const ext = /\..*/gm;
            let result = null;
            result = name.substr(2, name.length);
            result = result.replace(ext, '');
            return result;
        },
        cellExists(cell) {
            // return true;
            if (this.fileNodes.includes(cell.name + this.app.fileType)) {
                cell.exists = true;
                return true;
            } else {
                cell.exists = false;
                return false;
            }
        },
        checkFileNodes() {
            var result = window.cep.fs.readdir(this.app.settings.path);
            if (0 == result.err) {
                if (result.data.length !== this.lastNodeLength) {
                    result = result.data;
                    this.fileNodes = result.filter((file) => {
                        return !/.tmp$/.test(file);
                    })
                    this.lastNodeLength = this.fileNodes.length;
                    console.log(result);
                }
            } else {
                this.fileNodes = [];
            }
        },
    }
}
</script>


<style>
.main-content {
    box-sizing: border-box;
    /* border: 2px solid red; */
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    align-items: center;
    height: 100%;
}

.v-alert {
    padding: 4px 16px;
}

.zoomNumber {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    user-select: none;
    cursor: default;
}

.boardAnno {
    width: 100%;
    height: 32px;
    border: 2px solid var(--color-disabled);
    /* background-color: var(--color-dark); */
}

.square {
    box-sizing: border-box;
    width: var(--grid-width);
    height: var(--grid-width);
    background-size: contain;
    /* border: 2px solid red; */
}

.v-btn {
    min-width: 0px;
}

.v-btn--block {
    margin: 0px;
}

.annoSplit {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.gridCell {
    border-style: solid;
    box-sizing: border-box;
    /* background-color: var(--color-bg); */
    background-color: transparent;
    cursor: pointer;
    user-select: none;
}


</style>
