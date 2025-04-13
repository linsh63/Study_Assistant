

// 修改后的代码
// 移除重复声明的courses变量,因为之前已经声明过了
const API_URL = 'http://localhost:3000/api';

// 获取所有课程
// 获取所有课程
async function fetchCourses() {
    try {
        const response = await fetch(`${API_URL}/courses`, {
            credentials: 'include'  // 确保发送凭证
        });
        if (!response.ok) {
            throw new Error('获取课程失败');
        }
        courses = await response.json();
        renderCourseTable();
        updateStatistics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 修改 addCourse 函数
async function addCourse(courseData) {
    try {
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // 添加这行来确保发送凭证
            body: JSON.stringify(courseData)
        });
        
        if (!response.ok) {
            throw new Error('添加课程失败');
        }
        
        const newCourse = await response.json();
        courses.push(newCourse);
        renderCourseTable();
        updateStatistics();
        courseModal.style.display = 'none';  // 添加这行来关闭模态框
        showToast('课程添加成功', 'success');
    } catch (error) {
        showToast(error.message, 'error');
        console.error('添加课程错误:', error);  // 添加错误日志
    }
}

// 更新课程
async function updateCourse(id, courseData) {
    try {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        
        if (!response.ok) {
            throw new Error('更新课程失败');
        }
        
        const updatedCourse = await response.json();
        const index = courses.findIndex(c => c.id === id);
        if (index !== -1) {
            courses[index] = updatedCourse;
        }
        renderCourseTable();
        updateStatistics();
        showToast('课程更新成功', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 修改删除课程函数，添加批量删除模式参数
async function deleteCourseFromServer(id, batchMode = false) {
    try {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('删除课程失败');
        }
        
        courses = courses.filter(c => c.id !== id);
        
        // 只有在非批量模式下才更新UI和显示提示
        if (!batchMode) {
            renderCourseTable();
            updateStatistics();
            showToast('课程删除成功', 'success');
        }
        
        return true;
    } catch (error) {
        if (!batchMode) {
            showToast(error.message, 'error');
        }
        throw error;
    }
}
// 批量删除模态框事件监听
closeBatchDeleteModal.addEventListener('click', () => {
    batchDeleteConfirmModal.style.display = 'none';
});

cancelBatchDeleteBtn.addEventListener('click', () => {
    batchDeleteConfirmModal.style.display = 'none';
});

confirmBatchDeleteBtn.addEventListener('click', () => {
    batchDeleteConfirmModal.style.display = 'none';
    batchDeleteCourses();
});

// 视图切换时显示/隐藏批量操作区域
document.querySelectorAll('.view-option').forEach(option => {
    option.addEventListener('click', function() {
        const viewType = this.dataset.view;
        
        // 只在列表视图中显示批量操作区域
        if (viewType === 'list') {
            batchActionsDiv.style.display = 'block';
        } else {
            batchActionsDiv.style.display = 'none';
        }
    });
});

// 打开模态框
function openModal(course = null) {
    const modalTitle = document.getElementById('modalTitle');
    const courseForm = document.getElementById('courseForm');
    const courseId = document.getElementById('courseId');
    
    // 重置表单
    courseForm.reset();
    
    if (course) {
        // 编辑模式
        modalTitle.textContent = '编辑课程';
        courseId.value = course.id;
        document.getElementById('courseName').value = course.name;
        document.getElementById('courseCode').value = course.code || '';
        document.getElementById('teacherName').value = course.teacher;
        document.getElementById('weekDay').value = course.weekDay;
        document.getElementById('courseType').value = course.type;
        document.getElementById('startTime').value = course.startTime;
        document.getElementById('endTime').value = course.endTime;
        document.getElementById('location').value = course.location;
        document.getElementById('courseNote').value = course.note || '';
        
        // 设置颜色
        document.getElementById('courseColor').value = course.color;
        document.querySelectorAll('.color-option').forEach(option => {
            if (option.dataset.color === course.color) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    } else {
        // 添加模式
        modalTitle.textContent = '添加课程';
        courseId.value = '';
    }
    
    courseModal.style.display = 'flex';
}

// 检查时间冲突的辅助函数
function checkTimeConflict(weekDay, startTime, endTime, excludeCourseId = null) {
    // 转换为分钟以便比较
    const newStartMinutes = timeToMinutes(startTime);
    const newEndMinutes = timeToMinutes(endTime);
    
    // 检查是否与现有课程冲突
    return courses.some(course => {
        // 如果是编辑模式，排除当前编辑的课程
        if (excludeCourseId && course.id === excludeCourseId) {
            return false;
        }
        
        // 只检查同一天的课程
        if (course.weekDay !== weekDay) {
            return false;
        }
        
        const courseStartMinutes = timeToMinutes(course.startTime);
        const courseEndMinutes = timeToMinutes(course.endTime);
        
        // 检查时间是否重叠
        return (newStartMinutes < courseEndMinutes && newEndMinutes > courseStartMinutes);
    });
}
// 验证表单
function validateForm() {
    const courseName = document.getElementById('courseName').value;
    const weekDay = parseInt(document.getElementById('weekDay').value);
    const courseType = document.getElementById('courseType').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const courseId = document.getElementById('courseId').value ? parseInt(document.getElementById('courseId').value) : null;
    
    if (!courseName) {
        showToast('请填写课程名称', 'error');
        return false;
    }
    
    if (!weekDay) {
        showToast('请选择星期', 'error');
        return false;
    }
    
    if (!courseType) {
        showToast('请选择课程类型', 'error');
        return false;
    }
    
    if (!startTime) {
        showToast('请选择开始时间', 'error');
        return false;
    }
    
    if (!endTime) {
        showToast('请选择结束时间', 'error');
        return false;
    }
    
    // 验证时间格式和逻辑
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
        showToast('结束时间必须晚于开始时间', 'error');
        return false;
    }
    
    // 检查时间冲突
    if (checkTimeConflict(weekDay, startTime, endTime, courseId)) {
        showToast('该时间段已有其他课程，请选择其他时间', 'error');
        return false;
    }
    
    return true;
}

// 修改保存课程函数
async function saveCourse() {
    if (!validateForm()) return;
    
    const courseId = document.getElementById('courseId').value;
    const courseData = {
        name: document.getElementById('courseName').value,
        code: document.getElementById('courseCode').value,
        teacher: document.getElementById('teacherName').value || '未指定',
        weekDay: parseInt(document.getElementById('weekDay').value),
        type: document.getElementById('courseType').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        location: document.getElementById('location').value || '未指定',
        color: document.getElementById('courseColor').value,
        note: document.getElementById('courseNote').value
    };
    
    try {
        if (courseId) {
            // 更新现有课程
            await updateCourse(parseInt(courseId), courseData);
        } else {
            // 添加新课程
            const newCourse = await addCourseSilently(courseData);
            courses.push(newCourse);
        }
        
        // 更新所有视图
        renderCourseTable();
        renderWeekView();
        updateStatistics();
        
        // 关闭模态框并显示成功提示
        courseModal.style.display = 'none';
        showToast('课程保存成功', 'success');
        
        // 触发课程渲染完成事件
        document.dispatchEvent(new Event('coursesRendered'));
    } catch (error) {
        console.error('保存课程失败:', error);
        showToast('保存课程失败', 'error');
    }
}

// 修改 addCourseSilently 函数
async function addCourseSilently(courseData) {
    try {
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // 添加凭证
            body: JSON.stringify(courseData)
        });
        
        if (!response.ok) {
            throw new Error('添加课程失败');
        }
        
        const newCourse = await response.json();
        return newCourse;
    } catch (error) {
        console.error('添加课程错误:', error);
        throw error;
    }
}

// 编辑课程
function editCourse(id) {
    const course = courses.find(c => c.id === id);
    if (course) {
        openModal(course);
    }
}

// 删除课程
function deleteCourse(id) {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmModal.style.display = 'flex';
    
    // 移除之前的事件监听器
    confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
    
    // 添加新的事件监听器
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        deleteCourseFromServer(id);
        confirmModal.style.display = 'none';
    });
}

// 更新统计数据
function updateStatistics() {
    // 计算总课程数
    document.getElementById('totalCourses').textContent = courses.length;
    
    // 计算本周课时
    const weeklyHours = courses.reduce((total, course) => {
        const startHour = parseInt(course.startTime.split(':')[0]);
        const startMinute = parseInt(course.startTime.split(':')[1]);
        const endHour = parseInt(course.endTime.split(':')[0]);
        const endMinute = parseInt(course.endTime.split(':')[1]);
        
        const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
        return total + duration;
    }, 0);
    
    document.getElementById('weeklyHours').textContent = weeklyHours.toFixed(1);
    
    // 计算教师人数（去重）
    const teachers = new Set(courses.map(course => course.teacher));
    document.getElementById('teachersCount').textContent = teachers.size;
}

// 颜色选择器事件
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('courseColor').value = option.dataset.color;
    });
});

// 批量导入的颜色选择器事件
document.querySelectorAll('#batchImportModal .color-picker .color-option').forEach(option => {
    option.addEventListener('click', () => {
    document.querySelectorAll('#batchImportModal .color-picker .color-option').forEach(opt => 
        opt.classList.remove('selected'));
    option.classList.add('selected');
    document.getElementById('batchCourseColor').value = option.dataset.color;
});
});

// 关闭确认模态框
document.getElementById('closeConfirmModal').addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

// 搜索功能
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCourses = courses.filter(course => 
        course.name.toLowerCase().includes(searchTerm) || 
        course.teacher.toLowerCase().includes(searchTerm) ||
        course.location.toLowerCase().includes(searchTerm) ||
        (course.code && course.code.toLowerCase().includes(searchTerm))
    );
    
    renderFilteredCourses(filteredCourses);
});

// 渲染筛选后的课程
function renderFilteredCourses(filteredCourses) {
    // 保存当前筛选结果到临时变量
    const tempCourses = courses;
    
    // 临时替换课程数据
    courses = filteredCourses;
    
    // 更新当前视图
    const activeView = document.querySelector('.view-option.active').dataset.view;
    
    // 更新列表视图
    renderCourseTable();
    
    // 根据当前活动视图更新其他视图
    if (activeView === 'week') {
        renderWeekView();
    } else if (activeView === 'day') {
        renderDayView(currentDayIndex);
    }
    
    // 恢复原始课程数据
    courses = tempCourses;
}

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

// 星期筛选
document.querySelectorAll('#monday, #tuesday, #wednesday, #thursday, #friday, #saturday, #sunday').forEach((checkbox, index) => {
    checkbox.addEventListener('change', () => {
        applyFilters();
    });
});

// 课程类型筛选
document.querySelectorAll('#lecture, #seminar, #lab, #exercise').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        applyFilters();
    });
});

// 应用筛选
function applyFilters() {
    const weekDayFilters = [
        document.getElementById('monday').checked,
        document.getElementById('tuesday').checked,
        document.getElementById('wednesday').checked,
        document.getElementById('thursday').checked,
        document.getElementById('friday').checked,
        document.getElementById('saturday').checked,
        document.getElementById('sunday').checked
    ];
    
    const typeFilters = {
        lecture: document.getElementById('lecture').checked,
        seminar: document.getElementById('seminar').checked,
        lab: document.getElementById('lab').checked,
        exercise: document.getElementById('exercise').checked
    };
    
    const filteredCourses = courses.filter(course => {
        // 星期筛选
        if (!weekDayFilters[course.weekDay - 1]) return false;
        
        // 类型筛选
        if (!typeFilters[course.type]) return false;
        
        return true;
    });
    
    renderFilteredCourses(filteredCourses);
}

// 视图切换
document.querySelectorAll('.view-option').forEach((option, index) => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.view-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        // 这里可以实现不同视图的切换逻辑
    });
});

        // ... 保留原有代码 ...
