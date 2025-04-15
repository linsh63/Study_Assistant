import { showNotification } from './utils.js';

// 导出周视图为图片
async function exportWeekView() {
    try {
        // 创建加载遮罩
        const overlay = document.createElement('div');
        overlay.className = 'export-overlay';
        overlay.innerHTML = `
            <div class="export-progress">
                <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mb-3"></i>
                <p>正在生成图片，请稍候...</p>
            </div>
        `;
        document.body.appendChild(overlay);

        // 获取周视图元素
        const weekView = document.getElementById('week-view');
        const weekTable = document.getElementById('week-timeline');
        const scrollContainer = weekView.querySelector('.scroll-container');
        
        // 保存原始状态
        const originalHeight = scrollContainer.style.height;
        const originalOverflow = scrollContainer.style.overflow;
        const originalPosition = scrollContainer.style.position;
        
        // 临时修改样式以捕获完整内容
        weekView.classList.add('exporting');
        scrollContainer.style.height = 'auto';
        scrollContainer.style.overflow = 'visible';
        scrollContainer.style.position = 'relative';

        // 配置html2canvas选项
        const options = {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: weekTable.offsetWidth,
            windowHeight: weekTable.scrollHeight,
            width: weekTable.offsetWidth,
            height: weekTable.scrollHeight,
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.querySelector('.scroll-container');
                if (clonedContainer) {
                    clonedContainer.style.height = 'auto';
                    clonedContainer.style.overflow = 'visible';
                    clonedContainer.style.position = 'relative';
                }
            }
        };

        // 生成图片
        const canvas = await html2canvas(weekTable, options);
        
        // 恢复原始样式
        weekView.classList.remove('exporting');
        scrollContainer.style.height = originalHeight;
        scrollContainer.style.overflow = originalOverflow;
        scrollContainer.style.position = originalPosition;
        
        // 移除加载遮罩
        document.body.removeChild(overlay);

        // 创建下载链接
        const link = document.createElement('a');
        link.download = `周视图_${new Date().toLocaleDateString()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        showNotification('导出成功', 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showNotification('导出失败: ' + error.message, 'error');
        
        // 确保移除加载遮罩
        const overlay = document.querySelector('.export-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }
}

export { exportWeekView };