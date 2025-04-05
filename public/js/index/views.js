

// ... 保留原有代码 ...

// 修改导出功能
document.getElementById('exportBtn').addEventListener('click', () => {
// 显示导出模态框
document.getElementById('exportModal').style.display = 'flex';
document.getElementById('exportFileName').focus();
});

// 关闭导出模态框
document.getElementById('closeExportModal').addEventListener('click', () => {
document.getElementById('exportModal').style.display = 'none';
});

document.getElementById('cancelExportBtn').addEventListener('click', () => {
document.getElementById('exportModal').style.display = 'none';
});

// 确认导出
document.getElementById('confirmExportBtn').addEventListener('click', () => {
const fileName = document.getElementById('exportFileName').value.trim() || '我的课表';
document.getElementById('exportModal').style.display = 'none';

// 显示周视图以确保课表被渲染
document.querySelectorAll('.view-option').forEach(opt => opt.classList.remove('active'));
document.querySelector('[data-view="week"]').classList.add('active');

document.getElementById('listView').style.display = 'none';
document.getElementById('weekView').style.display = 'block';
document.getElementById('dayView').style.display = 'none';

// 确保课表已完全渲染
renderWeekView();

// 等待DOM更新
setTimeout(() => {
// 获取课表元素
const timetableElement = document.querySelector('.timetable-container');

// 使用html2canvas将课表转换为图片
html2canvas(timetableElement, {
    scale: 2, // 提高图片质量
    backgroundColor: '#ffffff',
    logging: false
}).then(canvas => {
    // 将canvas转换为图片URL
    const imgData = canvas.toDataURL('image/png');
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `${fileName}.png`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('课表已导出为图片', 'success');
}).catch(error => {
    console.error('导出图片失败:', error);
    showToast('导出图片失败', 'error');
});
}, 500); // 给DOM渲染一些时间
});

// ... 保留其他代码 ...