import { checkAuth, addHomeButton } from './auth.js';
import { fetchTasks, syncTasksWithServer } from './api.js';
import { setupEventListeners } from './eventListeners.js';
import { renderTasks, updateTaskCount, renderDayView, renderWeekView } from './viewManagement.js';
import { formatDate, formatDateInput } from './utils.js';

// 初始化函数
async function init() {
    // 设置当前日期和任务日期默认值
    const now = new Date();
    currentDate.textContent = formatDate(now);
    taskDate.value = formatDateInput(now);
    
    // 设置时间默认值为下一个整点
    const nextHour = now.getHours() + 1;
    taskTime.value = `${nextHour.toString().padStart(2, '0')}:00`;
    
    // 初始化视图
    renderTasks();
    updateTaskCount();
    renderDayView();
    renderWeekView();
    
    // 设置事件监听器
    setupEventListeners();

    // 确保导入课程表按钮已绑定
    const importScheduleBtn = document.getElementById('import-schedule-btn');
    if (importScheduleBtn) {
        importScheduleBtn.addEventListener('click', importSchedule);
    } else {
        console.error('未找到导入课程表按钮');
    }
}

// 在页面加载时检查登录状态并获取任务
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 检查用户是否已登录
        const isLoggedIn = await checkAuth();
        
        if (isLoggedIn) {
            // 用户已登录，初始化任务管理系统
            init();
            
            // 添加主页按钮
            const homeBtn = document.getElementById('homeBtn');
            if (homeBtn) {
                homeBtn.addEventListener('click', function() {
                    window.location.href = 'dashboard.html';
                });
            } else {
                addHomeButton();
            }
            
            // 从服务器获取任务
            await fetchTasks();
        }
    } catch (error) {
        console.error('初始化失败:', error);
        showNotification('初始化失败: ' + error.message, 'error');
    }
});

// 检测网络状态变化并同步数据
window.addEventListener('online', async function() {
    showNotification('网络已恢复，正在同步数据...', 'info');
    try {
        await syncTasksWithServer();
        showNotification('数据同步成功', 'success');
    } catch (error) {
        console.error('数据同步失败:', error);
        showNotification('数据同步失败，请手动刷新页面', 'error');
    }
});

export { init };