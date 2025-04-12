// 添加到 TodoList.js 文件顶部
// 定义 API 端点
const API_URL = window.API_URL || '/api'; // 可以通过全局变量覆盖或使用默认值

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

document.addEventListener('DOMContentLoaded', async function() {
    // 首先检查用户是否已登录
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        // 用户已登录，初始化任务管理系统
        init();
        
        // 添加主页按钮 - 替代原来的退出登录按钮
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', function() {
                window.location.href = 'dashboard.html'; // 导航到主页
            });
        } else {
            // 如果按钮不存在，创建一个主页按钮并添加到合适的位置
            addHomeButton();
            await fetchTasks();
        }
    }
    // 如果未登录，checkAuth 函数已经处理了重定向
});

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

// 从服务器获取任务
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('获取任务失败');
        }
        
        const fetchedTasks = await response.json();
        tasks = fetchedTasks;
        
        // 更新本地存储
        saveTasks();
        
        // 重新渲染视图
        renderTasks();
        updateTaskCount();
        
        if (dayView.classList.contains('view-visible')) {
            renderDayView();
        } else if (weekView.classList.contains('view-visible')) {
            renderWeekView();
        }
    } catch (error) {
        console.error('获取任务出错:', error);
        
        // 如果获取失败，使用本地存储的任务数据
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }
}

// 修改 saveTasks 函数，同步到服务器
async function saveTasks() {
    // 保存到本地存储
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    try {
        // 同步到服务器
        await fetch(`${API_URL}/tasks/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ tasks })
        });
    } catch (error) {
        console.error('同步任务到服务器失败:', error);
        // 继续使用本地存储，不中断用户操作
    }
}

// 原有的初始化函数保持不变，但需要将其移出 DOMContentLoaded 事件监听器
function init() {
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
}

// 常量定义
const DAY_MS = 86400000;
const WEEK_MS = 604800000;
const HOUR_MS = 3600000;

// DOM元素
const taskInput = document.getElementById('task-input');
const taskDate = document.getElementById('task-date');
const taskTime = document.getElementById('task-time');
const prioritySelect = document.getElementById('priority-select');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');
const currentDate = document.getElementById('current-date');

// 视图元素
const listView = document.getElementById('list-view');
const dayView = document.getElementById('day-view');
const weekView = document.getElementById('week-view');
const listViewBtn = document.getElementById('list-view-btn');
const dayViewBtn = document.getElementById('day-view-btn');
const weekViewBtn = document.getElementById('week-view-btn');

// 日视图元素
const timeline = document.getElementById('timeline');
const dayViewDate = document.getElementById('day-view-date');
const dayPrevBtn = document.getElementById('day-prev');
const dayNextBtn = document.getElementById('day-next');
const dayTodayBtn = document.getElementById('day-today');
const scrollToNowBtn = document.getElementById('scroll-to-now');

// 周视图元素
const weekTimeline = document.getElementById('week-timeline');
const weekViewDate = document.getElementById('week-view-date');
const weekDaysHeader = document.getElementById('week-days-header');
const weekHoursBody = document.getElementById('week-hours-body');
const weekPrevBtn = document.getElementById('week-prev');
const weekNextBtn = document.getElementById('week-next');
const weekTodayBtn = document.getElementById('week-today');
const scrollToNowWeekBtn = document.getElementById('scroll-to-now-week');

// 状态变量
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentDayViewDate = new Date();
let currentWeekStartDate = getMonday(new Date());

// 设置事件监听器
function setupEventListeners() {
    // 添加任务事件
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // 过滤按钮事件
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });
    
    // 视图切换
    listViewBtn.addEventListener('click', function() {
        setActiveView('list');
    });
    
    dayViewBtn.addEventListener('click', function() {
        setActiveView('day');
    });
    
    weekViewBtn.addEventListener('click', function() {
        setActiveView('week');
        renderWeekView();
    });
    
    // 日视图导航
    dayPrevBtn.addEventListener('click', function() {
        currentDayViewDate = new Date(currentDayViewDate.getTime() - DAY_MS);
        renderDayView();
    });
    
    dayNextBtn.addEventListener('click', function() {
        currentDayViewDate = new Date(currentDayViewDate.getTime() + DAY_MS);
        renderDayView();
    });
    
    dayTodayBtn.addEventListener('click', function() {
        currentDayViewDate = new Date();
        renderDayView();
    });
    
    scrollToNowBtn.addEventListener('click', scrollToCurrentTime);
    
    // 周视图导航
    weekPrevBtn.addEventListener('click', function() {
        currentWeekStartDate = new Date(currentWeekStartDate.getTime() - WEEK_MS);
        renderWeekView();
    });
    
    weekNextBtn.addEventListener('click', function() {
        currentWeekStartDate = new Date(currentWeekStartDate.getTime() + WEEK_MS);
        renderWeekView();
    });
    
    weekTodayBtn.addEventListener('click', function() {
        currentWeekStartDate = getMonday(new Date());
        renderWeekView();
    });
    
    scrollToNowWeekBtn.addEventListener('click', scrollToCurrentTimeWeek);
}

// 设置活动视图
function setActiveView(view) {
    // 重置所有视图按钮
    document.querySelectorAll('.view-switch-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-700', 'text-white');
        btn.classList.add('text-blue-100');
    });
    
    // 隐藏所有视图
    document.querySelectorAll('.view-transition').forEach(view => {
        view.classList.add('view-hidden');
        view.classList.remove('view-visible');
    });
    
    // 激活选择的视图
    switch(view) {
        case 'list':
            listViewBtn.classList.add('active', 'bg-blue-700', 'text-white');
            listViewBtn.classList.remove('text-blue-100');
            listView.classList.remove('view-hidden');
            listView.classList.add('view-visible');
            break;
        case 'day':
            dayViewBtn.classList.add('active', 'bg-blue-700', 'text-white');
            dayViewBtn.classList.remove('text-blue-100');
            dayView.classList.remove('view-hidden');
            dayView.classList.add('view-visible');
            break;
        case 'week':
            weekViewBtn.classList.add('active', 'bg-blue-700', 'text-white');
            weekViewBtn.classList.remove('text-blue-100');
            weekView.classList.remove('view-hidden');
            weekView.classList.add('view-visible');
            break;
    }
}

// 设置过滤条件
function setFilter(filter) {
    currentFilter = filter;
    
    // 更新按钮状态
    filterButtons.forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('hover:bg-gray-200');
    });
    
    document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active', 'bg-blue-600', 'text-white');
    document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.remove('hover:bg-gray-200');
    
    // 重新渲染视图
    renderTasks();
    
    if (dayView.classList.contains('view-visible')) {
        renderDayView();
    } else if (weekView.classList.contains('view-visible')) {
        renderWeekView();
    }
}

// 添加任务
function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;
    const date = taskDate.value;
    const time = taskTime.value;
    
    if (taskText && date && time) {
        // 创建日期对象
        const taskDateObj = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        taskDateObj.setHours(hours, minutes, 0, 0);
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: priority,
            date: formatDateInput(new Date(date)), // 存储为YYYY-MM-DD格式
            time: time,
            datetime: taskDateObj.toISOString(),
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateTaskCount();
        
        // 如果是当前视图，重新渲染
        if (dayView.classList.contains('view-visible')) {
            renderDayView();
        } else if (weekView.classList.contains('view-visible')) {
            renderWeekView();
        }
        
        // 重置输入
        taskInput.value = '';
        const now = new Date();
        taskDate.value = formatDateInput(now);
        
        // 设置时间为下一个整点
        taskTime.value = `${(hours + 1) % 24}`.padStart(2, '0') + ':00';
        
        taskInput.focus();
    }
}

// 渲染任务列表
function renderTasks() {
    // 根据过滤条件筛选任务
    let filteredTasks = filterTasks(tasks, currentFilter);
    
    // 清空列表
    taskList.innerHTML = '';
    
    // 如果没有任务且是空的过滤条件，显示空状态
    if (filteredTasks.length === 0) {
        if (currentFilter === 'all') {
            taskList.appendChild(emptyState);
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'p-8 text-center text-gray-500';
            messageDiv.innerHTML = `
                <i class="fas fa-${currentFilter === 'active' ? 'clipboard-list' : 'check-circle'} text-4xl mb-4 text-gray-300"></i>
                <p class="text-lg">没有${getFilterDisplayName(currentFilter)}的任务</p>
            `;
            taskList.appendChild(messageDiv);
        }
        return;
    }
    
    // 按日期和时间排序
    filteredTasks.sort((a, b) => {
        // 先按日期排序
        if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
        }
        // 同日期按时间排序
        if (a.time !== b.time) {
            return a.time.localeCompare(b.time);
        }
        // 同时间按优先级排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // 按日期分组
    const tasksByDate = {};
    filteredTasks.forEach(task => {
        if (!tasksByDate[task.date]) {
            tasksByDate[task.date] = [];
        }
        tasksByDate[task.date].push(task);
    });
    
    // 渲染每组任务
    Object.entries(tasksByDate).forEach(([date, dateTasks]) => {
        const dateHeader = document.createElement('div');
        dateHeader.className = 'px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700 sticky top-0';
        dateHeader.textContent = formatDate(new Date(date));
        
        taskList.appendChild(dateHeader);
        
        dateTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    });
}

// 创建任务元素
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item flex items-center p-4 hover:bg-gray-50 priority-${task.priority}`;
    taskElement.dataset.id = task.id;
    
    // 完成复选框
    const completeCheckbox = document.createElement('input');
    completeCheckbox.type = 'checkbox';
    completeCheckbox.checked = task.completed;
    completeCheckbox.className = 'h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 flex-shrink-0';
    completeCheckbox.addEventListener('change', function() {
        toggleTaskComplete(task.id);
    });
    
    // 任务文本和时间
    const taskContent = document.createElement('div');
    taskContent.className = 'flex-grow min-w-0';
    
    const taskText = document.createElement('div');
    taskText.className = `${task.completed ? 'task-completed' : ''} truncate`;
    taskText.textContent = task.text;
    
    const taskMeta = document.createElement('div');
    taskMeta.className = 'flex flex-wrap items-center text-xs text-gray-500 mt-1 gap-x-3 gap-y-1';
    
    const taskTime = document.createElement('span');
    taskTime.textContent = `时间: ${task.time}`;
    
    const taskDate = document.createElement('span');
    taskDate.textContent = `日期: ${formatDate(new Date(task.date))}`;
    
    taskMeta.appendChild(taskTime);
    taskMeta.appendChild(taskDate);
    
    taskContent.appendChild(taskText);
    taskContent.appendChild(taskMeta);
    
    // 优先级标签
    const priorityBadge = document.createElement('span');
    priorityBadge.className = 'text-xs rounded-full px-2 py-1 mr-2 whitespace-nowrap';
    
    let priorityText = '';
    switch(task.priority) {
        case 'high':
            priorityText = '高优先级';
            priorityBadge.classList.add('bg-red-100', 'text-red-800');
            break;
        case 'medium':
            priorityText = '中优先级';
            priorityBadge.classList.add('bg-yellow-100', 'text-yellow-800');
            break;
        case 'low':
            priorityText = '低优先级';
            priorityBadge.classList.add('bg-green-100', 'text-green-800');
            break;
    }
    priorityBadge.textContent = priorityText;
    
    // 操作按钮容器
    const actionButtons = document.createElement('div');
    actionButtons.className = 'flex space-x-2 ml-2';
    
    // 编辑按钮
    const editButton = document.createElement('button');
    editButton.className = 'text-blue-500 hover:text-blue-700 text-sm';
    editButton.title = '编辑';
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.addEventListener('click', function(e) {
        e.stopPropagation();
        editTask(task.id);
    });
    
    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'text-red-500 hover:text-red-700 text-sm';
    deleteButton.title = '删除';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);
    
    // 组装元素
    const leftContent = document.createElement('div');
    leftContent.className = 'flex items-center flex-grow min-w-0';
    leftContent.appendChild(completeCheckbox);
    leftContent.appendChild(taskContent);
    
    const rightContent = document.createElement('div');
    rightContent.className = 'flex items-center whitespace-nowrap';
    rightContent.appendChild(priorityBadge);
    rightContent.appendChild(actionButtons);
    
    taskElement.appendChild(leftContent);
    taskElement.appendChild(rightContent);
    
    return taskElement;
}

// 渲染日视图
function renderDayView() {
    // 更新日期显示
    dayViewDate.textContent = formatFullDate(currentDayViewDate);
    
    // 清空时间轴
    timeline.innerHTML = '';
    
    // 获取该日期的任务
    const selectedDate = formatDateInput(currentDayViewDate);
    const tasksForDay = tasks.filter(task => task.date === selectedDate && filterTaskByCurrentFilter(task));
    
    // 过滤出6:00-23:00范围内的任务
    const tasksInTimeRange = tasksForDay.filter(task => {
        const hour = parseInt(task.time.split(':')[0]);
        return hour >= 6 && hour <= 23;
    });
    
    // 如果没有任务，显示空状态
    if (tasksInTimeRange.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-8 text-gray-400';
        emptyState.innerHTML = `<i class="fas fa-calendar-day text-4xl mb-2"></i><p>这一天没有任务</p>`;
        timeline.appendChild(emptyState);
    } else {
        // 找出所有有任务的小时
        const hoursWithTasks = new Set();
        tasksInTimeRange.forEach(task => {
            const hour = parseInt(task.time.split(':')[0]);
            hoursWithTasks.add(hour);
        });
        
        // 只创建有任务的小时块
        Array.from(hoursWithTasks).sort((a, b) => a - b).forEach(hour => {
            const hourTasks = tasksInTimeRange.filter(task => {
                const taskHour = parseInt(task.time.split(':')[0]);
                return taskHour === hour;
            });
            
            // 只有当有任务时才创建时间块
            if (hourTasks.length > 0) {
                const timeBlock = document.createElement('div');
                timeBlock.className = 'time-block mb-6';
                timeBlock.id = `hour-${hour}`;
                
                // 如果是当前日期和小时，添加标记
                const now = new Date();
                const isCurrentHour = isSameDay(currentDayViewDate, now) && now.getHours() === hour;
                
                // 添加小时标记
                const hourMarker = document.createElement('div');
                hourMarker.className = 'hour-marker';
                hourMarker.textContent = hour;
                
                if (isCurrentHour) {
                    hourMarker.classList.add('bg-red-500');
                }
                
                timeBlock.appendChild(hourMarker);
                
                // 添加小时标题
                const hourTitle = document.createElement('div');
                hourTitle.className = 'text-sm font-semibold mb-2 mt-0 text-gray-600';
                hourTitle.textContent = `${hour}:00`;
                timeBlock.appendChild(hourTitle);
                
                // 添加任务
                hourTasks.forEach(task => {
                    const taskElement = createDayViewTaskElement(task);
                    timeBlock.appendChild(taskElement);
                });
                
                timeline.appendChild(timeBlock);
            }
        });
    }
    
    // 如果是当前日期，添加当前时间线（仅当当前时间在6:00-23:00范围内且当前小时有任务）
    const now = new Date();
    const currentHour = now.getHours();
    if (isSameDay(currentDayViewDate, now) && currentHour >= 6 && currentHour <= 23) {
        const hourHasTasks = tasksInTimeRange.some(task => parseInt(task.time.split(':')[0]) === currentHour);
        if (hourHasTasks) {
            addCurrentTimeLine();
        }
    }
    
    // 自动滚动到当前时间或第一个任务
    setTimeout(() => {
        if (isSameDay(currentDayViewDate, now)) {
            // 检查当前小时是否有任务
            const currentHourHasTasks = tasksInTimeRange.some(task => 
                parseInt(task.time.split(':')[0]) === currentHour
            );
            
            if (currentHour >= 6 && currentHour <= 23 && currentHourHasTasks) {
                // 如果当前小时有任务，滚动到当前时间
                const hourElement = document.getElementById(`hour-${currentHour}`);
                if (hourElement) {
                    hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else if (tasksInTimeRange.length > 0) {
                // 否则滚动到第一个任务
                const firstTaskHour = findFirstTaskHour(tasksInTimeRange);
                const firstHourElement = document.getElementById(`hour-${firstTaskHour}`);
                if (firstHourElement) {
                    firstHourElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } else if (tasksInTimeRange.length > 0) {
            // 非当天，滚动到第一个任务
            const firstTaskHour = findFirstTaskHour(tasksInTimeRange);
            const firstHourElement = document.getElementById(`hour-${firstTaskHour}`);
            if (firstHourElement) {
                firstHourElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, 50);
}

// 创建日视图任务元素
function createDayViewTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item flex items-center p-3 mb-2 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 priority-${task.priority}`;
    taskElement.dataset.id = task.id;
    
    // 时间显示
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'text-xs font-medium text-gray-500 mr-3 w-12 flex-shrink-0';
    timeDisplay.textContent = task.time;
    
    // 完成复选框
    const completeCheckbox = document.createElement('input');
    completeCheckbox.type = 'checkbox';
    completeCheckbox.checked = task.completed;
    completeCheckbox.className = 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 flex-shrink-0';
    completeCheckbox.addEventListener('change', function() {
        toggleTaskComplete(task.id);
    });
    
    // 任务文本
    const taskText = document.createElement('div');
    taskText.className = `flex-grow truncate ${task.completed ? 'task-completed' : ''}`;
    taskText.textContent = task.text;
    
    // 优先级点
    const priorityDot = document.createElement('div');
    priorityDot.className = 'w-2 h-2 rounded-full ml-2 flex-shrink-0';
    
    switch(task.priority) {
        case 'high':
            priorityDot.classList.add('bg-red-500');
            break;
        case 'medium':
            priorityDot.classList.add('bg-yellow-500');
            break;
        case 'low':
            priorityDot.classList.add('bg-green-500');
            break;
    }
    
    // 操作按钮容器
    const actionButtons = document.createElement('div');
    actionButtons.className = 'flex items-center ml-2 space-x-1';
    
    // 编辑按钮
    const editButton = document.createElement('button');
    editButton.className = 'text-blue-500 hover:text-blue-700 text-xs';
    editButton.title = '编辑';
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.addEventListener('click', function(e) {
        e.stopPropagation();
        editTask(task.id);
    });
    
    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'text-red-500 hover:text-red-700 text-xs';
    deleteButton.title = '删除';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);
    
    // 组装元素
    taskElement.appendChild(timeDisplay);
    taskElement.appendChild(completeCheckbox);
    taskElement.appendChild(taskText);
    taskElement.appendChild(priorityDot);
    taskElement.appendChild(actionButtons);
    
    return taskElement;
}

// 添加当前时间线
function addCurrentTimeLine() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const pixelsPerMinute = 2; // 每分钟2像素
    const topPosition = currentHour * 60 + currentMinute;
    
    const timeLine = document.createElement('div');
    timeLine.className = 'current-time-line';
    timeLine.style.top = `${topPosition * pixelsPerMinute}px`;
    timeLine.style.position = 'absolute';
    timeLine.style.width = '100%';
    timeLine.style.left = '0';
    timeLine.style.zIndex = '10';
    
    timeline.appendChild(timeLine);
}

// 滚动到当前时间
function scrollToCurrentTime() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 如果当前时间在显示范围内
    if (currentHour >= 6 && currentHour <= 23) {
        const hourElement = document.getElementById(`hour-${currentHour}`);
        if (hourElement) {
            hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else if (currentHour < 6) {
        // 如果当前时间早于6点，滚动到6点
        const firstHourElement = document.getElementById('hour-6');
        if (firstHourElement) {
            firstHourElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        // 如果当前时间晚于23点，滚动到23点
        const lastHourElement = document.getElementById('hour-23');
        if (lastHourElement) {
            lastHourElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
}

// 渲染周视图 - 修改版本（隐藏无任务行）
function renderWeekView() {
    // 更新周视图日期显示
    const weekEndDate = new Date(currentWeekStartDate.getTime() + 6 * DAY_MS);
    weekViewDate.textContent = `${formatDate(currentWeekStartDate)} - ${formatDate(weekEndDate)}`;
    
    // 清空周视图
    weekDaysHeader.innerHTML = '';
    weekHoursBody.innerHTML = '';
    
    // 更加美观的星期标识
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    
    // 添加表头行
    const headerRow = document.createElement('tr');
    
    // 空白单元格 (时间列)
    const blankCell = document.createElement('th');
    blankCell.className = 'time-header';
    blankCell.innerHTML = '<i class="fas fa-clock text-gray-400"></i>';
    headerRow.appendChild(blankCell);
    
    // 添加日期单元格
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentWeekStartDate.getTime() + i * DAY_MS);
        const headerCell = document.createElement('th');
        headerCell.className = 'day-header';
        
        // 如果是今天，添加高亮样式
        if (isSameDay(dayDate, new Date())) {
            headerCell.classList.add('current-day');
        }
        
        // 创建日期内容
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center justify-center h-full';
        
        // 添加星期标识
        const weekdayLabel = document.createElement('div');
        weekdayLabel.className = 'weekday-label';
        weekdayLabel.textContent = `周${weekDays[i]}`;
        weekdayLabel.style.fontWeight = '700';
        weekdayLabel.style.fontSize = '1.05rem';
        weekdayLabel.style.color = '#4b5563';
        container.appendChild(weekdayLabel);
        
        // 添加日期数字
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = dayDate.getDate();
        container.appendChild(dateNumber);
        
        // 添加月份指示（如果是1号或周一）
        if (dayDate.getDate() === 1 || i === 0) {
            const monthLabel = document.createElement('div');
            monthLabel.className = 'text-xs text-gray-500 mt-1';
            monthLabel.textContent = dayDate.toLocaleDateString('zh-CN', { month: 'short' });
            container.appendChild(monthLabel);
        }
        
        headerCell.appendChild(container);
        headerRow.appendChild(headerCell);
    }
    
    weekDaysHeader.appendChild(headerRow);
    
    // 预先检查每个时间段是否有任务
    const timeBlocksWithTasks = {};
    
    // 遍历所有可能的时间段
    for (let startHour = 6; startHour < 23; startHour += 2) {
        const endHour = startHour + 1;
        let hasTasksInTimeBlock = false;
        
        // 检查一周中的每一天
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(currentWeekStartDate.getTime() + day * DAY_MS);
            const dayString = formatDateInput(dayDate);
            
            // 检查当前两个小时是否有任务
            const tasksExist = tasks.some(task => {
                const taskHour = parseInt(task.time.split(':')[0]);
                return task.date === dayString && 
                       (taskHour === startHour || taskHour === endHour) &&
                       filterTaskByCurrentFilter(task);
            });
            
            if (tasksExist) {
                hasTasksInTimeBlock = true;
                break; // 一旦发现有任务，就可以停止检查
            }
        }
        
        // 记录该时间段是否有任务
        timeBlocksWithTasks[startHour] = hasTasksInTimeBlock;
    }
    
    // 只创建有任务的时间行
    for (let startHour = 6; startHour < 23; startHour += 2) {
        const endHour = startHour + 1;
        
        // 如果该时间段没有任何任务，跳过创建
        if (!timeBlocksWithTasks[startHour]) {
            continue;
        }
        
        const row = document.createElement('tr');
        row.id = `week-hour-${startHour}`;
        row.className = 'merged-hour-row';
        
        // 时间标记单元格 - 显示合并后的时间范围
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = `${startHour}:00-${endHour+1}:00`;
        row.appendChild(timeCell);
        
        // 每天的合并小时单元格
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(currentWeekStartDate.getTime() + day * DAY_MS);
            const dayString = formatDateInput(dayDate);
            
            // 过滤当前两个小时和日期的任务
            const tasksForMergedHours = tasks.filter(task => {
                const taskHour = parseInt(task.time.split(':')[0]);
                return task.date === dayString && 
                       (taskHour === startHour || taskHour === endHour) &&
                       filterTaskByCurrentFilter(task);
            });
            
            const cell = document.createElement('td');
            cell.className = 'merged-hour-cell';
            
            // 如果是今天，添加高亮样式
            if (isSameDay(dayDate, new Date())) {
                cell.classList.add('current-day');
            }
            
            // 按小时分组任务
            const tasksByHour = {};
            tasksForMergedHours.forEach(task => {
                const hour = parseInt(task.time.split(':')[0]);
                if (!tasksByHour[hour]) {
                    tasksByHour[hour] = [];
                }
                tasksByHour[hour].push(task);
            });
            
            // 遍历两个小时，添加各自的任务
            [startHour, endHour].forEach(hour => {
                if (tasksByHour[hour] && tasksByHour[hour].length > 0) {
                    // 添加小时标签
                    const hourLabel = document.createElement('div');
                    hourLabel.className = 'text-xs font-medium text-gray-500 mb-1';
                    hourLabel.textContent = `${hour}:00`;
                    cell.appendChild(hourLabel);
                    
                    // 最多显示每个小时的2个任务，超过显示"+N"
                    const tasksToShow = tasksByHour[hour].slice(0, 2);
                    const remainingCount = tasksByHour[hour].length - 2;
                    
                    tasksToShow.forEach(task => {
                        const taskIndicator = document.createElement('div');
                        taskIndicator.className = `task-indicator ${task.priority}`;
                        
                        // 创建优先级指示点
                        const priorityDot = document.createElement('span');
                        priorityDot.className = 'inline-block w-2 h-2 rounded-full mr-1';
                        
                        switch(task.priority) {
                            case 'high':
                                priorityDot.style.backgroundColor = '#ef4444';
                                break;
                            case 'medium':
                                priorityDot.style.backgroundColor = '#f59e0b';
                                break;
                            case 'low':
                                priorityDot.style.backgroundColor = '#10b981';
                                break;
                        }
                        
                        // 添加任务文本（短版本）
                        const taskText = document.createTextNode(
                            task.text.length > 10 ? 
                            task.text.substring(0, 10) + '...' : 
                            task.text
                        );
                        
                        taskIndicator.appendChild(priorityDot);
                        taskIndicator.appendChild(taskText);
                        taskIndicator.title = task.text;
                        
                        if (task.completed) {
                            taskIndicator.classList.add('line-through', 'opacity-50');
                        }
                        
                        taskIndicator.addEventListener('click', () => {
                            openTaskDetails(task);
                        });
                        
                        cell.appendChild(taskIndicator);
                    });
                    
                    // 如果任务超过2个，添加"更多"指示器
                    if (remainingCount > 0) {
                        const moreIndicator = document.createElement('div');
                        moreIndicator.className = 'text-xs text-gray-500 text-center cursor-pointer';
                        moreIndicator.textContent = `+${remainingCount} 更多...`;
                        
                        moreIndicator.addEventListener('click', () => {
                            openHourDetails(dayDate, hour, tasksByHour[hour]);
                        });
                        
                        cell.appendChild(moreIndicator);
                    }
                }
            });
            
            row.appendChild(cell);
        }
        
        weekHoursBody.appendChild(row);
    }
    
    // 检查是否没有显示任何行
    if (weekHoursBody.children.length === 0) {
        // 创建一个提示行
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 8; // 跨越所有列
        emptyCell.className = 'text-center py-8 text-gray-400';
        emptyCell.innerHTML = '<i class="fas fa-calendar-week text-4xl mb-3"></i><p>本周没有任务安排</p>';
        emptyRow.appendChild(emptyCell);
        weekHoursBody.appendChild(emptyRow);
    }
    
    // 自动滚动到当前时间
    setTimeout(scrollToCurrentTimeWeek, 100);
}

// 滚动到当前时间(周视图)
function scrollToCurrentTimeWeek() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 只有当当前时间在显示范围内时才滚动
    if (currentHour >= 6 && currentHour <= 23) {
        // 计算所在的合并行
        const rowStartHour = Math.floor(currentHour / 2) * 2;
        const hourRow = document.getElementById(`week-hour-${rowStartHour}`);
        
        if (hourRow) {
            // 如果存在当前时间的行，滚动到该行
            hourRow.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // 高亮当前单元格
            const currentDay = now.getDay();
            const adjustedDay = currentDay === 0 ? 6 : currentDay - 1;
            const targetCell = hourRow.children[adjustedDay + 1];
            
            if (targetCell) {
                // 短暂高亮当前单元格
                targetCell.classList.add('bg-blue-50');
                setTimeout(() => {
                    targetCell.classList.remove('bg-blue-50');
                }, 2000);
            }
        } else {
            // 如果当前时间的行不存在（因为没有任务），找最接近的行
            findAndScrollToNearestRow(rowStartHour);
        }
    } else {
        // 如果当前时间不在范围内，滚动到第一个有任务的行
        const firstRow = weekHoursBody.firstElementChild;
        if (firstRow && firstRow.id) {
            firstRow.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// 找到并滚动到最接近指定小时的行
function findAndScrollToNearestRow(targetHour) {
    // 获取所有时间行
    const rows = Array.from(weekHoursBody.querySelectorAll('tr[id^="week-hour-"]'));
    if (rows.length === 0) return;
    
    // 提取每行的小时数
    const rowHours = rows.map(row => {
        const hourMatch = row.id.match(/week-hour-(\d+)/);
        return hourMatch ? parseInt(hourMatch[1]) : -1;
    });
    
    // 找到最接近目标小时的行
    let closestRowIndex = 0;
    let minDiff = Number.MAX_SAFE_INTEGER;
    
    rowHours.forEach((hour, index) => {
        if (hour !== -1) {
            const diff = Math.abs(hour - targetHour);
            if (diff < minDiff) {
                minDiff = diff;
                closestRowIndex = index;
            }
        }
    });
    
    // 滚动到最接近的行
    rows[closestRowIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// 打开任务详情
function openTaskDetails(task) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg shadow-xl w-full max-w-md';
    
    // 创建头部
    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b border-gray-200 flex justify-between items-center';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = '任务详情';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-500 hover:text-gray-700';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // 创建内容
    const body = document.createElement('div');
    body.className = 'p-6 space-y-4';
    
    const textItem = document.createElement('div');
    textItem.className = 'flex items-start';
    
    const textLabel = document.createElement('div');
    textLabel.className = 'w-24 text-gray-600';
    textLabel.textContent = '任务内容:';
    
    const textValue = document.createElement('div');
    textValue.className = 'flex-grow';
    textValue.textContent = task.text;
    
    textItem.appendChild(textLabel);
    textItem.appendChild(textValue);
    
    const dateItem = document.createElement('div');
    dateItem.className = 'flex items-center';
    
    const dateLabel = document.createElement('div');
    dateLabel.className = 'w-24 text-gray-600';
    dateLabel.textContent = '日期:';
    
    const dateValue = document.createElement('div');
    dateValue.textContent = formatDate(new Date(task.date));
    
    dateItem.appendChild(dateLabel);
    dateItem.appendChild(dateValue);
    
    const timeItem = document.createElement('div');
    timeItem.className = 'flex items-center';
    
    const timeLabel = document.createElement('div');
    timeLabel.className = 'w-24 text-gray-600';
    timeLabel.textContent = '时间:';
    
    const timeValue = document.createElement('div');
    timeValue.textContent = task.time;
    
    timeItem.appendChild(timeLabel);
    timeItem.appendChild(timeValue);
    
    const priorityItem = document.createElement('div');
    priorityItem.className = 'flex items-center';
    
    const priorityLabel = document.createElement('div');
    priorityLabel.className = 'w-24 text-gray-600';
    priorityLabel.textContent = '优先级:';
    
    const priorityValue = document.createElement('div');
    let priorityText = '';
    let priorityClass = '';
    
    switch(task.priority) {
        case 'high':
            priorityText = '高优先级';
            priorityClass = 'bg-red-100 text-red-800';
            break;
        case 'medium':
            priorityText = '中优先级';
            priorityClass = 'bg-yellow-100 text-yellow-800';
            break;
        case 'low':
            priorityText = '低优先级';
            priorityClass = 'bg-green-100 text-green-800';
            break;
    }
    
    priorityValue.className = `text-xs rounded-full px-2 py-1 ${priorityClass}`;
    priorityValue.textContent = priorityText;
    
    priorityItem.appendChild(priorityLabel);
    priorityItem.appendChild(priorityValue);
    
    const statusItem = document.createElement('div');
    statusItem.className = 'flex items-center';
    
    const statusLabel = document.createElement('div');
    statusLabel.className = 'w-24 text-gray-600';
    statusLabel.textContent = '状态:';
    
    const statusValue = document.createElement('div');
    statusValue.className = `text-xs rounded-full px-2 py-1 ${task.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`;
    statusValue.textContent = task.completed ? '已完成' : '进行中';
    
    statusItem.appendChild(statusLabel);
    statusItem.appendChild(statusValue);
    
    body.appendChild(textItem);
    body.appendChild(dateItem);
    body.appendChild(timeItem);
    body.appendChild(priorityItem);
    body.appendChild(statusItem);
    
    // 创建底部操作按钮
    const footer = document.createElement('div');
    footer.className = 'px-6 py-4 border-t border-gray-200 flex justify-end space-x-2';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', function() {
        modal.remove();
        editTask(task.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', function() {
        if (confirm('确定要删除这个任务吗？')) {
            deleteTask(task.id);
            modal.remove();
        }
    });
    
    const closeBtn2 = document.createElement('button');
    closeBtn2.className = 'px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg';
    closeBtn2.textContent = '关闭';
    closeBtn2.addEventListener('click', function() {
        modal.remove();
    });
    
    footer.appendChild(editBtn);
    footer.appendChild(deleteBtn);
    footer.appendChild(closeBtn2);
    
    // 组装模态框
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    modal.appendChild(content);
    
    // 添加到DOM
    document.body.appendChild(modal);
}

// 打开小时详情
function openHourDetails(date, hour, tasks) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col';
    
    // 创建头部
    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b border-gray-200 flex justify-between items-center';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = `${formatDate(date)} ${hour}:00 - ${hour + 1}:00`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-500 hover:text-gray-700';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // 创建内容
    const body = document.createElement('div');
    body.className = 'p-4 overflow-y-auto flex-grow';
    
    if (tasks.length === 0) {
        body.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i class="fas fa-clock text-3xl mb-3"></i>
                <p>这个时间段没有任务</p>
            </div>
        `;
    } else {
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `mb-3 p-3 rounded-lg shadow-sm ${task.completed ? 'bg-gray-50' : 'bg-white'} border border-gray-200`;
            
            const taskHeader = document.createElement('div');
            taskHeader.className = 'flex justify-between items-start mb-2';
            
            const taskTime = document.createElement('div');
            taskTime.className = 'text-sm font-medium text-gray-600';
            taskTime.textContent = task.time;
            
            const taskPriority = document.createElement('div');
            let priorityText = '';
            let priorityClass = '';
            
            switch(task.priority) {
                case 'high':
                    priorityText = '高优先级';
                    priorityClass = 'bg-red-100 text-red-800';
                    break;
                case 'medium':
                    priorityText = '中优先级';
                    priorityClass = 'bg-yellow-100 text-yellow-800';
                    break;
                case 'low':
                    priorityText = '低优先级';
                    priorityClass = 'bg-green-100 text-green-800';
                    break;
            }
            
            taskPriority.className = `text-xs rounded-full px-2 py-1 ${priorityClass}`;
            taskPriority.textContent = priorityText;
            
            taskHeader.appendChild(taskTime);
            taskHeader.appendChild(taskPriority);
            
            const taskText = document.createElement('div');
            taskText.className = `mb-2 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`;
            taskText.textContent = task.text;
            
            const taskStatus = document.createElement('div');
            taskStatus.className = 'text-xs text-gray-500';
            taskStatus.textContent = `状态: ${task.completed ? '已完成' : '进行中'}`;
            
            taskElement.appendChild(taskHeader);
            taskElement.appendChild(taskText);
            taskElement.appendChild(taskStatus);
            
            taskElement.addEventListener('click', function() {
                modal.remove();
                openTaskDetails(task);
            });
            
            body.appendChild(taskElement);
        });
    }
    
    // 创建底部
    const footer = document.createElement('div');
    footer.className = 'px-6 py-4 border-t border-gray-200 flex justify-end';
    
    const closeBtn2 = document.createElement('button');
    closeBtn2.className = 'px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg';
    closeBtn2.textContent = '关闭';
    closeBtn2.addEventListener('click', function() {
        modal.remove();
    });
    
    footer.appendChild(closeBtn2);
    
    // 组装模态框
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    modal.appendChild(content);
    
    // 添加到DOM
    document.body.appendChild(modal);
}

// 切换任务完成状态
function toggleTaskComplete(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    
    // 重新渲染当前视图
    if (listView.classList.contains('view-visible')) {
        renderTasks();
    } else if (dayView.classList.contains('view-visible')) {
        renderDayView();
    } else {
        renderWeekView();
    }
    
    updateTaskCount();
}

// 删除任务
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    
    // 重新渲染当前视图
    if (listView.classList.contains('view-visible')) {
        renderTasks();
    } else if (dayView.classList.contains('view-visible')) {
        renderDayView();
    } else {
        renderWeekView();
    }
    
    updateTaskCount();
}

// 编辑任务
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg shadow-xl w-full max-w-md';
    
    // 创建头部
    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b border-gray-200 flex justify-between items-center';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = '编辑任务';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-500 hover:text-gray-700';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // 创建表单
    const form = document.createElement('div');
    form.className = 'p-6 space-y-4';
    
    // 任务文本
    const textGroup = document.createElement('div');
    textGroup.className = 'space-y-1';
    
    const textLabel = document.createElement('label');
    textLabel.className = 'block text-sm font-medium text-gray-700';
    textLabel.textContent = '任务内容';
    textLabel.htmlFor = 'edit-task-text';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.id = 'edit-task-text';
    textInput.value = task.text;
    textInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    textGroup.appendChild(textLabel);
    textGroup.appendChild(textInput);
    
    // 日期和时间
    const datetimeGroup = document.createElement('div');
    datetimeGroup.className = 'grid grid-cols-2 gap-4';
    
    // 日期
    const dateGroup = document.createElement('div');
    dateGroup.className = 'space-y-1';
    
    const dateLabel = document.createElement('label');
    dateLabel.className = 'block text-sm font-medium text-gray-700';
    dateLabel.textContent = '日期';
    dateLabel.htmlFor = 'edit-task-date';
    
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'edit-task-date';
    dateInput.value = task.date;
    dateInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    dateGroup.appendChild(dateLabel);
    dateGroup.appendChild(dateInput);
    
    // 时间
    const timeGroup = document.createElement('div');
    timeGroup.className = 'space-y-1';
    
    const timeLabel = document.createElement('label');
    timeLabel.className = 'block text-sm font-medium text-gray-700';
    timeLabel.textContent = '时间';
    timeLabel.htmlFor = 'edit-task-time';
    
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.id = 'edit-task-time';
    timeInput.value = task.time;
    timeInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    timeGroup.appendChild(timeLabel);
    timeGroup.appendChild(timeInput);
    
    datetimeGroup.appendChild(dateGroup);
    datetimeGroup.appendChild(timeGroup);
    
                   // 优先级
                   const priorityGroup = document.createElement('div');
    priorityGroup.className = 'space-y-1';
    
    const priorityLabel = document.createElement('label');
    priorityLabel.className = 'block text-sm font-medium text-gray-700';
    priorityLabel.textContent = '优先级';
    priorityLabel.htmlFor = 'edit-task-priority';
    
    const prioritySelect = document.createElement('select');
    prioritySelect.id = 'edit-task-priority';
    prioritySelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    const priorityOptions = [
        { value: 'low', text: '低优先级' },
        { value: 'medium', text: '中优先级' },
        { value: 'high', text: '高优先级' }
    ];
    
    priorityOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        optionElement.selected = task.priority === option.value;
        prioritySelect.appendChild(optionElement);
    });
    
    priorityGroup.appendChild(priorityLabel);
    priorityGroup.appendChild(prioritySelect);
    
    // 完成状态
    const statusGroup = document.createElement('div');
    statusGroup.className = 'flex items-center space-x-2 mt-2';
    
    const statusInput = document.createElement('input');
    statusInput.type = 'checkbox';
    statusInput.id = 'edit-task-completed';
    statusInput.checked = task.completed;
    statusInput.className = 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500';
    
    const statusLabel = document.createElement('label');
    statusLabel.className = 'text-sm text-gray-700';
    statusLabel.textContent = '标记为已完成';
    statusLabel.htmlFor = 'edit-task-completed';
    
    statusGroup.appendChild(statusInput);
    statusGroup.appendChild(statusLabel);
    
    // 添加所有表单元素
    form.appendChild(textGroup);
    form.appendChild(datetimeGroup);
    form.appendChild(priorityGroup);
    form.appendChild(statusGroup);
    
    // 创建底部
    const footer = document.createElement('div');
    footer.className = 'px-6 py-4 border-t border-gray-200 flex justify-end space-x-2';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', function() {
        // 获取编辑后的值
        const updatedText = document.getElementById('edit-task-text').value;
        const updatedDate = document.getElementById('edit-task-date').value;
        const updatedTime = document.getElementById('edit-task-time').value;
        const updatedPriority = document.getElementById('edit-task-priority').value;
        const updatedCompleted = document.getElementById('edit-task-completed').checked;
        
        // 更新任务
        updateTask(taskId, {
            text: updatedText,
            date: updatedDate,
            time: updatedTime,
            priority: updatedPriority,
            completed: updatedCompleted
        });
        
        modal.remove();
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', function() {
        modal.remove();
    });
    
    footer.appendChild(saveBtn);
    footer.appendChild(cancelBtn);
    
    // 组装模态框
    content.appendChild(header);
    content.appendChild(form);
    content.appendChild(footer);
    modal.appendChild(content);
    
    // 添加到DOM
    document.body.appendChild(modal);
}

// 更新任务
function updateTask(taskId, updatedData) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            // 更新日期对象
            const taskDateObj = new Date(updatedData.date);
            const [hours, minutes] = updatedData.time.split(':').map(Number);
            taskDateObj.setHours(hours, minutes, 0, 0);
            
            return {
                ...task,
                text: updatedData.text,
                date: updatedData.date,
                time: updatedData.time,
                priority: updatedData.priority,
                completed: updatedData.completed,
                datetime: taskDateObj.toISOString()
            };
        }
        return task;
    });
    
    saveTasks();
    
    // 重新渲染当前视图
    if (listView.classList.contains('view-visible')) {
        renderTasks();
    } else if (dayView.classList.contains('view-visible')) {
        renderDayView();
    } else {
        renderWeekView();
    }
    
    updateTaskCount();
}

// 更新任务计数
function updateTaskCount() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    
    taskCount.textContent = `${total} 任务 (${active} 进行中, ${completed} 已完成)`;
}

// 保存任务到本地存储
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 根据过滤条件筛选任务
function filterTasks(taskList, filter) {
    switch(filter) {
        case 'active':
            return taskList.filter(task => !task.completed);
        case 'completed':
            return taskList.filter(task => task.completed);
        case 'today':
            const today = formatDateInput(new Date());
            return taskList.filter(task => task.date === today);
        default:
            return taskList;
    }
}

// 单个任务过滤器
function filterTaskByCurrentFilter(task) {
    switch(currentFilter) {
        case 'active':
            return !task.completed;
        case 'completed':
            return task.completed;
        case 'today':
            const today = formatDateInput(new Date());
            return task.date === today;
        default:
            return true;
    }
}

// 获取过滤条件显示名称
function getFilterDisplayName(filter) {
    switch(filter) {
        case 'active':
            return '进行中';
        case 'completed':
            return '已完成';
        case 'today':
            return '今天';
        default:
            return '';
    }
}

// 查找某一天的第一个任务小时（仅考虑6:00-23:00范围）
function findFirstTaskHour(tasks) {
    if (tasks.length === 0) return null;
    
    let firstHour = 24;
    tasks.forEach(task => {
        const hour = parseInt(task.time.split(':')[0]);
        if (hour >= 6 && hour <= 23 && hour < firstHour) {
            firstHour = hour;
        }
    });
    
    // 如果没有在6:00-23:00范围内的任务，返回6点
    return firstHour === 24 ? 6 : firstHour;
}

// 获取日期对应的周一
function getMonday(date) {
    const day = date.getDay(); // 0是周日，1是周一，...，6是周六
    // 根据当前日期计算到周一的偏移量
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// 检查日期是否在当前周内
function isDateInCurrentWeek(date) {
    const monday = getMonday(new Date());
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    
    return date >= monday && date < nextMonday;
}

// 检查是否为同一天
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 格式化日期为 YYYY-MM-DD 输入格式
function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 格式化日期显示
function formatDate(date) {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 格式化完整日期，包括星期
function formatFullDate(date) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    return `${formatDate(date)} ${weekday}`;
}

// 获取时间在小时内的位置
function getTimePositionInHour(time) {
    const [hour, minute] = time.split(':').map(Number);
    // 假设每分钟1个像素，上方保留16像素
    return Math.floor(minute * (60 / 60)) + 5;
}