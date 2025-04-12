const API_URL = 'http://localhost:3000/api';

// 显示通知
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    // 设置图标
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else {
        icon.className = 'fas fa-exclamation-circle';
    }
    
    // 设置类型
    toast.className = `toast ${type} show`;
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '登录失败');
        }
        
        const data = await response.json();
        
        // 如果选择了记住密码，保存到本地存储
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({ username, password }));
        } else {
            // 如果没有选择记住密码，清除本地存储
            localStorage.removeItem('rememberedUser');
        }
        
        showToast('登录成功', 'success');
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// 页面加载时检查是否有记住的用户
document.addEventListener('DOMContentLoaded', () => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    
    if (rememberedUser) {
        const { username, password } = JSON.parse(rememberedUser);
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        document.getElementById('rememberMe').checked = true;
    }
    
    // 注销账号相关事件
    const deleteAccountLink = document.getElementById('deleteAccountLink');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const deleteAccountForm = document.getElementById('deleteAccountForm');
    
    // 显示注销账号模态框
    deleteAccountLink.addEventListener('click', (e) => {
        e.preventDefault();
        deleteAccountModal.style.display = 'flex';
        
        // 如果有记住的用户名，自动填充
        if (rememberedUser) {
            document.getElementById('deleteUsername').value = JSON.parse(rememberedUser).username;
        }
    });
    
    // 关闭注销账号模态框
    cancelDeleteBtn.addEventListener('click', () => {
        deleteAccountModal.style.display = 'none';
    });
    
    // 提交注销账号表单
    deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('deleteUsername').value;
        const password = document.getElementById('deletePassword').value;
        
        try {
            // 先验证用户名和密码
            const loginResponse = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            
            if (!loginResponse.ok) {
                throw new Error('用户名或密码不正确');
            }
            
            // 验证通过后，发送注销账号请求
            const deleteResponse = await fetch(`${API_URL}/delete-account`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!deleteResponse.ok) {
                const error = await deleteResponse.json();
                throw new Error(error.message || '注销账号失败');
            }
            
            // 清除本地存储
            localStorage.removeItem('rememberedUser');
            
            // 关闭模态框
            deleteAccountModal.style.display = 'none';
            
            showToast('账号已成功注销', 'success');
            
            // 清空表单
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('deleteUsername').value = '';
            document.getElementById('deletePassword').value = '';
            
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
});