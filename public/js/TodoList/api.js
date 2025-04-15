// API 基础配置
const API_URL = window.API_URL || '/api';

// 获取任务列表
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/todo-tasks`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('获取任务失败');
        }
        
        const serverTasks = await response.json();
        tasks = serverTasks;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        renderTasks();
        updateTaskCount();
        renderDayView();
        renderWeekView();
    } catch (error) {
        console.error('获取任务失败:', error);
        showNotification('获取任务失败: ' + error.message, 'error');
        
        // 如果服务器请求失败，使用本地存储的任务
        const localTasks = localStorage.getItem('tasks');
        if (localTasks) {
            tasks = JSON.parse(localTasks);
            renderTasks();
            updateTaskCount();
            renderDayView();
            renderWeekView();
        }
    }
}

// 同步任务到服务器
async function syncTasksWithServer() {
    try {
        const serverResponse = await fetch(`${API_URL}/todo-tasks`, {
            credentials: 'include'
        });
        
        if (!serverResponse.ok) {
            throw new Error('同步任务失败');
        }
        
        const serverTasks = await serverResponse.json();
        const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        
        // 比较本地和服务器任务，处理冲突
        const syncedTasks = await handleTaskConflicts(localTasks, serverTasks);
        
        // 更新本地存储和状态
        tasks = syncedTasks;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // 更新视图
        renderTasks();
        updateTaskCount();
        renderDayView();
        renderWeekView();
        
        return true;
    } catch (error) {
        console.error('同步任务失败:', error);
        showNotification('同步任务失败: ' + error.message, 'error');
        return false;
    }
}

// 处理任务冲突
async function handleTaskConflicts(localTasks, serverTasks) {
    const mergedTasks = [...serverTasks];
    
    for (const localTask of localTasks) {
        const serverTask = serverTasks.find(t => t.id === localTask.id);
        
        if (!serverTask) {
            // 本地新任务，添加到服务器
            try {
                const newTask = await createTaskOnServer(localTask);
                mergedTasks.push(newTask);
            } catch (error) {
                console.error('创建任务失败:', error);
            }
        } else if (hasTaskChanged(localTask, serverTask)) {
            // 任务有更新，同步到服务器
            try {
                const updatedTask = await updateTaskOnServer(localTask);
                const index = mergedTasks.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) {
                    mergedTasks[index] = updatedTask;
                }
            } catch (error) {
                console.error('更新任务失败:', error);
            }
        }
    }
    
    return mergedTasks;
}

// 导出课程表到任务列表
async function importSchedule() {
    try {
        const response = await fetch(`${API_URL}/schedule`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('获取课程表失败');
        }
        
        const schedule = await response.json();
        
        // 将课程转换为任务
        for (const course of schedule) {
            const task = {
                text: `${course.name} - ${course.location}`,
                completed: false,
                priority: 'medium',
                date: course.date,
                time: course.startTime,
                type: 'course'
            };
            
            await createTaskOnServer(task);
        }
        
        // 重新获取任务列表
        await fetchTasks();
        showNotification('课程表导入成功', 'success');
    } catch (error) {
        console.error('导入课程表失败:', error);
        showNotification('导入课程表失败: ' + error.message, 'error');
    }
}

export {
    API_URL,
    fetchTasks,
    syncTasksWithServer,
    importSchedule
};