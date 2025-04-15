import { API_URL } from './api.js';
import { formatDateInput } from './utils.js';
import { renderTasks, updateTaskCount, renderDayView, renderWeekView } from './viewManagement.js';
import { showNotification } from './utils.js';

// 创建任务对象
function createTaskObject(text, priority, date, time) {
    const taskDateObj = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    taskDateObj.setHours(hours, minutes, 0, 0);
    
    return {
        text: text,
        completed: false,
        priority: priority,
        date: date,
        time: time,
        datetime: taskDateObj.toISOString()
    };
}

// 检查任务是否有变更
function hasTaskChanged(localTask, serverTask) {
    return localTask.text !== serverTask.text ||
           localTask.completed !== serverTask.completed ||
           localTask.priority !== serverTask.priority ||
           localTask.date !== serverTask.date ||
           localTask.time !== serverTask.time;
}

// 创建新任务到服务器
async function createTaskOnServer(task) {
    try {
        const response = await fetch(`${API_URL}/todo-tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            throw new Error('创建任务失败');
        }

        return await response.json();
    } catch (error) {
        console.error('创建服务器任务失败:', error);
        throw error;
    }
}

// 添加任务
async function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;
    const date = taskDate.value;
    const time = taskTime.value;
    
    if (!taskText || !date || !time) {
        showNotification('请填写完整的任务信息', 'error');
        return;
    }
    
    try {
        const newTask = createTaskObject(taskText, priority, date, time);
        const serverTask = await createTaskOnServer(newTask);
        
        tasks.push(serverTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // 重置表单
        taskInput.value = '';
        prioritySelect.value = 'low';
        
        // 更新视图
        renderTasks();
        updateTaskCount();
        renderDayView();
        renderWeekView();
        
        showNotification('任务添加成功', 'success');
    } catch (error) {
        console.error('添加任务失败:', error);
        showNotification('添加任务失败: ' + error.message, 'error');
    }
}

// 删除任务
async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/todo-tasks/${taskId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('删除任务失败');
        }

        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        renderTasks();
        updateTaskCount();
        renderDayView();
        renderWeekView();
        
        showNotification('任务删除成功', 'success');
    } catch (error) {
        console.error('删除任务失败:', error);
        showNotification('删除任务失败: ' + error.message, 'error');
    }
}

// 更新任务状态
async function toggleTaskComplete(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;

        const response = await fetch(`${API_URL}/todo-tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            throw new Error('更新任务状态失败');
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        renderTasks();
        updateTaskCount();
        renderDayView();
        renderWeekView();
    } catch (error) {
        console.error('更新任务状态失败:', error);
        showNotification('更新任务状态失败: ' + error.message, 'error');
    }
}

export { 
    createTaskObject, 
    hasTaskChanged, 
    createTaskOnServer, 
    addTask, 
    deleteTask, 
    toggleTaskComplete 
};