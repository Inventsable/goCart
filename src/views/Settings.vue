<template>
  <v-card flat>
    <v-layout class="mt-3 ml-3" row wrap>
      <v-flex 
        class=""
        xs5 sm2>
        <v-text-field
          class="pa-2"
          :label="sizeinputs[0].label"
          v-model="sizeinputs[0].value"
          @input="logValue(sizeinputs[0])"
          type="number"
          hide-details
          suffix="px"
        ></v-text-field>
      </v-flex>
      <v-flex xs4 sm2>
        <v-select
          class="pa-2"
          v-model="select"
          :hint="`${this.pattern}${select.abbr}`"
          :items="exts"
          hide-details
          item-text="name"
          item-value="abbr"
          label="Select"
          @input="logExt(select)"
          return-object
          single-line
        ></v-select>
      </v-flex>
      <v-flex 
        v-for="input in midinputs" 
        :key="input.label" 
        class="mt-1"
        xs11 sm5>
        <v-text-field
          class="pa-2"
          :label="input.label"
          v-model="input.value"
          @input="logValue(input)"
          :suffix="(input.label == 'pattern') ? fileType : ''"
          :append-icon="input.icon ? input.icon : ''"
          hide-details
          ></v-text-field>
      </v-flex>
      <v-flex 
        v-for="input in smallinputs" 
        :key="input.label" 
        :class="input.index > 0 ? 'mt-1 ' : 'mt-1 pr-0'" 
        xs5 sm2>
        <v-text-field
          class="pa-2"
          :label="input.label"
          v-model="input.value"
          @input="logValue(input)"
          :suffix="(input.label == 'pattern') ? fileType : ''"
          :append-icon="input.icon ? input.icon : ''"
          hide-details
          :disabled="input.disabled"
          ></v-text-field>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: 'About',
  data: () => ({
    select: { name: 'PNG', abbr: '.png' },
    exts: [
          { name: 'PNG', abbr: '.png' },
          { name: 'JPG', abbr: '.jpg' },
    ],
    midinputs: [
      {
        label: 'pattern',
        value: `{z}-{x}-{y}`,
        parent: 'midinputs',
        index: 0,
      },
      {
        label: 'path',
        value: `C:/Users/TRSch/AppData/Roaming/Adobe/CEP/extensions/go-cart/src/preview`,
        parent: 'midinputs',
        icon: 'folder',
        index: 1,
      },
    ],
    smallinputs: [
      {
        label: 'mapTypeID',
        value: `Terrain`,
        parent: 'smallinputs',
        icon: 'folder',
        index: 0,
        disabled: false,
      },
      {
        label: 'keyword',
        value: `Terrain`,
        parent: 'smallinputs',
        icon: 'vpn_key',
        index: 1,
        disabled: true,
      },
    ],
    sizeinputs: [
      {
        label: 'size',
        value: 256,
        parent: 'sizeinput',
        index: 0,
      },
    ],
    zoomLevels: [0, 6],
    pattern: null,
    path: null,
    maxZoom: null,
    minZoom: 0,
    ext: 'PNG',
  }),
  computed: {
    app() {
      return this.$root.$children[0];
    },
    fileType() {
      return '.' + this.ext.toLowerCase();
    },
    allInputs() {
      return [].concat(this.midinputs.push(this.sizeinput), this.smallinputs);
    }
  },
  mounted() {
    console.log('Settings mounted')
  },
  methods: {
    getExtSelection(name) {
      let match = null;
      this.exts.forEach(ext => {
        if (ext.name == name) {
          match = ext;
        }
      })
      if (match)
        return match;
      else
        return { name: 'PNG', abbr: '.png' };
    },
    recheckRange() {
      // console.log(this.zoomLevels)
    },
    logRange(select) {
      // this.zoomLevels = select;
      // window.localStorage.setItem('min', select[0]);
      // window.localStorage.setItem('max', select[1]);
      // this.$root.$children[0].opts.min = select[0];
      // this.$root.$children[0].opts.max = select[1];
    },
    logExt(select) {
      console.log(select);
      this.ext = select.name;
      window.localStorage.setItem('ext', select.name);
      // this.$root.$children[0].opts.ext = this.fileType;
      // // console.log(this.$root.$children[0].opts)
    },
    logValue(input) {
      this.app.storage.setItem(input.label, input.value);
      console.log(`${input.label}: ${input.value}`);
    },
    getStorage() {
      
    }
  }
}
</script>

<style>
.theme--dark.v-sheet {
  background-color: transparent;
}

.theme--dark.v-card {
  background-color: transparent;
}
</style>
