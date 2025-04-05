
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
    // 渲染周视图（课表）
    function renderWeekView() {
        const timetableBody = document.getElementById('timetableBody');
        timetableBody.innerHTML = '';
        
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
                
                // 查找该时间段和星期的课程
                const coursesInSlot = courses.filter(course => {
                    return course.weekDay === day && 
                           isTimeOverlap(course.startTime, course.endTime, slot.start, slot.end);
                });
                
                // 添加课程卡片
                coursesInSlot.forEach(course => {
                    const courseCard = document.createElement('div');
                    courseCard.className = 'course-card';
                    courseCard.style.backgroundColor = `${course.color}20`; // 20是透明度
                    courseCard.style.borderLeft = `4px solid ${course.color}`;
                    
                    courseCard.innerHTML = `
                        <div class="course-name">${course.name}</div>
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
    let currentDayIndex = 1; // 默认星期一
    
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
                
                courseCard.innerHTML = `
                    <div class="course-name">${course.name}</div>
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
