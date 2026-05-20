import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import { bootstrapAuthState } from './bootstrap/authBootstrap'

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

bootstrapAuthState()
createApp(App).use(router).mount('#app')
