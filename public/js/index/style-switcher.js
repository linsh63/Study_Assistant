// 样式切换功能
document.addEventListener('DOMContentLoaded', function() {
    const fullCellToggle = document.getElementById('fullCellToggle');
    if (!fullCellToggle) return;
    
    const timetable = document.querySelector('.timetable');
    
    // 检查本地存储中的设置
    const isFullCell = localStorage.getItem('fullCellMode') === 'true';
    fullCellToggle.checked = isFullCell;
    
    // 初始应用样式
    applyFullCellStyle(isFullCell);
    
    // 切换事件
    fullCellToggle.addEventListener('change', function() {
        const isChecked = this.checked;
        localStorage.setItem('fullCellMode', isChecked);
        applyFullCellStyle(isChecked);
    });
    
    // 应用铺满单元格样式 - 不影响字体大小
    function applyFullCellStyle(apply) {
        if (apply) {
            timetable.classList.add('full-cell-mode');
        } else {
            timetable.classList.remove('full-cell-mode');
        }
    }
});