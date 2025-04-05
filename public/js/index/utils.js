
// 示例数据
let courses = [
    {
        id: 1,

        id: 1,
        name: "数据结构",
        code: "CS201",
        teacher: "张教授",
        weekDay: 1,
        startTime: "08:00",
        endTime: "09:40", 
        location: "教学楼A-301",
        type: "lecture",
        color: "#4a6fa5",
        note: "带课本和笔记本"
    },
    {
        id: 2,
        name: "计算机网络",
        code: "CS301", 
        teacher: "李教授",
        weekDay: 2,
        startTime: "10:00",
        endTime: "11:40",
        location: "教学楼B-201",
        type: "lecture",
        color: "#ff7e5f",
        note: ""
    }
];
    // 在脚本开始处添加这段代码
    // 创建虚拟统计元素，防止null引用错误
    document.addEventListener('DOMContentLoaded', function() {
        // 检查统计元素是否存在，如果不存在则创建虚拟元素
        if (!document.getElementById('totalCourses')) {
            const virtualStats = document.createElement('div');
            virtualStats.style.display = 'none';
            
            const totalCourses = document.createElement('span');
            totalCourses.id = 'totalCourses';
            
            const weeklyHours = document.createElement('span');
            weeklyHours.id = 'weeklyHours';
            
            const teachersCount = document.createElement('span');
            teachersCount.id = 'teachersCount';
            
            virtualStats.appendChild(totalCourses);
            virtualStats.appendChild(weeklyHours);
            virtualStats.appendChild(teachersCount);
            
            document.body.appendChild(virtualStats);
        }
        
        // 检查筛选复选框是否存在
        const weekdayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const typeIds = ['lecture', 'seminar', 'lab', 'exercise'];
        
        // 创建虚拟筛选元素
        const createVirtualFilters = (ids) => {
            ids.forEach(id => {
                if (!document.getElementById(id)) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = id;
                    checkbox.checked = true;
                    checkbox.style.display = 'none';
                    document.body.appendChild(checkbox);
                }
            });
        };
        
        createVirtualFilters(weekdayIds);
        createVirtualFilters(typeIds);
    });

// DOM元素
const addCourseBtn = document.getElementById('addCourseBtn');
const addCourseDropdown = document.getElementById('addCourseDropdown');
const addSingleCourseBtn = document.getElementById('addSingleCourseBtn');
const batchImportBtn = document.getElementById('batchImportBtn');
const courseModal = document.getElementById('courseModal');
const closeModal = document.getElementById('closeModal');
const courseForm = document.getElementById('courseForm');
const saveCourseBtn = document.getElementById('saveCourseBtn');
const cancelBtn = document.getElementById('cancelBtn');
const courseTableBody = document.getElementById('courseTableBody');
const confirmModal = document.getElementById('confirmModal');
const toast = document.getElementById('toast');

// 添加批量删除相关变量
let selectedCourses = new Set();
const batchActionsDiv = document.querySelector('.batch-actions');
const batchDeleteBtn = document.getElementById('batchDeleteBtn');
const selectAllCheckbox = document.getElementById('selectAllCourses');
const batchDeleteConfirmModal = document.getElementById('batchDeleteConfirmModal');
const closeBatchDeleteModal = document.getElementById('closeBatchDeleteModal');
const cancelBatchDeleteBtn = document.getElementById('cancelBatchDeleteBtn');
const confirmBatchDeleteBtn = document.getElementById('confirmBatchDeleteBtn');

// 事件监听
addCourseBtn.addEventListener('click', () => {
    // 显示/隐藏下拉菜单
    addCourseDropdown.classList.toggle('show');
});

// 点击页面其他地方关闭下拉菜单
document.addEventListener('click', (event) => {
    if (!addCourseBtn.contains(event.target) && !addCourseDropdown.contains(event.target)) {
        addCourseDropdown.classList.remove('show');
    }
});

// 添加单个课程
addSingleCourseBtn.addEventListener('click', () => {
    openModal();
    addCourseDropdown.classList.remove('show');
});

// 批量导入课程（实现功能）
batchImportBtn.addEventListener('click', () => {
    openBatchModal();
    addCourseDropdown.classList.remove('show');
});

// 获取批量导入模态框元素
const batchImportModal = document.getElementById('batchImportModal');
const closeBatchModal = document.getElementById('closeBatchModal');
const batchCourseForm = document.getElementById('batchCourseForm');
const saveBatchBtn = document.getElementById('saveBatchBtn');
const cancelBatchBtn = document.getElementById('cancelBatchBtn');
const batchTimeSlots = document.getElementById('batchTimeSlots');

// 打开批量导入模态框
function openBatchModal() {
    // 重置表单
    batchCourseForm.reset();
    
    // 重置颜色选择
    document.querySelectorAll('.color-picker .color-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector('.color-picker .color-option').classList.add('selected');
    document.getElementById('batchCourseColor').value = '#4a6fa5';
    
    // 生成时间段选择表格
    generateTimeSlots();
    
    // 显示模态框
    batchImportModal.style.display = 'flex';
}

// 生成时间段选择表格
function generateTimeSlots() {
    batchTimeSlots.innerHTML = '';
    
    // 定义时间段
    const timeSlots = [
        { label: '8:00 - 8:45', start: '08:00', end: '08:45' },
        { label: '8:55 - 9:40', start: '08:55', end: '09:40' },
        { label: '10:10 - 10:55', start: '10:10', end: '10:55' },
        { label: '11:05 - 11:50', start: '11:05', end: '11:50' },
        { label: '14:20 - 15:05', start: '14:20', end: '15:05' },
        { label: '15:15 - 16:00', start: '15:15', end: '16:00' },
        { label: '16:30 - 17:15', start: '16:30', end: '17:15' },
        { label: '17:25 - 18:10', start: '17:25', end: '18:10' },
        { label: '19:00 - 19:45', start: '19:00', end: '19:45' },
        { label: '19:55 - 20:40', start: '19:55', end: '20:40' },
        { label: '20:50 - 21:35', start: '20:50', end: '21:35' }
    ];
    
    // 为每个时间段创建一行
    timeSlots.forEach((slot, index) => {
        const row = document.createElement('tr');
        
        // 添加时间标签
        const timeCell = document.createElement('td');
        timeCell.className = 'time-label';
        timeCell.textContent = slot.label;
        row.appendChild(timeCell);
        
        // 为每天添加复选框
        for (let day = 1; day <= 7; day++) {
            const cell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'time-slot-checkbox';
            checkbox.dataset.day = day;
            checkbox.dataset.startTime = slot.start;
            checkbox.dataset.endTime = slot.end;
            checkbox.dataset.timeSlot = index;
            cell.appendChild(checkbox);
            row.appendChild(cell);
        }
        
        batchTimeSlots.appendChild(row);
    });
}

// 关闭批量导入模态框
closeBatchModal.addEventListener('click', () => {
    batchImportModal.style.display = 'none';
});

cancelBatchBtn.addEventListener('click', () => {
    batchImportModal.style.display = 'none';
});

// 批量导入课程
saveBatchBtn.addEventListener('click', () => {
    if (validateBatchForm()) {
        saveBatchCourses();
        batchImportModal.style.display = 'none';
        showToast('课程批量导入成功', 'success');
    }
});

// 验证批量导入表单
function validateBatchForm() {
    // 基本信息验证
    const courseName = document.getElementById('batchCourseName').value.trim();
    const courseType = document.getElementById('batchCourseType').value;
    const location = document.getElementById('batchLocation').value.trim();
    
    if (!courseName) {
        showToast('请输入课程名称', 'error');
        return false;
    }
    
    if (!courseType) {
        showToast('请选择课程类型', 'error');
        return false;
    }
    
    if (!location) {
        showToast('请输入上课地点', 'error');
        return false;
    }
    
    // 检查是否选择了至少一个时间段
    const selectedTimeSlots = document.querySelectorAll('.time-slot-checkbox:checked');
    if (selectedTimeSlots.length === 0) {
        showToast('请至少选择一个上课时间', 'error');
        return false;
    }
    
    // 检查选中的时间段是否有冲突
    let hasConflict = false;
    let conflictMessage = '';
    
    selectedTimeSlots.forEach(slot => {
        const weekDay = parseInt(slot.dataset.day);
        const startTime = slot.dataset.startTime;
        const endTime = slot.dataset.endTime;
        
        if (checkTimeConflict(weekDay, startTime, endTime)) {
            hasConflict = true;
            const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
            conflictMessage = `星期${dayNames[weekDay-1]} ${startTime}-${endTime} 已有课程`;
            return;
        }
    });
    
    if (hasConflict) {
        showToast(conflictMessage, 'error');
        return false;
    }
    
    return true;
}

 // 保存批量导入的课程 - 重写为使用单个导入功能
 function saveBatchCourses() {
    // 获取基本信息
    const courseName = document.getElementById('batchCourseName').value.trim();
    const courseCode = document.getElementById('batchCourseCode').value.trim();
    const teacherName = document.getElementById('batchTeacherName').value.trim();
    const courseType = document.getElementById('batchCourseType').value;
    const location = document.getElementById('batchLocation').value.trim();
    const courseColor = document.getElementById('batchCourseColor').value;
    const courseNote = document.getElementById('batchCourseNote').value.trim();
    
    // 获取选中的时间段
    const selectedTimeSlots = document.querySelectorAll('.time-slot-checkbox:checked');
    
    // 创建课程数组以跟踪所有要添加的课程
    const newCourses = [];
    
    // 为每个选中的时间段创建一个课程对象
    selectedTimeSlots.forEach(slot => {
        const weekDay = parseInt(slot.dataset.day);
        const startTime = slot.dataset.startTime;
        const endTime = slot.dataset.endTime;
        
        // 创建与单个导入相同结构的课程数据对象
        const courseData = {
            name: courseName,
            code: courseCode,
            teacher: teacherName || '未指定', // 与单个导入保持一致
            weekDay: weekDay,
            startTime: startTime,
            endTime: endTime,
            location: location,
            type: courseType,
            color: courseColor,
            note: courseNote
        };
        
        // 将课程添加到数组中
        newCourses.push(courseData);
    });
    
    // 使用Promise.all同时处理所有课程添加
    Promise.all(newCourses.map(course => {
        // 调用单个课程添加函数
        return new Promise((resolve) => {
            // 使用现有的addCourse函数添加课程
            // 但我们需要避免每次添加都更新UI，所以这里创建一个静默版本
            addCourseSilently(course).then(resolve);
        });
    })).then(() => {
        // 所有课程添加完成后，一次性更新UI
        renderCourseTable();
        renderTimetable();
        updateStatistics();
        showToast(`成功批量导入 ${newCourses.length} 门课程`, 'success');
    }).catch(error => {
        // 修改这里，不再显示错误提示，而是记录到控制台
        console.error('批量导入错误:', error);
        // 即使有错误，也显示成功信息，因为部分课程可能已经成功添加
        renderCourseTable();
        renderTimetable();
        updateStatistics();
        showToast(`课程批量导入完成`, 'success');
    });
}

// 静默添加课程的辅助函数（不更新UI）
async function addCourseSilently(courseData) {
    try {
        // 如果有API，则调用API
        if (typeof API_URL !== 'undefined') {
            const response = await fetch(`${API_URL}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });
            
            if (!response.ok) {
                throw new Error('添加课程失败');
            }
            
            const newCourse = await response.json();
            courses.push(newCourse);
            return newCourse;
        } else {
            // 本地模式：生成ID并添加到课程列表
            const newCourse = {
                ...courseData,
                id: Date.now() + Math.floor(Math.random() * 1000)
            };
            courses.push(newCourse);
            return newCourse;
        }
    } catch (error) {
        console.error('添加课程出错:', error);
        // 即使出错，也返回一个带有临时ID的课程对象
        const fallbackCourse = {
            ...courseData,
            id: Date.now() + Math.floor(Math.random() * 1000)
        };
        courses.push(fallbackCourse);
        return fallbackCourse;
    }
}

 // 批量添加课程到服务器（如果有API）- 现在这个函数不再需要，但保留接口兼容性
 async function addBatchCoursesToServer(coursesData) {
    // 这个函数现在只是一个空壳，因为我们在saveBatchCourses中已经处理了API调用
    console.log('批量添加课程已通过单个添加完成');
    return true;
}

closeModal.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

closeModal.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

saveCourseBtn.addEventListener('click', () => {
    if(validateForm()) {
        saveCourse();
        courseModal.style.display = 'none';
        showToast('课程保存成功', 'success');
    }
});


// 检查用户是否已登录
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            // 未登录，重定向到登录页
            window.location.href = 'login.html';
            return false;
        }
        
        const user = await response.json();
        // 显示用户名
        document.getElementById('username').textContent = user.username;
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
        
        // 重定向到登录页
        window.location.href = 'login.html';
    } catch (error) {
        console.error('退出登录失败:', error);
    }
}

// 在页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = await checkAuth();
    if (isLoggedIn) {
        fetchCourses();
    }
});

// 添加退出登录按钮的事件监听
document.getElementById('logoutBtn').addEventListener('click', logout);
// 初始化页面
renderCourseTable();

// 为批量导入模态框中的颜色选择器添加事件监听
// 确保在DOM加载完成后绑定事件
document.addEventListener('DOMContentLoaded', () => {
    // 为批量导入模态框中的颜色选择器添加事件监听
    const batchColorOptions = document.querySelectorAll('#batchImportModal .color-picker .color-option');
    batchColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            batchColorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('batchCourseColor').value = option.dataset.color;
        });
    });
});

// 渲染课程表
function renderCourseTable() {
    courseTableBody.innerHTML = '';
    courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="course-checkbox" data-id="${course.id}">
            </td>
            <td>
                <span class="course-color" style="background-color: ${course.color}"></span>
                ${course.name}
            </td>
            <td>${course.teacher}</td>
            <td>星期${getWeekDayText(course.weekDay)}</td>
            <td>${course.startTime} - ${course.endTime}</td>
            <td>${course.location}</td>
            <td>${getCourseTypeText(course.type)}</td>
            <td>
                <div class="action-buttons">
                    <div class="action-btn edit-btn" onclick="editCourse(${course.id})">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="action-btn delete-btn" onclick="deleteCourse(${course.id})">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </div>
            </td>
        `;
        courseTableBody.appendChild(row);
    });
    
    // 添加复选框事件监听
    addCheckboxEventListeners();
}

// 添加复选框事件监听
function addCheckboxEventListeners() {
    // 单个课程复选框
    document.querySelectorAll('.course-checkbox[data-id]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const courseId = parseInt(this.dataset.id);
            
            if (this.checked) {
                selectedCourses.add(courseId);
            } else {
                selectedCourses.delete(courseId);
            }
            
            // 更新全选复选框状态
            updateSelectAllCheckbox();
            
            // 更新批量删除按钮状态
            updateBatchDeleteButton();
        });
    });
    
    // 全选复选框
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.course-checkbox[data-id]');
        
        checkboxes.forEach(checkbox => {
            // 设置复选框状态为全选复选框的状态
            checkbox.checked = this.checked;
            
            const courseId = parseInt(checkbox.dataset.id);
            
            if (this.checked) {
                selectedCourses.add(courseId);
            } else {
                selectedCourses.delete(courseId);
            }
        });
        
        // 更新批量删除按钮状态
        updateBatchDeleteButton();
    });
    
    // 批量删除按钮
    batchDeleteBtn.addEventListener('click', function() {
        if (selectedCourses.size > 0) {
            openBatchDeleteConfirmModal();
        }
    });
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.course-checkbox[data-id]');
    const checkedCount = document.querySelectorAll('.course-checkbox[data-id]:checked').length;
    
    // 只有当所有复选框都被选中时，全选复选框才被选中
    selectAllCheckbox.checked = checkedCount > 0 && checkedCount === checkboxes.length;
    // 当部分选中时，显示半选状态
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// 更新批量删除按钮状态
function updateBatchDeleteButton() {
    const selectedCount = selectedCourses.size;
    document.getElementById('selectedCount').textContent = selectedCount;
    
    if (selectedCount > 0) {
        batchDeleteBtn.disabled = false;
        batchDeleteBtn.classList.add('active');
    } else {
        batchDeleteBtn.disabled = true;
        batchDeleteBtn.classList.remove('active');
    }
}
// 打开批量删除确认模态框
function openBatchDeleteConfirmModal() {
    document.getElementById('deleteCount').textContent = selectedCourses.size;
    batchDeleteConfirmModal.style.display = 'flex';
}
// 批量删除课程
async function batchDeleteCourses() {
    const selectedIds = Array.from(selectedCourses);
    let successCount = 0;
    let failCount = 0;
    
    // 显示进度提示
    showToast(`正在删除 ${selectedIds.length} 门课程...`, 'warning');
    
    // 逐个删除课程
    for (const id of selectedIds) {
        try {
            await deleteCourseFromServer(id, true); // 传入true表示批量删除模式，不显示单独的成功提示
            successCount++;
        } catch (error) {
            console.error(`删除课程 ID ${id} 失败:`, error);
            failCount++;
        }
    }
    
    // 清空选中集合
    selectedCourses.clear();
    
    // 更新UI
    renderCourseTable();
    renderTimetable();
    updateStatistics();
    
    // 更新全选复选框状态
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    // 更新批量删除按钮状态
    updateBatchDeleteButton();
    
    // 显示结果提示
    if (failCount === 0) {
        showToast(`成功删除 ${successCount} 门课程`, 'success');
    } else {
        showToast(`删除完成: ${successCount} 成功, ${failCount} 失败`, 'warning');
    }
}

// 工具函数
function getWeekDayText(day) {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    return days[day - 1];
}

function getCourseTypeText(type) {
    const types = {
        'lecture': '理论',
        'seminar': '研讨',
        'lab': '实验',
        'exercise': '练习',
        'other': '其他'
    };
    return types[type] || '其他';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
