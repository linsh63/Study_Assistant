// 日期和时间格式化工具
function formatDate(date) {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    }).format(date);
}

function formatDateInput(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(time) {
    return time;
}

// 获取本周一的日期
function getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

// 获取优先级标签
function getPriorityLabel(priority) {
    const labels = {
        'low': '低优先级',
        'medium': '中优先级',
        'high': '高优先级'
    };
    return labels[priority] || '未设置优先级';
}

// 通知提示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${getNotificationClass(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            ${getNotificationIcon(type)}
            <span class="ml-2">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 获取通知样式
function getNotificationClass(type) {
    const classes = {
        'success': 'bg-green-100 text-green-800 border border-green-200',
        'error': 'bg-red-100 text-red-800 border border-red-200',
        'warning': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'info': 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return classes[type] || classes.info;
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        'success': '<i class="fas fa-check-circle text-green-500"></i>',
        'error': '<i class="fas fa-exclamation-circle text-red-500"></i>',
        'warning': '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
        'info': '<i class="fas fa-info-circle text-blue-500"></i>'
    };
    return icons[type] || icons.info;
}

// 滚动到当前时间（日视图）
function scrollToCurrentTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const timeline = document.getElementById('timeline');
    const hourElement = timeline?.querySelector(`div[data-hour="${currentHour}"]`);
    
    if (hourElement) {
        const container = document.querySelector('.scroll-container');
        const containerRect = container.getBoundingClientRect();
        const elementRect = hourElement.getBoundingClientRect();
        
        container.scrollTo({
            top: elementRect.top - containerRect.top - containerRect.height / 2,
            behavior: 'smooth'
        });
        
        // 添加高亮效果
        hourElement.classList.add('highlight-hour');
        setTimeout(() => {
            hourElement.classList.remove('highlight-hour');
        }, 2000);
    }
}

// 滚动到周视图当前时间
function scrollToCurrentTimeWeek() {
    const now = new Date();
    const currentHour = now.getHours();
    const weekTimeline = document.getElementById('week-timeline');
    const hourRow = weekTimeline?.querySelector(`tr[data-hour="${currentHour}"]`);
    
    if (hourRow) {
        const container = document.querySelector('#week-view .scroll-container');
        const containerRect = container.getBoundingClientRect();
        const rowRect = hourRow.getBoundingClientRect();
        
        container.scrollTo({
            top: rowRect.top - containerRect.top - containerRect.height / 2,
            behavior: 'smooth'
        });
        
        // 添加高亮效果
        hourRow.classList.add('highlight-hour');
        setTimeout(() => {
            hourRow.classList.remove('highlight-hour');
        }, 2000);
    }
}

// 导出工具函数
export {
    formatDate,
    formatDateInput,
    formatTime,
    getMonday,
    getPriorityLabel,
    showNotification,
    scrollToCurrentTime,
    scrollToCurrentTimeWeek
};