import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import mermaid from 'mermaid';
import './styles/index.css';

// 全局初始化 Mermaid，用于自动渲染 .mermaid 区块
mermaid.initialize({ startOnLoad: true });

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
