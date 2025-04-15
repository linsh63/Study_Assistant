import { formatDate, formatTime, getMonday } from './utils.js';

// 常量定义
const DAY_MS = 86400000;
const WEEK_MS = 604800000;
const HOUR_MS = 3600000;

// 渲染任务列表
function renderTasks() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    taskList.innerHTML = '';
    
    // 按日期和时间排序任务
    const sortedTasks = [...tasks].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
    });
    
    let currentDate = null;
    
    sortedTasks.forEach(task => {
        // 如果是新的一天，添加日期分隔符
        if (task.date !== currentDate) {
            currentDate = task.date;
            const dateHeader = document.createElement('div');
            dateHeader.className = 'px-6 py-3 bg-gray-50 text-gray-600 text-sm font-medium';
            dateHeader.textContent = formatDate(new Date(task.date));
            taskList.appendChild(dateHeader);
        }
        
        // 创建任务元素
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

// 创建任务元素
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-50' : ''}`;
    taskElement.setAttribute('data-date', task.date);
    taskElement.setAttribute('data-time', task.time);
    
    // 添加复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500';
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    
    // 添加任务内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex-grow';
    
    const taskText = document.createElement('p');
    taskText.className = `text-gray-800 ${task.completed ? 'line-through' : ''}`;
    taskText.textContent = task.text;
    
    const taskInfo = document.createElement('p');
    taskInfo.className = 'text-sm text-gray-500';
    taskInfo.textContent = `${formatTime(task.time)} · ${getPriorityLabel(task.priority)}`;
    
    contentDiv.appendChild(taskText);
    contentDiv.appendChild(taskInfo);
    
    // 添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-gray-400 hover:text-red-500 focus:outline-none';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    // 组装任务元素
    taskElement.appendChild(checkbox);
    taskElement.appendChild(contentDiv);
    taskElement.appendChild(deleteBtn);
    
    return taskElement;
}

// 更新任务计数
function updateTaskCount() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    taskCount.textContent = `${completedTasks}/${totalTasks} 任务`;
}

// 设置活动视图
function setActiveView(viewName) {
    // 隐藏所有视图
    listView.classList.add('view-hidden');
    dayView.classList.add('view-hidden');
    weekView.classList.add('view-hidden');
    
    // 显示选中的视图
    switch(viewName) {
        case 'list':
            listView.classList.remove('view-hidden');
            listViewBtn.classList.add('bg-blue-700', 'text-white');
            dayViewBtn.classList.remove('bg-blue-700', 'text-white');
            weekViewBtn.classList.remove('bg-blue-700', 'text-white');
            break;
        case 'day':
            dayView.classList.remove('view-hidden');
            dayViewBtn.classList.add('bg-blue-700', 'text-white');
            listViewBtn.classList.remove('bg-blue-700', 'text-white');
            weekViewBtn.classList.remove('bg-blue-700', 'text-white');
            renderDayView();
            break;
        case 'week':
            weekView.classList.remove('view-hidden');
            weekViewBtn.classList.add('bg-blue-700', 'text-white');
            listViewBtn.classList.remove('bg-blue-700', 'text-white');
            dayViewBtn.classList.remove('bg-blue-700', 'text-white');
            renderWeekView();
            break;
    }
}

// 渲染日视图
function renderDayView() {
    dayViewDate.textContent = formatDate(currentDayViewDate);
    timeline.innerHTML = '';
    
    // 生成时间轴
    for (let hour = 0; hour < 24; hour++) {
        const timeBlock = createTimeBlock(hour, currentDayViewDate);
        timeline.appendChild(timeBlock);
    }
    
    // 添加当前时间指示器
    addCurrentTimeIndicator();
}

// 渲染周视图
function renderWeekView() {
    // 更新周视图日期显示
    const weekEnd = new Date(currentWeekStartDate.getTime() + 6 * DAY_MS);
    weekViewDate.textContent = `${formatDate(currentWeekStartDate)} - ${formatDate(weekEnd)}`;
    
    // 生成表头
    generateWeekHeader();
    
    // 生成时间格子
    generateWeekGrid();
    
    // 添加任务到周视图
    addTasksToWeekView();
    
    // 添加当前时间指示器
    addCurrentTimeIndicatorWeek();
}

export {
    renderTasks,
    updateTaskCount,
    setActiveView,
    renderDayView,
    renderWeekView,
    createTaskElement
};