import { checkAuth } from './auth.js';
import { init } from './init.js';
import { API_URL } from './api.js';
import './eventListeners.js';

// 设置全局 API URL
window.API_URL = API_URL;

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    init();
});