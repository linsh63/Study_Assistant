// 定义 API 端点
const API_URL = window.API_URL || '/api';

// 检查用户是否已登录
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            credentials: 'include' // 确保发送 cookies 以保持会话
        });
        
        if (!response.ok) {
            // 未登录，重定向到登录页
            window.location.href = 'login.html';
            return false;
        }
        
        const user = await response.json();
        // 显示用户名 - 如果有用户名显示区域的话
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = user.username;
        }
        return true;
    } catch (error) {
        console.error('检查登录状态失败:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// 退出登录
async function logout() {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        // 清除本地存储的任务数据
        localStorage.removeItem('tasks');
        
        // 重定向到登录页
        window.location.href = 'login.html';
    } catch (error) {
        console.error('退出登录失败:', error);
    }
}

// 添加主页按钮到合适位置
function addHomeButton() {
    // 查找视图切换区域或标题区域
    const viewSwitchArea = document.querySelector('.view-switch') || document.querySelector('.app-header');
    
    if (viewSwitchArea) {
        // 创建主页按钮
        const homeBtn = document.createElement('button');
        homeBtn.id = 'homeBtn';
        homeBtn.className = 'ml-auto px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md flex items-center';
        homeBtn.innerHTML = '<i class="fas fa-home mr-1"></i> 主页';
        homeBtn.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
        
        // 添加到视图切换区域
        viewSwitchArea.appendChild(homeBtn);
    } else {
        // 如果找不到合适的位置，创建一个固定在右上角的浮动按钮
        const homeBtn = document.createElement('button');
        homeBtn.id = 'homeBtn';
        homeBtn.className = 'fixed top-4 right-4 z-10 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md shadow-md flex items-center';
        homeBtn.innerHTML = '<i class="fas fa-home mr-1"></i> 主页';
        homeBtn.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
        
        document.body.appendChild(homeBtn);
    }
}

export { checkAuth, logout, addHomeButton };