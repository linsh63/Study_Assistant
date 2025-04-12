// API URL
// 添加API_URL常量
const API_URL = '/api';
let currentUser = null;
let allTasks = [];
let currentDateRange = 'day';
let currentTaskFilter = 'all';

// DOM元素
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const completionRateEl = document.getElementById('completion-rate');
const totalFocusTimeEl = document.getElementById('total-focus-time');
const taskListEl = document.getElementById('task-list');
const dateButtons = document.querySelectorAll('.date-btn');
const showAllBtn = document.getElementById('show-all-btn');
const showCompletedBtn = document.getElementById('show-completed-btn');
const showIncompleteBtn = document.getElementById('show-incomplete-btn');
const staticBg = document.getElementById('static-bg');

// 图表实例
let focusTimeChart;
let completionRateChart;

// 检查用户登录状态
async function checkLogin() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.log('用户未登录，跳转到登录页面');
            window.location.href = 'login.html?redirect=pomodoro-stats.html';
            return false;
        }
        
        const userData = await response.json();
        currentUser = userData;
        console.log('当前登录用户:', currentUser);
        
        // 更新用户信息显示
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').textContent = currentUser.username;
        }
        
        return true;
    } catch (error) {
        console.error('检查登录状态失败:', error);
        window.location.href = 'login.html?redirect=pomodoro-stats.html';
        return false;
    }
}

// 从服务器获取任务数据
async function fetchTasks() {
    try {
        console.log('开始从服务器获取任务数据...');
        
        // 从API获取任务数据
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }
        
        const tasks = await response.json();
        console.log(`从服务器获取到 ${tasks.length} 条任务记录`);
        
        // 更新全局任务数据
        allTasks = tasks;
        
        // 同时更新本地存储，作为备份
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
        
        return tasks;
    } catch (error) {
        console.error('从服务器获取任务数据失败:', error);
        
        // 尝试从本地存储获取任务数据作为备份
        console.log('尝试从本地存储获取任务数据...');
        try {
            const localTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
            console.log(`从本地存储获取到 ${localTasks.length} 条任务记录`);
            
            // 更新全局任务数据
            allTasks = localTasks;
            
            return localTasks;
        } catch (localError) {
            console.error('从本地存储获取任务数据失败:', localError);
            
            taskListEl.innerHTML = `<div class="flex justify-center items-center h-40 text-red-500">
                <p>获取数据失败: ${error.message}</p>
            </div>`;
            return [];
        }
    }
}

// 根据日期范围筛选任务
// 优化筛选函数，减少重复计算
function filterTasksByDateRange(tasks, range) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return [];
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 使用缓存优化，避免重复计算
    const cacheKey = `${range}_${today.toISOString().split('T')[0]}`;
    if (window.taskFilterCache && window.taskFilterCache[cacheKey]) {
        return window.taskFilterCache[cacheKey];
    }
    
    // 初始化缓存对象
    if (!window.taskFilterCache) {
        window.taskFilterCache = {};
    }
    
    let result = [];
    
    switch (range) {
        case 'day':
            // 今天的任务
            return tasks.filter(task => {
                if (!task.startTime) return false;
                const taskDate = new Date(task.startTime);
                return taskDate.getDate() === today.getDate() &&
                       taskDate.getMonth() === today.getMonth() &&
                       taskDate.getFullYear() === today.getFullYear();
            });
        
        case 'week':
            // 本周的任务（周一到周日）
            const firstDayOfWeek = new Date(today);
            const day = today.getDay() || 7; // 如果是周日，getDay()返回0，我们将其视为7
            firstDayOfWeek.setDate(today.getDate() - (day - 1)); // 设置为本周一
            
            return tasks.filter(task => {
                if (!task.startTime) return false;
                const taskDate = new Date(task.startTime);
                return taskDate >= firstDayOfWeek;
            });
        
        case 'month':
            // 本月的任务
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            return tasks.filter(task => {
                if (!task.startTime) return false;
                const taskDate = new Date(task.startTime);
                return taskDate.getMonth() === now.getMonth() &&
                       taskDate.getFullYear() === now.getFullYear();
            });
        
        case 'all':
        default:
            // 所有任务
            return tasks;
    }
}

        // 更新统计概览
        function updateStatsSummary(tasks) {
    const filteredTasks = filterTasksByDateRange(tasks, currentDateRange);
    
    // 计算总任务数 (只计算工作模式的任务)
    const totalTasks = filteredTasks.length;
    
    // 计算完成的任务数
    const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
    
    // 计算完成率
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 计算总专注时间（秒）
    const totalFocusSeconds = filteredTasks.reduce((total, task) => {
        // 确保只统计工作模式的时间，并且使用实际专注时间
        if (task.actualDuration) {
            return total + task.actualDuration;
        } else if (task.plannedDuration && task.status === 'completed') {
            // 如果任务已完成但没有记录实际时间，使用计划时间
            return total + task.plannedDuration;
        } else if (task.status === 'abandoned') {
            // 已放弃任务的专注时间计算
            if (task.elapsedSeconds !== undefined) {
                // 如果有已经过时间，直接使用
                return total + task.elapsedSeconds;
            } else if (task.actualTime !== undefined) {
                // 兼容其他可能的时间记录字段
                return total + task.actualTime;
            } else if (task.remainingSeconds !== undefined && task.plannedDuration) {
                // 如果有剩余时间和计划时间，用计划时间减去剩余时间
                return total + (task.plannedDuration - task.remainingSeconds);
            }
        }
        return total;
    }, 0);
    
    // 转换为小时和分钟
    const totalHours = Math.floor(totalFocusSeconds / 3600);
    const totalMinutes = Math.floor((totalFocusSeconds % 3600) / 60);
    
    // 更新DOM
    totalTasksEl.textContent = totalTasks;
    completedTasksEl.textContent = completedTasks;
    completionRateEl.textContent = `${completionRate}%`;
    
    if (totalHours > 0) {
        totalFocusTimeEl.textContent = `${totalHours}小时${totalMinutes}分钟`;
    } else {
        totalFocusTimeEl.textContent = `${totalMinutes}分钟`;
    }
}

// 根据任务状态筛选任务
function filterTasksByStatus(tasks, status) {
    if (status === 'all') {
        return tasks; // 已经在fetchTasks中过滤过，这里返回的都是已完成或已放弃的任务
    } else if (status === 'completed') {
        return tasks.filter(task => task.status === 'completed');
    } else if (status === 'abandoned' || status === 'incomplete') {
        // 处理已放弃的任务，兼容可能的 incomplete 状态
        return tasks.filter(task => task.status === 'abandoned');
    }
    return tasks;
}

// 渲染任务列表
function renderTaskList(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        taskListEl.innerHTML = `<div class="flex justify-center items-center h-40 text-gray-500">
            <p>暂无任务记录</p>
        </div>`;
        return;
    }
    
    // 根据当前筛选条件过滤任务
    const filteredTasks = filterTasksByStatus(
        filterTasksByDateRange(tasks, currentDateRange),
        currentTaskFilter
    );
    
    if (filteredTasks.length === 0) {
        taskListEl.innerHTML = `<div class="flex justify-center items-center h-40 text-gray-500">
            <p>没有符合条件的任务</p>
        </div>`;
        return;
    }
    
    // 按开始时间降序排序
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        return new Date(b.startTime) - new Date(a.startTime);
    });
    
    // 生成任务列表HTML
    const tasksHTML = sortedTasks.map(task => {
        const startTime = new Date(task.startTime);
        const formattedDate = `${startTime.getFullYear()}-${(startTime.getMonth() + 1).toString().padStart(2, '0')}-${startTime.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        
                        // 计算实际专注时间
                        let actualDuration = 0;
        if (task.actualDuration) {
            // 如果有记录实际时间，直接使用
            actualDuration = task.actualDuration;
        } else if (task.plannedDuration && task.status === 'completed') {
            // 已完成任务使用计划时间
            actualDuration = task.plannedDuration;
        } else if (task.status === 'abandoned') {
            // 已放弃任务的专注时间计算
            if (task.elapsedSeconds !== undefined) {
                // 如果有已经过时间，直接使用
                actualDuration = task.elapsedSeconds;
            } else if (task.actualTime !== undefined) {
                // 兼容其他可能的时间记录字段
                actualDuration = task.actualTime;
            } else if (task.remainingSeconds !== undefined && task.plannedDuration) {
                // 如果有剩余时间和计划时间，用计划时间减去剩余时间
                actualDuration = task.plannedDuration - task.remainingSeconds;
            } else {
                // 如果没有任何时间记录，默认为0
                actualDuration = 0;
            }
        }
        
        // 确保时间不为负数
        actualDuration = Math.max(0, actualDuration);

        const minutes = Math.floor(actualDuration / 60);
        const seconds = actualDuration % 60;
        const durationText = `${minutes}分${seconds}秒`;
        
        // 任务状态样式 - 只有已完成和已放弃两种状态
        let statusClass = '';
        let statusText = '';
        
        if (task.status === 'completed') {
            statusClass = 'bg-green-900 text-green-300';
            statusText = '已完成';
        } else {
            // 其他状态都视为已放弃
            statusClass = 'bg-red-900 text-red-300';
            statusText = '已放弃';
        }
        
        return `
        <div class="task-item p-3 mb-3 bg-gray-800 rounded-lg">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-medium text-white">${task.taskName || '未命名任务'}</h4>
                    <p class="text-sm text-gray-400">${formattedDate} ${formattedTime}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded ${statusClass}">${statusText}</span>
            </div>
            <div class="mt-2 text-sm">
                <span class="text-purple-400">专注时长: ${durationText}</span>
            </div>
        </div>`;
    }).join('');
    
    taskListEl.innerHTML = tasksHTML;
}
// 创建专注时间图表
function createFocusTimeChart(tasks) {
    const ctx = document.getElementById('focus-time-chart').getContext('2d');
    const emptyChartEl = document.getElementById('empty-focus-chart');
    
    // 根据当前日期范围筛选任务
    const filteredTasks = filterTasksByDateRange(tasks, currentDateRange);
    
    // 检查当前日期范围是否有数据
    const hasData = filteredTasks.length > 0;
    
    // 准备数据
    const chartData = prepareTimeChartData(tasks, currentDateRange);
    
    // 如果是"今日"视图且没有数据，显示空状态
    if (currentDateRange === 'day' && !hasData) {
        if (emptyChartEl) {
            document.getElementById('focus-time-chart').style.display = 'none';
            emptyChartEl.classList.remove('hidden');
        }
        return;
    }
    
    // 对于其他视图或有数据的情况，显示图表
    if (emptyChartEl) {
        document.getElementById('focus-time-chart').style.display = 'block';
        emptyChartEl.classList.add('hidden');
    }
    
    // 如果已有图表实例，尝试更新数据而不是销毁重建
    if (focusTimeChart) {
        focusTimeChart.data.labels = chartData.labels;
        focusTimeChart.data.datasets[0].data = chartData.data;
        // 添加这一行，更新图表标题
        focusTimeChart.options.plugins.title.text = getChartTitle(currentDateRange, 'focus', hasData);
        focusTimeChart.update();
    } else {
        // 创建新图表
        focusTimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '专注时间（分钟）',
                    data: chartData.data,
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const minutes = context.raw;
                                if (minutes >= 60) {
                                    const hours = Math.floor(minutes / 60);
                                    const mins = minutes % 60;
                                    return `${hours}小时${mins}分钟`;
                                }
                                return `${minutes}分钟`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: getChartTitle(currentDateRange, 'focus', hasData),
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }
}

// 优化完成率图表创建函数
function createCompletionRateChart(tasks) {
    const ctx = document.getElementById('completion-rate-chart').getContext('2d');
    const emptyChartEl = document.getElementById('empty-completion-chart');
    
    // 根据当前日期范围筛选任务
    const filteredTasks = filterTasksByDateRange(tasks, currentDateRange);
    
    // 检查当前日期范围是否有数据
    const hasData = filteredTasks.length > 0;
    
    // 如果是"今日"视图且没有数据，显示空状态
    if (currentDateRange === 'day' && !hasData) {
        if (emptyChartEl) {
            document.getElementById('completion-rate-chart').style.display = 'none';
            emptyChartEl.classList.remove('hidden');
        }
        
        // 如果已有图表实例，销毁它
        if (completionRateChart) {
            completionRateChart.destroy();
            completionRateChart = null;
        }
        return;
    }
    
    // 对于其他视图或有数据的情况，显示图表
    if (emptyChartEl) {
        document.getElementById('completion-rate-chart').style.display = 'block';
        emptyChartEl.classList.add('hidden');
    }
    
    // 如果已有图表实例，销毁它
    if (completionRateChart) {
        completionRateChart.destroy();
    }
    
    // 根据当前日期范围选择不同的图表类型
    if (currentDateRange === 'day') {
        // 单日使用饼状图显示完成和放弃的任务占比
        const completedCount = filteredTasks.filter(task => task.status === 'completed').length;
        const abandonedCount = filteredTasks.filter(task => task.status === 'abandoned').length;
        
        // 创建饼图
        completionRateChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['已完成', '已放弃'],
                datasets: [{
                    data: [completedCount || 0, abandonedCount || 0],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.7)', // 绿色 - 已完成
                        'rgba(239, 68, 68, 0.7)'   // 红色 - 已放弃
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = completedCount + abandonedCount;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value}个 (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: '今日任务完成情况',
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            }
        });
    } else {
        // 其他时间范围使用折线图
        // 准备数据
        const chartData = prepareCompletionChartData(tasks, currentDateRange);
        
        // 创建新图表
        completionRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '任务完成率 (%)',
                    data: chartData.data,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `完成率: ${context.raw}%`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: getChartTitle(currentDateRange, 'completion', hasData),
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }
}

// 获取图表标题
function getChartTitle(range, chartType, hasData) {
    if (!hasData) {
        switch(range) {
            case 'day': return chartType === 'focus' ? '今日暂无专注记录' : '今日暂无任务记录';
            case 'week': return chartType === 'focus' ? '本周专注时间统计' : '本周任务完成率';
            case 'month': return chartType === 'focus' ? '本月专注时间统计' : '本月任务完成率';
            case 'all': return chartType === 'focus' ? '所有专注时间统计' : '所有任务完成率';
            default: return chartType === 'focus' ? '专注时间统计' : '任务完成率';
        }
    } else {
        switch(range) {
            case 'day': return chartType === 'focus' ? '今日专注时间统计' : '今日任务完成情况';
            case 'week': return chartType === 'focus' ? '本周专注时间统计' : '本周任务完成率';
            case 'month': return chartType === 'focus' ? '本月专注时间统计' : '本月任务完成率';
            case 'all': return chartType === 'focus' ? '所有专注时间统计' : '所有任务完成率';
            default: return chartType === 'focus' ? '专注时间统计' : '任务完成率';
        }
    }
}

// 准备专注时间图表数据
function prepareTimeChartData(tasks, range) {
    const now = new Date();
    let labels = [];
    let data = [];
    
    switch (range) {
        case 'day':
            // 今天按小时统计
            for (let i = 0; i < 24; i++) {
                const hour = i < 10 ? `0${i}` : `${i}`;
                labels.push(`${hour}:00`);
                
                // 筛选该小时的任务
                const hourTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getHours() === i && 
                           taskDate.getDate() === now.getDate() &&
                           taskDate.getMonth() === now.getMonth() &&
                           taskDate.getFullYear() === now.getFullYear();
                });
                
                // 计算该小时的总专注分钟数
                const totalMinutes = Math.floor(hourTasks.reduce((total, task) => {
                    // 使用实际专注时间
                    if (task.actualDuration) {
                        return total + task.actualDuration;
                    } else if (task.plannedDuration && task.status === 'completed') {
                        return total + task.plannedDuration;
                    } else if (task.plannedDuration && task.status === 'abandoned' && task.remainingSeconds) {
                        return total + (task.plannedDuration - task.remainingSeconds);
                    }
                    return total;
                }, 0) / 60);
                
                data.push(totalMinutes);
            }
            break;
        
        case 'week':
            // 本周按天统计
            const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dayOfWeek = today.getDay() || 7; // 如果是周日，getDay()返回0，我们将其视为7
            
            for (let i = 0; i < 7; i++) {
                const day = new Date(today);
                day.setDate(today.getDate() - (dayOfWeek - 1) + i); // 从本周一开始
                
                const dayStr = `${day.getMonth() + 1}/${day.getDate()}`;
                labels.push(`${dayNames[i]}\n${dayStr}`);
                
                // 筛选该天的任务
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getDate() === day.getDate() &&
                           taskDate.getMonth() === day.getMonth() &&
                           taskDate.getFullYear() === day.getFullYear();
                });
                
                // 计算该天的总专注分钟数
                const totalMinutes = Math.floor(dayTasks.reduce((total, task) => {
                    // 修复：使用与日视图相同的逻辑计算专注时间
                    if (task.actualDuration) {
                        return total + task.actualDuration;
                    } else if (task.plannedDuration && task.status === 'completed') {
                        return total + task.plannedDuration;
                    } else if (task.plannedDuration && task.status === 'abandoned' && task.remainingSeconds) {
                        return total + (task.plannedDuration - task.remainingSeconds);
                    }
                    return total;
                }, 0) / 60);
                
                data.push(totalMinutes);
            }
            break;
        
        case 'month':
            // 本月按天统计
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(`${i}日`);
                
                const day = new Date(now.getFullYear(), now.getMonth(), i);
                
                // 筛选该天的任务
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getDate() === day.getDate() &&
                           taskDate.getMonth() === day.getMonth() &&
                           taskDate.getFullYear() === day.getFullYear();
                });
                
                // 计算该天的总专注分钟数
                const totalMinutes = Math.floor(dayTasks.reduce((total, task) => {
                    // 修复：使用与日视图相同的逻辑计算专注时间
                    if (task.actualDuration) {
                        return total + task.actualDuration;
                    } else if (task.plannedDuration && task.status === 'completed') {
                        return total + task.plannedDuration;
                    } else if (task.plannedDuration && task.status === 'abandoned' && task.remainingSeconds) {
                        return total + (task.plannedDuration - task.remainingSeconds);
                    }
                    return total;
                }, 0) / 60);
                
                data.push(totalMinutes);
            }
            break;
        
        case 'all':
        default:
            // 按月统计
            const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            
            // 找出最早的任务日期
            let earliestDate = new Date();
            if (tasks.length > 0) {
                tasks.forEach(task => {
                    const taskDate = new Date(task.startTime);
                    if (taskDate < earliestDate) {
                        earliestDate = taskDate;
                    }
                });
            }
            
            // 从最早的月份到当前月份
            const startYear = earliestDate.getFullYear();
            const startMonth = earliestDate.getMonth();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            // 计算月份差
            const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
            const monthsToShow = Math.min(monthDiff, 12); // 最多显示12个月
            
            for (let i = 0; i < monthsToShow; i++) {
                const monthIndex = (currentMonth - i + 12) % 12; // 从当前月份往前推
                const yearOffset = Math.floor((currentMonth - i) / 12);
                const year = currentYear - yearOffset;
                
                labels.unshift(`${year}年${monthNames[monthIndex]}`);
                
                // 筛选该月的任务
                const monthTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getMonth() === monthIndex &&
                           taskDate.getFullYear() === year;
                });
                
                // 计算该月的总专注分钟数
                const totalMinutes = Math.floor(monthTasks.reduce((total, task) => {
                    // 修复：使用与日视图相同的逻辑计算专注时间
                    if (task.actualDuration) {
                        return total + task.actualDuration;
                    } else if (task.plannedDuration && task.status === 'completed') {
                        return total + task.plannedDuration;
                    } else if (task.plannedDuration && task.status === 'abandoned' && task.remainingSeconds) {
                        return total + (task.plannedDuration - task.remainingSeconds);
                    }
                    return total;
                }, 0) / 60);
                
                data.unshift(totalMinutes);
            }
            break;
    }
    
    return { labels, data };
}

// 准备完成率图表数据
function prepareCompletionChartData(tasks, range) {
    const now = new Date();
    let labels = [];
    let data = [];
    
    switch (range) {
        case 'day':
            // 今天按小时统计
            for (let i = 0; i < 24; i++) {
                const hour = i < 10 ? `0${i}` : `${i}`;
                labels.push(`${hour}:00`);
                
                // 筛选该小时的任务
                const hourTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getHours() === i && 
                           taskDate.getDate() === now.getDate() &&
                           taskDate.getMonth() === now.getMonth() &&
                           taskDate.getFullYear() === now.getFullYear();
                });
                
                // 计算该小时的完成率
                if (hourTasks.length > 0) {
                    const completedTasks = hourTasks.filter(task => task.status === 'completed').length;
                    const completionRate = Math.round((completedTasks / hourTasks.length) * 100);
                    data.push(completionRate);
                } else {
                    data.push(0); // 没有任务时完成率为0
                }
            }
            break;
        
        case 'week':
            // 本周按天统计
            const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dayOfWeek = today.getDay() || 7; // 如果是周日，getDay()返回0，我们将其视为7
            
            for (let i = 0; i < 7; i++) {
                const day = new Date(today);
                day.setDate(today.getDate() - (dayOfWeek - 1) + i); // 从本周一开始
                
                const dayStr = `${day.getMonth() + 1}/${day.getDate()}`;
                labels.push(`${dayNames[i]}\n${dayStr}`);
                
                // 筛选该天的任务
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getDate() === day.getDate() &&
                           taskDate.getMonth() === day.getMonth() &&
                           taskDate.getFullYear() === day.getFullYear();
                });
                
                // 计算该天的完成率
                if (dayTasks.length > 0) {
                    const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
                    const completionRate = Math.round((completedTasks / dayTasks.length) * 100);
                    data.push(completionRate);
                } else {
                    data.push(0);
                }
            }
            break;
        
        case 'month':
            // 本月按天统计
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(`${i}日`);
                
                const day = new Date(now.getFullYear(), now.getMonth(), i);
                
                // 筛选该天的任务
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getDate() === day.getDate() &&
                           taskDate.getMonth() === day.getMonth() &&
                           taskDate.getFullYear() === day.getFullYear();
                });
                
                // 计算该天的完成率
                if (dayTasks.length > 0) {
                    const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
                    const completionRate = Math.round((completedTasks / dayTasks.length) * 100);
                    data.push(completionRate);
                } else {
                    data.push(0);
                }
            }
            break;
        
        case 'all':
        default:
            // 按月统计
            const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            
            // 找出最早的任务日期
            let earliestDate = new Date();
            if (tasks.length > 0) {
                tasks.forEach(task => {
                    const taskDate = new Date(task.startTime);
                    if (taskDate < earliestDate) {
                        earliestDate = taskDate;
                    }
                });
            }
            
            // 从最早的月份到当前月份
            const startYear = earliestDate.getFullYear();
            const startMonth = earliestDate.getMonth();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            // 计算月份差
            const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
            const monthsToShow = Math.min(monthDiff, 12); // 最多显示12个月
            
            for (let i = 0; i < monthsToShow; i++) {
                const monthIndex = (currentMonth - i + 12) % 12; // 从当前月份往前推
                const yearOffset = Math.floor((currentMonth - i) / 12);
                const year = currentYear - yearOffset;
                
                labels.unshift(`${year}年${monthNames[monthIndex]}`);
                
                // 筛选该月的任务
                const monthTasks = tasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    return taskDate.getMonth() === monthIndex &&
                           taskDate.getFullYear() === year;
                });
                
                // 计算该月的完成率
                if (monthTasks.length > 0) {
                    const completedTasks = monthTasks.filter(task => task.status === 'completed').length;
                    const completionRate = Math.round((completedTasks / monthTasks.length) * 100);
                    data.unshift(completionRate);
                } else {
                    data.unshift(0);
                }
            }
            break;
    }
    
    return { labels, data };
}

// 更新所有统计数据和图表
function updateAllStats() {
    updateStatsSummary(allTasks);
    updateTaskList(allTasks);
    createFocusTimeChart(allTasks);
    createCompletionRateChart(allTasks);
}

// 更新任务列表 - 添加这个函数
function updateTaskList(tasks) {
    renderTaskList(tasks);
}

// 初始化页面
async function init() {
    // 更新筛选按钮文本
    showAllBtn.textContent = '全部';
    showCompletedBtn.textContent = '已完成';
    showIncompleteBtn.textContent = '已放弃'; // 修改为"已放弃"而不是"未完成"
    try {
        console.log('开始初始化页面...');
        
        // 首先检查登录状态
        const isLoggedIn = await checkLogin();
        if (!isLoggedIn) {
            console.log('用户未登录，跳转到登录页面');
            return;
        }
        
        // 先初始化空统计数据
        updateStatsSummary([]);
        
        // 显示加载中的任务列表
        taskListEl.innerHTML = `<div class="flex justify-center items-center h-40">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <p class="ml-2 text-gray-400">加载中...</p>
        </div>`;
        
        // 获取任务数据
        const tasks = await fetchTasks();
        console.log('初始化获取到任务数据:', tasks);
        
        if (tasks && tasks.length > 0) {
            console.log(`成功获取到 ${tasks.length} 条任务记录`);
            allTasks = tasks;
            updateAllStats();
        } else {
            console.log('没有获取到任务数据或数据为空');
            // 尝试从localStorage获取任务数据
            try {
                const localTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
                console.log('从localStorage获取到的任务:', localTasks);
                
                if (localTasks && localTasks.length > 0) {
                    allTasks = localTasks;
                    console.log(`从本地存储获取到 ${localTasks.length} 条任务记录`);
                    updateAllStats();
                    return;
                }
            } catch (e) {
                console.error('读取本地存储任务失败:', e);
            }
            
            // 显示暂无任务记录
            taskListEl.innerHTML = `<div class="flex justify-center items-center h-40 text-gray-500">
                <p>暂无任务记录</p>
            </div>`;
            
            // 显示空图表
            createFocusTimeChart([]);
            createCompletionRateChart([]);
        }
    } catch (error) {
        console.error('初始化过程中出错:', error);
        taskListEl.innerHTML = `<div class="flex justify-center items-center h-40 text-red-500">
            <p>加载失败: ${error.message}</p>
        </div>`;
        
        // 显示错误提示
        document.getElementById('focus-time-chart').parentNode.innerHTML = `
            <div class="flex flex-col items-center justify-center h-40 text-red-500">
                <i class="fas fa-exclamation-circle mb-2 text-2xl"></i>
                <p>加载失败</p>
            </div>`;
            
        document.getElementById('completion-rate-chart').parentNode.innerHTML = `
            <div class="flex flex-col items-center justify-center h-40 text-red-500">
                <i class="fas fa-exclamation-circle mb-2 text-2xl"></i>
                <p>加载失败</p>
            </div>`;
    }
    
    // 添加日期范围按钮事件
    dateButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新按钮样式
            dateButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 更新当前日期范围
            currentDateRange = button.dataset.range;
            
            // 更新统计和图表
            if (allTasks && allTasks.length > 0) {
                updateAllStats();
            } else {
                // 即使没有数据，也创建空图表
                createFocusTimeChart([]);
                createCompletionRateChart([]);
            }
        });
    });
    
    // 添加任务筛选按钮事件
    showAllBtn.addEventListener('click', () => {
        currentTaskFilter = 'all';
        updateTaskList(allTasks);
    });
    
    showCompletedBtn.addEventListener('click', () => {
        currentTaskFilter = 'completed';
        updateTaskList(allTasks);
    });
    
    showIncompleteBtn.addEventListener('click', () => {
        currentTaskFilter = 'abandoned'; // 修改为 'abandoned' 而不是 'incomplete'
        updateTaskList(allTasks);
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);