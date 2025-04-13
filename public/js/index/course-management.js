
// ... 保留原有代码 ...

    // 视图切换
    document.querySelectorAll('.view-option').forEach((option) => {
        option.addEventListener('click', () => {
            const viewType = option.dataset.view;
            
            // 更新活动状态
            document.querySelectorAll('.view-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // 隐藏所有视图
            document.getElementById('listView').style.display = 'none';
            document.getElementById('weekView').style.display = 'none';
            document.getElementById('dayView').style.display = 'none';
            
            // 显示选中的视图
            if (viewType === 'list') {
                document.getElementById('listView').style.display = 'block';
            } else if (viewType === 'week') {
                document.getElementById('weekView').style.display = 'block';
                renderWeekView();
            } else if (viewType === 'day') {
                document.getElementById('dayView').style.display = 'block';
                renderDayView(currentDayIndex);
            }
        });
    });
    
    // 时间段定义
    const timeSlots = [
        { start: "08:00", end: "08:45" },
        { start: "08:55", end: "09:40" },
        { start: "10:10", end: "10:55" },
        { start: "11:05", end: "11:50" },
        { start: "14:20", end: "15:05" },
        { start: "15:15", end: "16:00" },
        { start: "16:30", end: "17:15" },
        { start: "17:25", end: "18:10" },
        { start: "19:00", end: "19:45" },
        { start: "19:55", end: "20:40" },
        { start: "20:50", end: "21:35" }
    ];
    
    // 渲染周视图（课表）
    function renderWeekView() {
        const timetableBody = document.getElementById('timetableBody');
        timetableBody.innerHTML = '';
        
        // 获取今天是星期几
        const today = new Date().getDay() || 7; // 周日返回0，转换为7
        
        // 高亮今天的列头
        const headers = document.querySelectorAll('.timetable th');
        headers.forEach((header, index) => {
            // index从0开始，第0列是时间列，所以实际星期几要减1
            if (index === today) {
                header.classList.add('today');
            } else {
                header.classList.remove('today');
            }
        });
        
        // 创建时间段行
        timeSlots.forEach((slot, index) => {
            const row = document.createElement('tr');
            
            // 时间列
            const timeCell = document.createElement('td');
            timeCell.className = 'time-column';
            timeCell.textContent = `${slot.start}-${slot.end}`;
            row.appendChild(timeCell);
            
            // 每天的单元格
            for (let day = 1; day <= 7; day++) {
                const cell = document.createElement('td');
                // 如果是今天，添加today类
                if (day === today) {
                    cell.classList.add('today');
                }
                
                // 查找该时间段和星期的课程
                const coursesInSlot = courses.filter(course => {
                    return course.weekDay === day && 
                           isTimeOverlap(course.startTime, course.endTime, slot.start, slot.end);
                });
                
                // 添加课程卡片
                coursesInSlot.forEach(course => {
                    const courseCard = document.createElement('div');
                    courseCard.className = 'course-card';
                    courseCard.style.backgroundColor = `${course.color}20`;
                    courseCard.style.borderLeft = `4px solid ${course.color}`;
                    
                    // 只在有教师信息且不为"未指定"时显示教师字段
                    const teacherInfo = course.teacher && course.teacher !== "未指定" 
                        ? `<div class="course-info">${course.teacher}</div>` 
                        : '';
                    
                    courseCard.innerHTML = `
                        <div class="course-name">${course.name}</div>
                        ${teacherInfo}
                        <div class="course-location">${course.location}</div>
                        <div class="course-actions">
                            <div class="course-action" onclick="event.stopPropagation(); editCourse(${course.id})">
                                <i class="fas fa-edit"></i>
                            </div>
                            <div class="course-action" onclick="event.stopPropagation(); deleteCourse(${course.id})">
                                <i class="fas fa-trash-alt"></i>
                            </div>
                        </div>
                    `;
                    
                    // 点击课程卡片显示详情
                    courseCard.addEventListener('click', () => {
                        showCourseDetails(course);
                    });
                    
                    cell.appendChild(courseCard);
                });
                
                row.appendChild(cell);
            }
            
            timetableBody.appendChild(row);
        });
    
        // 恢复保存的样式设置
        restoreStyleSettings();
        
        // 触发课程渲染完成事件
        document.dispatchEvent(new CustomEvent('coursesRendered'));
    }
    
    // 新增：恢复样式设置函数
    function restoreStyleSettings() {
        // 恢复周视图铺满单元格设置
        const isFullCell = localStorage.getItem('fullCellMode') === 'true';
        const fullCellToggle = document.getElementById('fullCellToggle');
        if (fullCellToggle) {
            fullCellToggle.checked = isFullCell;
            const timetable = document.querySelector('.timetable');
            if (isFullCell) {
                timetable.classList.add('full-cell-mode');
            } else {
                timetable.classList.remove('full-cell-mode');
            }
        }
        
        // 恢复周视图字体大小设置
        const isLargeFont = localStorage.getItem('largeFontMode') === 'true';
        const largeFontToggle = document.getElementById('largeFontToggle');
        if (largeFontToggle) {
            largeFontToggle.checked = isLargeFont;
            const timetable = document.querySelector('.timetable');
            if (isLargeFont) {
                timetable.classList.add('large-font-mode');
            } else {
                timetable.classList.remove('large-font-mode');
            }
        }
        
        // 恢复日视图铺满单元格设置
        const isDayFullCell = localStorage.getItem('dayFullCellMode') === 'true';
        const dayFullCellToggle = document.getElementById('dayFullCellToggle');
        if (dayFullCellToggle) {
            dayFullCellToggle.checked = isDayFullCell;
            const daySchedule = document.querySelector('.day-schedule');
            if (isDayFullCell) {
                daySchedule.classList.add('full-cell-mode');
            } else {
                daySchedule.classList.remove('full-cell-mode');
            }
        }
        
        // 恢复日视图字体大小设置
        const isDayLargeFont = localStorage.getItem('dayLargeFontMode') === 'true';
        const dayLargeFontToggle = document.getElementById('dayLargeFontToggle');
        if (dayLargeFontToggle) {
            dayLargeFontToggle.checked = isDayLargeFont;
            const daySchedule = document.querySelector('.day-schedule');
            if (isDayLargeFont) {
                daySchedule.classList.add('large-font-mode');
            } else {
                daySchedule.classList.remove('large-font-mode');
            }
        }
    }
    
    // 检查时间是否重叠
    function isTimeOverlap(courseStart, courseEnd, slotStart, slotEnd) {
        // 转换为分钟以便比较
        const courseStartMinutes = timeToMinutes(courseStart);
        const courseEndMinutes = timeToMinutes(courseEnd);
        const slotStartMinutes = timeToMinutes(slotStart);
        const slotEndMinutes = timeToMinutes(slotEnd);
        
        // 检查是否有重叠
        return (courseStartMinutes < slotEndMinutes && courseEndMinutes > slotStartMinutes);
    }
    
    // 将时间转换为分钟
    function timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    // 日视图相关
    let currentDayIndex = new Date().getDay() || 7; // 获取当前是星期几，周日返回0，转换为7
    
    // 渲染日视图
    function renderDayView(dayIndex) {
        const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
        document.getElementById('currentDay').textContent = `星期${dayNames[dayIndex - 1]}`;
        
        const dayScheduleContainer = document.getElementById('dayScheduleContainer');
        dayScheduleContainer.innerHTML = '';
        
        // 获取当天的课程
        const dayCourses = courses.filter(course => course.weekDay === dayIndex);
        
        // 按时间排序
        dayCourses.sort((a, b) => {
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });
        
        // 创建时间段
        timeSlots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = `${slot.start}-${slot.end}`;
            
            const slotContent = document.createElement('div');
            slotContent.className = 'slot-content';
            
            // 查找该时间段的课程
            const coursesInSlot = dayCourses.filter(course => {
                return isTimeOverlap(course.startTime, course.endTime, slot.start, slot.end);
            });
            
            // 添加课程卡片
            coursesInSlot.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                courseCard.style.backgroundColor = `${course.color}20`;
                courseCard.style.borderLeft = `4px solid ${course.color}`;
                
                // 只在有教师信息且不为"未指定"时显示教师字段
                const teacherInfo = course.teacher && course.teacher !== "未指定" 
                    ? `<div class="course-info">${course.teacher}</div>` 
                    : '';
                
                courseCard.innerHTML = `
                    <div class="course-name">${course.name}</div>
                    ${teacherInfo}
                    <div class="course-location">${course.location}</div>
                    <div class="course-actions">
                        <div class="course-action" onclick="event.stopPropagation(); editCourse(${course.id})">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="course-action" onclick="event.stopPropagation(); deleteCourse(${course.id})">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                    </div>
                `;
                
                slotContent.appendChild(courseCard);
            });
            
            timeSlot.appendChild(timeLabel);
            timeSlot.appendChild(slotContent);
            dayScheduleContainer.appendChild(timeSlot);
        });
    }
    
    // 日视图导航
    document.getElementById('prevDay').addEventListener('click', () => {
        currentDayIndex = currentDayIndex === 1 ? 7 : currentDayIndex - 1;
        renderDayView(currentDayIndex);
    });
    
    document.getElementById('nextDay').addEventListener('click', () => {
        currentDayIndex = currentDayIndex === 7 ? 1 : currentDayIndex + 1;
        renderDayView(currentDayIndex);
    });
    
    // 显示课程详情
    function showCourseDetails(course) {
        // 这里可以实现一个弹窗显示课程详情
        // 或者直接打开编辑模态框
        openModal(course);
    }
    
    // 初始化页面时设置默认视图
    function initializeViews() {
        // 默认显示周视图
        document.getElementById('listView').style.display = 'none';
        document.getElementById('weekView').style.display = 'block';
        document.getElementById('dayView').style.display = 'none';
        
        // 设置活动视图按钮
        document.querySelectorAll('.view-option').forEach(option => {
            if (option.dataset.view === 'week') {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        renderWeekView();
    }
    
    // 修改fetchCourses函数，在获取数据后初始化视图
    async function fetchCourses() {
        try {
            const response = await fetch(`${API_URL}/courses`);
            if (!response.ok) {
                throw new Error('获取课程失败');
            }
            courses = await response.json();
            renderCourseTable();
            updateStatistics();
            initializeViews(); // 初始化视图
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
    
    // 初始化页面
    fetchCourses();
    
    // 添加日视图样式切换事件监听
    document.addEventListener('DOMContentLoaded', function() {
        // 日视图铺满单元格切换
        const dayFullCellToggle = document.getElementById('dayFullCellToggle');
        if (dayFullCellToggle) {
            dayFullCellToggle.addEventListener('change', function() {
                const isChecked = this.checked;
                localStorage.setItem('dayFullCellMode', isChecked);
                const daySchedule = document.querySelector('.day-schedule');
                if (isChecked) {
                    daySchedule.classList.add('full-cell-mode');
                } else {
                    daySchedule.classList.remove('full-cell-mode');
                }
            });
        }
        
        // 日视图大字体切换
        const dayLargeFontToggle = document.getElementById('dayLargeFontToggle');
        if (dayLargeFontToggle) {
            dayLargeFontToggle.addEventListener('change', function() {
                const isChecked = this.checked;
                localStorage.setItem('dayLargeFontMode', isChecked);
                const daySchedule = document.querySelector('.day-schedule');
                if (isChecked) {
                    daySchedule.classList.add('large-font-mode');
                } else {
                    daySchedule.classList.remove('large-font-mode');
                }
            });
        }
    });
    
    // 添加课程渲染完成事件监听
    document.addEventListener('coursesRendered', () => {
        const activeView = document.querySelector('.view-option.active');
        if (activeView) {
            const viewType = activeView.dataset.view;
            if (viewType === 'week') {
                renderWeekView();
            } else if (viewType === 'day') {
                renderDayView();
            } else {
                renderCourseTable();
            }
        }
    });

    // 获取所有可用的颜色
    function getAllColors() {
        const colors = getComputedStyle(document.documentElement)
            .getPropertyValue('--course-colors')
            .split(',')
            .map(color => color.trim());
        return colors;
    }
    
    // 获取已使用的颜色
    function getUsedColors() {
        return courses.map(course => course.color);
    }
    
    // 获取随机未使用的颜色
    function getRandomUnusedColor() {
        const allColors = getAllColors();
        const usedColors = getUsedColors();
        const unusedColors = allColors.filter(color => !usedColors.includes(color));
        
        // 如果所有颜色都已使用，则返回随机颜色
        if (unusedColors.length === 0) {
            return allColors[Math.floor(Math.random() * allColors.length)];
        }
        
        // 返回随机未使用颜色
        return unusedColors[Math.floor(Math.random() * unusedColors.length)];
    }
    
    // 在添加新课程时调用
    function addCourse(courseData) {
        if (!courseData.color) {
            courseData.color = getRandomUnusedColor();
        }
        if (!courseData.color) {
            courseData.color = getRandomUnusedColor();
        }
        if (!courseData.color) {
            courseData.color = getRandomUnusedColor();
        }
}
