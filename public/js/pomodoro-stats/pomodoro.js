// API URL
const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// DOM元素
const workModeBtn = document.getElementById('work-mode');
const breakModeBtn = document.getElementById('break-mode');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const minuteTens = document.getElementById('minute-tens');
const minuteOnes = document.getElementById('minute-ones');
const secondTens = document.getElementById('second-tens');
const secondOnes = document.getElementById('second-ones');
const settingsBtn = document.getElementById('settings-btn');
const closeSettings = document.getElementById('close-settings');
const settingsPanel = document.getElementById('settings-panel');
const workTimeSelect = document.getElementById('work-time');
const breakTimeSelect = document.getElementById('break-time');
const customWorkContainer = document.getElementById('custom-work-container');
const customWorkTime = document.getElementById('custom-work-time');
const customBreakContainer = document.getElementById('custom-break-container');
const customBreakTime = document.getElementById('custom-break-time');
const saveSettingsBtn = document.getElementById('save-settings');
const uploadBgBtn = document.getElementById('upload-bg');
const removeBgBtn = document.getElementById('remove-bg');
const bgUploadInput = document.getElementById('bg-upload-input');
const staticBg = document.getElementById('static-bg');
const dynamicBg = document.getElementById('dynamic-bg');
const taskNameInput = document.getElementById('task-name'); // 添加任务名称输入框引用
const currentTaskDisplay = document.getElementById('current-task'); // 添加任务名称显示引用

// 动态背景按钮
const bgButtons = document.querySelectorAll('[data-bg]');

// 计时器变量
let timer;
let currentMode = 'work'; // 'work' or 'break'
let isRunning = false;
let totalSeconds = 30 * 60; // 默认30分钟工作时间
let remainingSeconds = totalSeconds;
let currentDisplay = {
    minuteTens: '2',
    minuteOnes: '5',
    secondTens: '0',
    secondOnes: '0'
};

// 默认设置
let settings = {
    workTime: 30,
    breakTime: 10,
    dynamicBg: 'aurora',
    displayMode: 'flip', // 添加显示模式设置，默认为翻页显示
    taskName: '专注工作中...' // 添加任务名称设置，默认值
};
// 添加任务记录相关变量
let currentTaskId = null;
let taskStartTime = null;


// 显示通知
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    // 设置图标
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#28a745';
        toast.style.borderLeft = '4px solid #28a745';
    } else {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#dc3545';
        toast.style.borderLeft = '4px solid #dc3545';
    }
    
    // 显示通知
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 3000);
}

        // 检查用户是否已登录
        async function checkLogin() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            // 未登录，重定向到登录页面
            window.location.href = 'login.html';
            return false;
        }
        
        const user = await response.json();
        currentUser = user;
        
        // 移除显示用户名的代码，只保留登录检查功能
        
        return true;
    } catch (error) {
        console.error('检查登录状态失败:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// 在文件末尾添加白噪音相关代码

// 白噪音音频对象和状态管理
let audioContext = null;
let noiseSource = null;
let gainNode = null;
let isPlaying = false;
let currentBuffer = null; // 保存当前音频buffer
let startTime = 0; // 记录开始时间
let pauseTime = 0; // 记录暂停时间

// 白噪音音频文件映射
const noiseFiles = {
    rain: 'public/audio/rain.mp3',
    waves: 'public/audio/waves.mp3',
    forest: 'public/audio/forest.mp3',
    cafe: 'public/audio/cafe.mp3',
    fire: 'public/audio/fire.mp3'
};

// 初始化音频上下文
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
    }
}

// 播放/暂停白噪音
async function toggleNoise() {
    const playBtn = document.getElementById('play-noise');
    
    if (!isPlaying) {
        try {
            initAudioContext();
            
            if (!currentBuffer) {
                // 首次加载音频
                const noiseType = document.getElementById('noise-type').value;
                const response = await fetch(noiseFiles[noiseType]);
                const arrayBuffer = await response.arrayBuffer();
                currentBuffer = await audioContext.decodeAudioData(arrayBuffer);
            }
            
            noiseSource = audioContext.createBufferSource();
            noiseSource.buffer = currentBuffer;
            noiseSource.loop = true;
            noiseSource.connect(gainNode);
            
            // 设置音量
            const volume = document.getElementById('volume-slider').value;
            gainNode.gain.value = volume / 100;
            
            // 如果是从暂停恢复，计算偏移量
            if (pauseTime > 0) {
                const offset = (pauseTime - startTime) % currentBuffer.duration;
                noiseSource.start(0, offset);
            } else {
                noiseSource.start(0);
            }
            
            startTime = audioContext.currentTime - (pauseTime > 0 ? pauseTime : 0);
            pauseTime = 0;
            
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
            
        } catch (error) {
            console.error('音频加载或播放失败:', error);
            showToast('音频加载失败', 'error');
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        }
    } else {
        if (noiseSource) {
            pauseTime = audioContext.currentTime;
            noiseSource.stop();
            noiseSource.disconnect();
            noiseSource = null;
        }
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
    }
}

// 更新音量
function updateVolume() {
    const volume = document.getElementById('volume-slider').value;
    document.getElementById('volume-value').textContent = volume + '%';
    
    if (gainNode) {
        gainNode.gain.value = volume / 100;
    }
}

// 最小化播放器
function togglePlayerMinimize() {
    const widget = document.getElementById('white-noise-widget');
    const content = widget.querySelector('.player-content');
    const minButton = document.getElementById('minimize-player');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        minButton.innerHTML = '<i class="fas fa-minus"></i>';
        widget.classList.remove('minimized');
    } else {
        content.style.display = 'none';
        minButton.innerHTML = '<i class="fas fa-plus"></i>';
        widget.classList.add('minimized');
    }
}

// 初始化
async function init() {
    // 首先检查登录状态
    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) return;
    
    updateTimerDisplay();
    loadSettings();
    applyBackground();
    
    // 事件监听
    workModeBtn.addEventListener('click', () => switchMode('work'));
    breakModeBtn.addEventListener('click', () => switchMode('break'));
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    settingsBtn.addEventListener('click', openSettings);
    closeSettings.addEventListener('click', closeSettingsPanel);
    saveSettingsBtn.addEventListener('click', saveSettings);
    uploadBgBtn.addEventListener('click', () => bgUploadInput.click());
    removeBgBtn.addEventListener('click', removeBackground);
    bgUploadInput.addEventListener('change', handleBgUpload);
    // 添加白噪音控件事件监听
    document.getElementById('play-noise').addEventListener('click', toggleNoise);
    document.getElementById('volume-slider').addEventListener('input', updateVolume);
    document.getElementById('minimize-player').addEventListener('click', togglePlayerMinimize);
    document.getElementById('noise-type').addEventListener('change', async () => {
        // 保存当前音量
        const currentVolume = gainNode ? gainNode.gain.value : 0.5;
        
        // 如果当前正在播放，先停止当前音频
        if (isPlaying) {
            if (noiseSource) {
                noiseSource.stop();
                noiseSource.disconnect();
                noiseSource = null;
            }
        }
        
        // 重置音频状态
        currentBuffer = null;
        startTime = 0;
        pauseTime = 0;
        
        // 如果之前在播放状态，立即更新按钮状态并开始加载新音频
        if (currentVolume > 0) {
            // 立即将按钮更新为暂停状态
            document.getElementById('play-noise').innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
            
            // 异步加载和播放新音频
            try {
                await toggleNoise();
                // 恢复之前的音量
                if (gainNode) {
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(currentVolume, audioContext.currentTime + 0.5);
                }
            } catch (error) {
                // 如果加载失败，恢复播放按钮状态
                document.getElementById('play-noise').innerHTML = '<i class="fas fa-play"></i>';
                isPlaying = false;
                console.error('切换音频失败:', error);
            }
        }
    });

// ... 现有代码 ...

   // 添加显示模式按钮事件
   document.getElementById('flip-display').addEventListener('click', () => {
        document.getElementById('flip-display').classList.add('bg-indigo-600');
        document.getElementById('flip-display').classList.remove('bg-gray-700');
        document.getElementById('normal-display').classList.remove('bg-indigo-600');
        document.getElementById('normal-display').classList.add('bg-gray-700');
        document.getElementById('digital-display').classList.remove('bg-indigo-600');
        document.getElementById('digital-display').classList.add('bg-gray-700');
        settings.displayMode = 'flip';
        updateTimerDisplay(); // 立即更新显示
    });
    
    document.getElementById('normal-display').addEventListener('click', () => {
        document.getElementById('normal-display').classList.add('bg-indigo-600');
        document.getElementById('normal-display').classList.remove('bg-gray-700');
        document.getElementById('flip-display').classList.remove('bg-indigo-600');
        document.getElementById('flip-display').classList.add('bg-gray-700');
        document.getElementById('digital-display').classList.remove('bg-indigo-600');
        document.getElementById('digital-display').classList.add('bg-gray-700');
        settings.displayMode = 'normal';
        updateTimerDisplay(); // 立即更新显示
    });

    document.getElementById('digital-display').addEventListener('click', () => {
        document.getElementById('digital-display').classList.add('bg-indigo-600');
        document.getElementById('digital-display').classList.remove('bg-gray-700');
        document.getElementById('flip-display').classList.remove('bg-indigo-600');
        document.getElementById('flip-display').classList.add('bg-gray-700');
        document.getElementById('normal-display').classList.remove('bg-indigo-600');
        document.getElementById('normal-display').classList.add('bg-gray-700');
        settings.displayMode = 'digital';
        updateTimerDisplay(); // 立即更新显示
    });
    
    workTimeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customWorkContainer.classList.remove('hidden');
        } else {
            customWorkContainer.classList.add('hidden');
        }
    });
    
    breakTimeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customBreakContainer.classList.remove('hidden');
        } else {
            customBreakContainer.classList.add('hidden');
        }
    });
    
    bgButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const bgType = this.getAttribute('data-bg');
            setDynamicBackground(bgType);
            saveSettings();
        });
    });
}

// 设置动态背景
function setDynamicBackground(bgType) {
    dynamicBg.className = 'dynamic-bg';
    if (bgType !== 'none') {
        dynamicBg.classList.add(bgType + '-bg', 'active');
        settings.dynamicBg = bgType;
        
        // 如果启用动态背景，则禁用静态背景
        staticBg.style.opacity = '0';
    } else {
        settings.dynamicBg = 'none';
        
        // 如果禁用动态背景，则启用静态背景
        staticBg.style.opacity = '0.7';
    }
    
    // 更新背景按钮的激活状态
    bgButtons.forEach(btn => {
        if (btn.getAttribute('data-bg') === bgType) {
            btn.classList.add('bg-indigo-600');
            btn.classList.remove('bg-gray-700');
        } else {
            btn.classList.remove('bg-indigo-600');
            btn.classList.add('bg-gray-700');
        }
    });
    
    // 不需要单独控制元素的显示/隐藏，让CSS类处理
    console.log("设置背景为:", bgType);
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    const minTens = Math.floor(minutes / 10);
    const minOnes = minutes % 10;
    const secTens = Math.floor(seconds / 10);
    const secOnes = seconds % 10;
    
    // 根据显示模式选择不同的显示方法
    if (settings.displayMode === 'digital') {
        // 数字时钟显示模式
        // 首先检查是否需要创建数字时钟元素
        let digitalClock = document.querySelector('.digital-clock');
        if (!digitalClock) {
            // 创建数字时钟元素
            const timerDisplay = document.getElementById('timer-display');
            timerDisplay.innerHTML = ''; // 清空现有内容
            
            digitalClock = document.createElement('div');
            digitalClock.className = 'digital-clock';
            
            // 分钟十位
            const minTensUnit = document.createElement('div');
            minTensUnit.className = 'digital-unit';
            minTensUnit.innerHTML = `<div class="digital-number" id="digital-min-tens">${minTens}</div>`;
            
            // 分钟个位
            const minOnesUnit = document.createElement('div');
            minOnesUnit.className = 'digital-unit';
            minOnesUnit.innerHTML = `<div class="digital-number" id="digital-min-ones">${minOnes}</div>`;
            
            // 冒号
            const colonDiv = document.createElement('div');
            colonDiv.className = 'digital-colon';
            colonDiv.textContent = ':';
            
            // 秒钟十位
            const secTensUnit = document.createElement('div');
            secTensUnit.className = 'digital-unit';
            secTensUnit.innerHTML = `<div class="digital-number" id="digital-sec-tens">${secTens}</div>`;
            
            // 秒钟个位
            const secOnesUnit = document.createElement('div');
            secOnesUnit.className = 'digital-unit';
            secOnesUnit.innerHTML = `<div class="digital-number" id="digital-sec-ones">${secOnes}</div>`;
            
            // 添加到数字时钟容器
            digitalClock.appendChild(minTensUnit);
            digitalClock.appendChild(minOnesUnit);
            digitalClock.appendChild(colonDiv);
            digitalClock.appendChild(secTensUnit);
            digitalClock.appendChild(secOnesUnit);
            
            // 添加到计时器显示区域
            timerDisplay.appendChild(digitalClock);
        } else {
            // 更新现有数字时钟
            document.getElementById('digital-min-tens').textContent = minTens;
            document.getElementById('digital-min-ones').textContent = minOnes;
            document.getElementById('digital-sec-tens').textContent = secTens;
            document.getElementById('digital-sec-ones').textContent = secOnes;
        }
    } else if (settings.displayMode === 'flip') {
        // 翻页显示模式
        // 首先检查是否需要创建翻页时钟元素
        let flipClock = document.querySelector('.flip-clock');
        if (!flipClock) {
            // 创建翻页时钟元素
            const timerDisplay = document.getElementById('timer-display');
            timerDisplay.innerHTML = ''; // 清空现有内容
            
            // 使用原始的翻页时钟HTML结构
            timerDisplay.innerHTML = `
                <div class="flip-clock">
                    <div class="flip-card" id="minute-tens">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${minTens}</div>
                            <div class="flip-card-face bottom">${minTens}</div>
                            <div class="flip-card-face next">${minTens}</div>
                        </div>
                    </div>
                    <div class="flip-card" id="minute-ones">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${minOnes}</div>
                            <div class="flip-card-face bottom">${minOnes}</div>
                            <div class="flip-card-face next">${minOnes}</div>
                        </div>
                    </div>
                    <div class="colon">:</div>
                    <div class="flip-card" id="second-tens">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${secTens}</div>
                            <div class="flip-card-face bottom">${secTens}</div>
                            <div class="flip-card-face next">${secTens}</div>
                        </div>
                    </div>
                    <div class="flip-card" id="second-ones">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${secOnes}</div>
                            <div class="flip-card-face bottom">${secOnes}</div>
                            <div class="flip-card-face next">${secOnes}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // 重新获取元素引用
            minuteTens = document.getElementById('minute-tens');
            minuteOnes = document.getElementById('minute-ones');
            secondTens = document.getElementById('second-tens');
            secondOnes = document.getElementById('second-ones');
        }
        
        // 更新分钟十位数
        if (currentDisplay.minuteTens !== minTens.toString()) {
            flipCard(minuteTens, minTens);
            currentDisplay.minuteTens = minTens.toString();
        }
        
        // 更新分钟个位数
        if (currentDisplay.minuteOnes !== minOnes.toString()) {
            flipCard(minuteOnes, minOnes);
            currentDisplay.minuteOnes = minOnes.toString();
        }
        
        // 更新秒钟十位数
        if (currentDisplay.secondTens !== secTens.toString()) {
            flipCard(secondTens, secTens);
            currentDisplay.secondTens = secTens.toString();
        }
        
        // 更新秒钟个位数
        if (currentDisplay.secondOnes !== secOnes.toString()) {
            flipCard(secondOnes, secOnes);
            currentDisplay.secondOnes = secOnes.toString();
        }
    } else {
        // 普通显示模式
        // 首先检查是否需要创建普通时钟元素
        let normalClock = document.querySelector('.flip-clock:not(.digital-clock)');
        if (!normalClock) {
            // 创建普通时钟元素（复用翻页时钟的HTML结构）
            const timerDisplay = document.getElementById('timer-display');
            timerDisplay.innerHTML = ''; // 清空现有内容
            
            // 使用原始的翻页时钟HTML结构
            timerDisplay.innerHTML = `
                <div class="flip-clock">
                    <div class="flip-card" id="minute-tens">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${minTens}</div>
                            <div class="flip-card-face bottom">${minTens}</div>
                            <div class="flip-card-face next">${minTens}</div>
                        </div>
                    </div>
                    <div class="flip-card" id="minute-ones">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${minOnes}</div>
                            <div class="flip-card-face bottom">${minOnes}</div>
                            <div class="flip-card-face next">${minOnes}</div>
                        </div>
                    </div>
                    <div class="colon">:</div>
                    <div class="flip-card" id="second-tens">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${secTens}</div>
                            <div class="flip-card-face bottom">${secTens}</div>
                            <div class="flip-card-face next">${secTens}</div>
                        </div>
                    </div>
                    <div class="flip-card" id="second-ones">
                        <div class="flip-card-wrapper">
                            <div class="flip-card-face top">${secOnes}</div>
                            <div class="flip-card-face bottom">${secOnes}</div>
                            <div class="flip-card-face next">${secOnes}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // 重新获取元素引用
            minuteTens = document.getElementById('minute-tens');
            minuteOnes = document.getElementById('minute-ones');
            secondTens = document.getElementById('second-tens');
            secondOnes = document.getElementById('second-ones');
        }
        
        // 普通显示模式，直接更新数字
        const cards = [
            { element: minuteTens, value: minTens },
            { element: minuteOnes, value: minOnes },
            { element: secondTens, value: secTens },
            { element: secondOnes, value: secOnes }
        ];
        
        cards.forEach(card => {
            const wrapper = card.element.querySelector('.flip-card-wrapper');
            const topFace = wrapper.querySelector('.top');
            const bottomFace = wrapper.querySelector('.bottom');
            const nextFace = wrapper.querySelector('.next');
            
            topFace.textContent = card.value;
            bottomFace.textContent = card.value;
            nextFace.textContent = card.value;
        });
        
        // 更新当前显示状态
        currentDisplay = {
            minuteTens: minTens.toString(),
            minuteOnes: minOnes.toString(),
            secondTens: secTens.toString(),
            secondOnes: secOnes.toString()
        };
    }
}

// 翻页动画
function flipCard(card, newValue) {
    const wrapper = card.querySelector('.flip-card-wrapper');
    const topFace = wrapper.querySelector('.top');
    const bottomFace = wrapper.querySelector('.bottom');
    const nextFace = wrapper.querySelector('.next');
    
    // 设置下一个数字
    nextFace.textContent = newValue;
    
    // 重置样式
    wrapper.style.position = 'relative';
    topFace.style.transition = 'none';
    nextFace.style.transition = 'none';
    
    // 初始状态设置
    topFace.style.position = 'absolute';
    topFace.style.top = '0';
    topFace.style.opacity = '1';
    topFace.style.transform = 'translateY(0)';
    
    nextFace.style.position = 'absolute';
    nextFace.style.top = '0';
    nextFace.style.opacity = '0';
    nextFace.style.transform = 'translateY(100%)';
    
    // 确保DOM更新
    setTimeout(() => {
        // 添加过渡效果
        topFace.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
        nextFace.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
        
        // 开始动画
        topFace.style.transform = 'translateY(-50%)';
        topFace.style.opacity = '0';
        
        nextFace.style.transform = 'translateY(0)';
        nextFace.style.opacity = '1';
        
        // 动画结束后更新状态
        setTimeout(() => {
            // 更新顶部和底部数字
            topFace.textContent = newValue.toString();
            bottomFace.textContent = newValue.toString();
            
            // 重置样式
            topFace.style.transition = 'none';
            nextFace.style.transition = 'none';
            topFace.style.transform = 'translateY(0)';
            topFace.style.opacity = '1';
            nextFace.style.transform = 'translateY(0)';
            nextFace.style.opacity = '0';
        }, 500);
    }, 20);
}

// 记录任务开始
async function recordTaskStart() {
    // 只在工作模式且用户已登录时记录任务
    if (!currentUser || currentMode !== 'work') return;
    
    try {
        const taskData = {
            taskId: currentTaskId,
            taskName: settings.taskName,
            startTime: new Date().toISOString(),
            plannedDuration: totalSeconds,
            status: 'in-progress',
            isBreakMode: false
        };
        
        console.log('记录任务开始:', taskData);
        
        // 保存到本地存储作为备份
        saveTaskToLocalStorage(taskData);
        
        // 发送到服务器
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            console.error('记录任务开始失败:', response.status, response.statusText);
        } else {
            console.log('任务开始记录已保存到服务器');
        }
    } catch (error) {
        console.error('记录任务开始出错:', error);
        // 出错时已经保存到本地存储，无需再次保存
    }
}

// 记录任务暂停
async function recordTaskPause() {
    if (!currentUser || !currentTaskId) return;
    
    try {
        const taskData = {
            pauseTime: new Date().toISOString(),
            elapsedSeconds: totalSeconds - remainingSeconds
        };
        
        console.log('记录任务暂停:', taskData);
        
        // 发送到服务器
        const response = await fetch(`${API_URL}/tasks/${currentTaskId}/pause`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            console.error('记录任务暂停失败:', response.status, response.statusText);
            
            // 保存到本地存储作为备份
            const existingTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
            const taskIndex = existingTasks.findIndex(task => task.taskId === currentTaskId);
            
            if (taskIndex !== -1) {
                existingTasks[taskIndex].status = 'paused';
                existingTasks[taskIndex].pauseTime = new Date().toISOString();
                existingTasks[taskIndex].elapsedSeconds = totalSeconds - remainingSeconds;
                localStorage.setItem('pomodoroTasks', JSON.stringify(existingTasks));
            }
        } else {
            console.log('任务暂停记录已保存到服务器');
        }
    } catch (error) {
        console.error('记录任务暂停出错:', error);
        
        // 出错时保存到本地存储
        const existingTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
        const taskIndex = existingTasks.findIndex(task => task.taskId === currentTaskId);
        
        if (taskIndex !== -1) {
            existingTasks[taskIndex].status = 'paused';
            existingTasks[taskIndex].pauseTime = new Date().toISOString();
            existingTasks[taskIndex].elapsedSeconds = totalSeconds - remainingSeconds;
            localStorage.setItem('pomodoroTasks', JSON.stringify(existingTasks));
        }
    }
}

// 记录任务完成
async function recordTaskComplete() {
    if (!currentUser || !currentTaskId) return;
    
    try {
        const endTime = new Date();
        // 使用计划时间作为实际持续时间
        const actualDuration = totalSeconds; 
        
        const taskData = {
            endTime: endTime.toISOString(),
            actualDuration: actualDuration,
            status: 'completed', // 确保状态为已完成
            remainingSeconds: 0 // 确保剩余时间为0
        };
        
        console.log('记录任务完成:', taskData);
        
        // 保存到本地存储作为备份
        const existingTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
        const taskIndex = existingTasks.findIndex(task => task.taskId === currentTaskId);
        
        if (taskIndex !== -1) {
            existingTasks[taskIndex] = {
                ...existingTasks[taskIndex],
                endTime: endTime.toISOString(),
                actualDuration: actualDuration,
                status: 'completed',
                remainingSeconds: 0
            };
            localStorage.setItem('pomodoroTasks', JSON.stringify(existingTasks));
        } else {
            // 如果在本地存储中找不到任务，创建一个新的完整记录
            saveTaskToLocalStorage({
                taskId: currentTaskId,
                taskName: currentMode === 'work' ? settings.taskName : '休息一下...',
                startTime: taskStartTime.toISOString(),
                endTime: endTime.toISOString(),
                actualDuration: actualDuration,
                plannedDuration: totalSeconds,
                status: 'completed',
                isBreakMode: currentMode === 'break',
                remainingSeconds: 0
            });
        }
        
        // 发送到服务器
        const response = await fetch(`${API_URL}/tasks/${currentTaskId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            console.error('记录任务完成失败:', response.status, response.statusText);
        } else {
            console.log('任务完成记录已保存到服务器');
        }
    } catch (error) {
        console.error('记录任务完成出错:', error);
        // 出错时已经保存到本地存储，无需再次保存
    }
}

// 记录任务放弃
async function recordTaskAbandoned() {
    if (!currentUser || !currentTaskId || !taskStartTime) return;
    
    try {
        const elapsedSeconds = totalSeconds - remainingSeconds;
        
        const taskData = {
            endTime: new Date().toISOString(),
            actualDuration: elapsedSeconds, // 已经过的时间
            status: 'abandoned',
            remainingSeconds: remainingSeconds // 记录剩余时间
        };
        
        console.log('记录任务放弃:', taskData);
        
        // 保存到本地存储作为备份
        const existingTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
        const taskIndex = existingTasks.findIndex(task => task.taskId === currentTaskId);
        
        if (taskIndex !== -1) {
            existingTasks[taskIndex] = {
                ...existingTasks[taskIndex],
                endTime: taskData.endTime,
                actualDuration: taskData.actualDuration,
                status: 'abandoned',
                remainingSeconds: remainingSeconds
            };
            localStorage.setItem('pomodoroTasks', JSON.stringify(existingTasks));
        } else {
            // 如果在本地存储中找不到任务，创建一个新的完整记录
            saveTaskToLocalStorage({
                taskId: currentTaskId,
                taskName: currentMode === 'work' ? settings.taskName : '休息一下...',
                startTime: taskStartTime.toISOString(),
                endTime: taskData.endTime,
                actualDuration: elapsedSeconds,
                plannedDuration: totalSeconds,
                status: 'abandoned',
                isBreakMode: currentMode === 'break',
                remainingSeconds: remainingSeconds
            });
        }
        
        // 发送到服务器
        const response = await fetch(`${API_URL}/tasks/${currentTaskId}/abandon`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            console.error('记录任务放弃失败:', response.status, response.statusText);
        } else {
            console.log('任务放弃记录已保存到服务器');
        }
    } catch (error) {
        console.error('记录任务放弃出错:', error);
        // 出错时已经保存到本地存储，无需再次保存
    }
}

      // 添加本地存储功能
      function saveTaskToLocalStorage(task) {
    try {
        // 确保任务数据格式一致
        const standardizedTask = {
            taskId: task.taskId,
            taskName: task.taskName,
            startTime: task.startTime,
            endTime: task.endTime || new Date().toISOString(),
            actualDuration: task.actualDuration || 0,
            plannedDuration: task.plannedDuration || totalSeconds,
            status: task.status,
            isBreakMode: task.isBreakMode || false,
            remainingSeconds: task.remainingSeconds,
            elapsedSeconds: task.elapsedSeconds || (task.plannedDuration - task.remainingSeconds)
        };
        
        const existingTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
        
        // 检查是否已存在相同ID的任务
        const taskIndex = existingTasks.findIndex(t => t.taskId === task.taskId);
        if (taskIndex >= 0) {
            // 更新现有任务
            existingTasks[taskIndex] = standardizedTask;
        } else {
            // 添加新任务
            existingTasks.push(standardizedTask);
        }
        
        localStorage.setItem('pomodoroTasks', JSON.stringify(existingTasks));
        console.log('任务已保存到本地存储:', standardizedTask);
    } catch (e) {
        console.error('保存任务到本地存储失败:', e);
    }
}

         // 开始计时器
         function startTimer() {
            if (isRunning) return;
            
            // 只在工作模式开始时生成新任务
            if (remainingSeconds === totalSeconds && currentMode === 'work') {
                currentTaskId = Date.now().toString();
                taskStartTime = new Date();
                recordTaskStart();
            }
            
            isRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            timer = setInterval(() => {
                remainingSeconds--;
                
                if (remainingSeconds <= 0) {
                    clearInterval(timer);
                    isRunning = false;
                    
                    // 播放提示音
                    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                    audio.play();
                    
                    // 只在工作模式结束时记录完成
                    if (currentMode === 'work') {
                        recordTaskComplete();
                    }
                    
                    setTimeout(() => {
                        startBtn.disabled = false;
                        pauseBtn.disabled = true;
                        currentTaskId = null;
                        taskStartTime = null;
                        switchMode(currentMode === 'work' ? 'break' : 'work');
                    }, 500);
                }
                
                updateTimerDisplay();
            }, 1000);
        }

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // 只在工作模式时记录暂停
    if (currentMode === 'work') {
        recordTaskPause();
    }
}

// 重置计时器
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    
    // 只在工作模式且任务已开始时记录放弃
    if (currentMode === 'work' && currentTaskId && remainingSeconds < totalSeconds) {
        recordTaskAbandoned();
    }
    
    remainingSeconds = totalSeconds;
    updateTimerDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    currentTaskId = null;
    taskStartTime = null;
}

// 计时完成
function timerComplete() {
    alert(`${currentMode === 'work' ? '工作' : '休息'}时间到！`);
    
    // 记录任务完成
    if (currentMode === 'work') {
        recordTaskComplete();
    }
    
    // 重置任务ID和开始时间
    currentTaskId = null;
    taskStartTime = null;
    
    switchMode(currentMode === 'work' ? 'break' : 'work');
    startTimer();
}

// 切换模式
function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'work') {
        workModeBtn.classList.add('bg-indigo-600', 'text-white');
        workModeBtn.classList.remove('text-gray-300');
        breakModeBtn.classList.remove('bg-indigo-600', 'text-white');
        breakModeBtn.classList.add('text-gray-300');
        totalSeconds = settings.workTime * 60;
        
        // 在工作模式下显示任务名称
        currentTaskDisplay.textContent = settings.taskName;
    } else {
        breakModeBtn.classList.add('bg-indigo-600', 'text-white');
        breakModeBtn.classList.remove('text-gray-300');
        workModeBtn.classList.remove('bg-indigo-600', 'text-white');
        workModeBtn.classList.add('text-gray-300');
        totalSeconds = settings.breakTime * 60;
        
        // 在休息模式下显示固定文本
        currentTaskDisplay.textContent = "休息一下...";
    }
    
    // 调整动态背景色调
    if (mode === 'work') {
        dynamicBg.style.filter = 'hue-rotate(0deg)'; // 冷色调
    } else {
        dynamicBg.style.filter = 'hue-rotate(90deg)'; // 暖色调
    }
    
    resetTimer();
    
    // 确保模式切换后立即更新显示
    console.log('当前模式:', currentMode, '显示文本:', currentTaskDisplay.textContent);
}

// 打开设置面板
function openSettings() {
    settingsPanel.classList.add('open');
    // 加载当前设置到表单
    workTimeSelect.value = settings.workTime !== 25 && settings.workTime !== 30 && 
                           settings.workTime !== 40 && settings.workTime !== 60 ? 'custom' : settings.workTime;
    breakTimeSelect.value = settings.breakTime !== 5 && settings.breakTime !== 10 && 
                            settings.breakTime !== 15 && settings.breakTime !== 20 ? 'custom' : settings.breakTime;
    
    // 设置任务名称输入框的值
    taskNameInput.value = settings.taskName !== '专注工作中...' ? settings.taskName : '';

    if (workTimeSelect.value === 'custom') {
        customWorkContainer.classList.remove('hidden');
        customWorkTime.value = settings.workTime;
    }
    
    if (breakTimeSelect.value === 'custom') {
        customBreakContainer.classList.remove('hidden');
        customBreakTime.value = settings.breakTime;
    }
    
    // 更新显示模式按钮状态
    document.getElementById('flip-display').classList.remove('bg-indigo-600', 'bg-gray-700');
    document.getElementById('normal-display').classList.remove('bg-indigo-600', 'bg-gray-700');
    document.getElementById('digital-display').classList.remove('bg-indigo-600', 'bg-gray-700');
    
    document.getElementById('flip-display').classList.add(settings.displayMode === 'flip' ? 'bg-indigo-600' : 'bg-gray-700');
    document.getElementById('normal-display').classList.add(settings.displayMode === 'normal' ? 'bg-indigo-600' : 'bg-gray-700');
    document.getElementById('digital-display').classList.add(settings.displayMode === 'digital' ? 'bg-indigo-600' : 'bg-gray-700');
}

        // 保存任务到数据库
        async function saveTaskToDatabase(task) {
    try {
        const response = await fetch(`${API_URL}/pomodoro/tasks`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('任务保存成功:', result);
            
            // 更新本地任务，标记为已同步
            task.synced = true;
            task.id = result.id || task.id; // 使用服务器返回的ID
            
            // 更新本地存储
            updateLocalStorage();
            
            return result;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('保存任务失败:', errorData);
            throw new Error(errorData.message || '保存任务到数据库失败');
        }
    } catch (error) {
        console.error('保存任务到数据库出错:', error);
        // 即使保存到数据库失败，也要保存到本地存储
        updateLocalStorage();
        return null;
    }
}

        // 在任务完成或放弃时调用
        function finishTask(status) {
    if (!currentTask) return;
    
    // 更新任务状态
    currentTask.status = status;
    currentTask.endTime = new Date().toISOString();
    
    if (status === 'completed') {
        // 计算实际持续时间（秒）
        currentTask.actualDuration = currentTask.plannedDuration;
        showToast('success', '恭喜！任务完成！');
    } else {
        // 已放弃任务
        currentTask.actualDuration = currentTask.plannedDuration - timerSeconds;
        showToast('warning', '任务已放弃');
    }
    
    // 保存到任务历史
    tasks.push(currentTask);
    
    // 保存到数据库
    saveTaskToDatabase(currentTask).catch(error => {
        console.error('保存任务到数据库失败:', error);
        showToast('error', '同步到云端失败，已保存到本地');
    });
    
    // 重置当前任务
    resetTimer();
    updateLocalStorage();
    renderTaskHistory();
}

// 关闭设置面板
function closeSettingsPanel() {
    settingsPanel.classList.remove('open');
}

        // 保存设置
        function saveSettings() {
    settings.workTime = workTimeSelect.value === 'custom' ? 
        parseInt(customWorkTime.value) || settings.workTime : 
        parseInt(workTimeSelect.value);
    
    settings.breakTime = breakTimeSelect.value === 'custom' ? 
        parseInt(customBreakTime.value) || settings.breakTime : 
        parseInt(breakTimeSelect.value);
    
    // 保存任务名称
    settings.taskName = taskNameInput.value.trim() || '专注工作中...';
    
    // 更新任务名称显示（只在工作模式下）
    if (currentMode === 'work') {
        updateTaskDisplay();
    }
    
    // 保存到本地存储
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    
    // 应用新设置
    switchMode(currentMode);
    applyBackground();
    
    closeSettingsPanel();
}

// 添加更新任务名称显示的函数
function updateTaskDisplay() {
    // 只在工作模式下更新任务名称显示
    if (currentMode === 'work') {
        currentTaskDisplay.textContent = settings.taskName;
    }
    // 休息模式下保持固定文本"休息一下..."
}

// 加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
    
    // 更新任务名称显示
    updateTaskDisplay();
}

        // 应用背景设置
        function applyBackground() {
    // 检查是否有自定义静态背景
    const savedBg = localStorage.getItem('customBg');
    if (savedBg) {
        staticBg.style.backgroundImage = `url(${savedBg})`;
        
        // 如果有自定义静态背景，默认禁用动态背景
        if (settings.dynamicBg !== 'none') {
            settings.dynamicBg = 'none';
            saveSettings();
        }
        
        staticBg.style.opacity = '0.7';
        dynamicBg.className = 'dynamic-bg';
    } else {
        // 应用动态背景
        setDynamicBackground(settings.dynamicBg || 'aurora');
    }
    
    // 根据当前模式调整色调
    if (currentMode === 'work') {
        dynamicBg.style.filter = 'hue-rotate(0deg)'; // 冷色调
    } else {
        dynamicBg.style.filter = 'hue-rotate(90deg)'; // 暖色调
    }
}

// 处理背景上传
function handleBgUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const bgUrl = event.target.result;
            staticBg.style.backgroundImage = `url(${bgUrl})`;
            localStorage.setItem('customBg', bgUrl);
            
            // 上传静态背景时，禁用动态背景
            setDynamicBackground('none');
            settings.dynamicBg = 'none';
            saveSettings();
        };
        reader.readAsDataURL(file);
    }
}

// 删除背景
function removeBackground() {
    // 重置为默认背景
    staticBg.style.backgroundImage = 'url("https://source.unsplash.com/random/1920x1080/?nature")';
    // 从本地存储中删除自定义背景
    localStorage.removeItem('customBg');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);
// 添加拖动功能
const mainContainer = document.querySelector('.main-container');
let isDragging = false;
let offsetX, offsetY;

// 鼠标按下事件
mainContainer.addEventListener('mousedown', (e) => {
    // 如果点击的是按钮或输入框等交互元素，不启动拖动
    if (e.target.tagName === 'BUTTON' || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'SELECT' ||
        e.target.closest('.control-buttons') ||
        e.target.closest('.flip-clock')) {
        return;
    }
    
    isDragging = true;
    
    // 计算鼠标在容器内的相对位置
    const rect = mainContainer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    // 添加临时样式
    mainContainer.style.transition = 'none';
    mainContainer.style.cursor = 'grabbing';
});

// 鼠标移动事件
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // 计算新位置
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // 应用新位置，使用translate而不是left/top以获得更好的性能
    mainContainer.style.transform = `translate(0, 0)`;
    mainContainer.style.left = `${x}px`;
    mainContainer.style.top = `${y}px`;
    
    // 防止默认行为和事件传播
    e.preventDefault();
});

// 鼠标释放事件
document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        mainContainer.style.cursor = 'move';
    }
});

// 鼠标离开窗口事件
document.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        mainContainer.style.cursor = 'move';
    }
});