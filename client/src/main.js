import { createApp } from 'vue'
import App from './App.vue'
import router from './app/router'
import './shared/styles/theme.css'
import { bootstrapAuthState } from './app/bootstrap/authBootstrap'

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

bootstrapAuthState()
createApp(App).use(router).mount('#app')
