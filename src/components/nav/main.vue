<template>
    <v-toolbar flat id="navbar">
        <v-toolbar-side-icon v-show="notLoading" @click="testNotification"></v-toolbar-side-icon>
        <v-toolbar-title class="font-weight-regular" :style="getTitleStyle()">{{context}}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items v-show="notLoading">
            <div
                class="mt-1" 
                v-for="link in links" 
                :key="link.name"
                @click="goToRoute(link.name)"
                style="cursor: pointer;">
                    <v-icon :style="checkRouteStyle(link)" :class="checkRouteClass(link)">{{link.icon}}</v-icon>
            </div>
        </v-toolbar-items>
    </v-toolbar>
</template>

<script>
export default {
    name: 'navbar',
    data: () => ({
        links: [
            {
                name: 'home',
                icon: 'border_all',
            },
            {
                name: 'settings',
                icon: 'settings',
            },
        ],
        context: '',
    }),
    computed: {
        app() {
            return this.$root.$children[0];
        },
        notLoading() {
            return !this.app.progress.query;
        }
    },
    methods: {
        testNotification() {
            this.app.$refs.notification.show();
        },
        checkRouteClass(link) {
            if (link.name == this.$route.name) {
                return `primary--text`
            } else {
                return `accent--text`
            }
        },
        goToRoute(link) {
            this.$router.push({name: link});
        },
        checkRouteStyle(link) {
            return `
                border-width: 0px 0px 2px 0px;
                border-style: solid;
                padding-bottom: 6px;
                padding-right: 5px;
                padding-left: 5px;
                border-color: ${(link.name == this.$route.name) ? this.app.getCSS('color-selection') : this.app.getCSS('color-disabled')}
                color: ${(link.name == this.$route.name) ? this.app.getCSS('color-selection') : this.app.getCSS('color-disabled')}

            `;
        },
        getTitleStyle() {
            return `
                font-family: 'Roboto';
                cursor: default;
            `
        },
    }
}
</script>

<style>
#navbar {
    user-select: none;
}

.v-btn {
    padding-left: 0px;
    padding-right: 0px;
}

.v-btn__content {
    width: 40px;
}
.v-toolbar__content {
    height: 36px !important;
}

</style>

