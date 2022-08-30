import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
// import bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import router from './router';

createApp(App).use(router).mount('#app');
