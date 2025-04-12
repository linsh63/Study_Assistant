// 字体大小切换功能
document.addEventListener('DOMContentLoaded', function() {
    const largeFontToggle = document.getElementById('largeFontToggle');
    const timetable = document.querySelector('.timetable');
    
    // 检查本地存储中的设置
    const isLargeFont = localStorage.getItem('largeFontMode') === 'true';
    largeFontToggle.checked = isLargeFont;
    
    // 初始应用样式
    applyLargeFontStyle(isLargeFont);
    
    // 切换事件
    largeFontToggle.addEventListener('change', function() {
        const isChecked = this.checked;
        localStorage.setItem('largeFontMode', isChecked);
        applyLargeFontStyle(isChecked);
    });
    
    // 监听课程渲染完成事件
    document.addEventListener('coursesRendered', function() {
        applyLargeFontStyle(largeFontToggle.checked);
    });
    
    // 应用大字体样式 - 不影响铺满模式
    function applyLargeFontStyle(apply) {
        if (apply) {
            timetable.classList.add('large-font-mode');
        } else {
            timetable.classList.remove('large-font-mode');
        }
    }
});