import {createApp} from 'vue'
import App from './App.vue'
import './style.scss'
import {createPinia} from 'pinia';
import router from "~/router/index";
import VueTelegram from 'vue-tg'

// Vuetify
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import * as vuetifyComponents from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// VueDatePicker
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

export const vuetify = createVuetify({
    components: {
        ...vuetifyComponents,
    },
    directives,
    icons: {
        defaultSet: 'mdi',
    },
})

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(VueTelegram);

app.component('VueDatePicker', VueDatePicker);

app.mount('#app');
