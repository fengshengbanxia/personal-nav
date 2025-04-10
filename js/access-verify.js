/**
 * 访问验证功能
 * 控制导航站的访问权限
 */

// 访问验证控制器
const AccessVerifier = {
    // 访问密码 - 实际应用中应该从服务器获取或使用更安全的方式存储
    accessPassword: 'winterwinter',
    
    // 访问令牌的本地存储键名
    accessTokenKey: 'nav_access_token',
    
    // 令牌有效期（毫秒）- 默认24小时
    tokenExpiry: 24 * 60 * 60 * 1000,
    
    // 初始化
    init() {
        // 检查是否已经验证过
        if (!this.checkAccess()) {
            this.showVerifyModal();
        }
        
        // 设置验证按钮事件
        const verifyBtn = document.getElementById('verify-access-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifyAccess());
        }
        
        // 设置表单提交事件
        const accessForm = document.getElementById('access-form');
        if (accessForm) {
            accessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.verifyAccess();
            });
        }
        
        // 设置密码输入框回车事件
        const passwordInput = document.getElementById('access-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.verifyAccess();
                }
            });
        }
    },
    
    // 显示验证模态框
    showVerifyModal() {
        const modal = new bootstrap.Modal(document.getElementById('accessVerifyModal'));
        modal.show();
    },
    
    // 验证访问密码
    verifyAccess() {
        const passwordInput = document.getElementById('access-password');
        const errorMsg = document.getElementById('access-error');
        
        if (!passwordInput || !errorMsg) return;
        
        const password = passwordInput.value.trim();
        
        if (!password) {
            errorMsg.textContent = '请输入访问密码';
            errorMsg.classList.remove('d-none');
            return;
        }
        
        // 验证密码
        if (password === this.accessPassword) {
            // 密码正确，生成访问令牌
            this.setAccessToken();
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('accessVerifyModal'));
            if (modal) {
                modal.hide();
            }
            
            // 显示成功消息
            this.showSuccessMessage();
        } else {
            // 密码错误
            errorMsg.textContent = '访问密码错误，请重试';
            errorMsg.classList.remove('d-none');
            passwordInput.value = '';
            passwordInput.focus();
        }
    },
    
    // 设置访问令牌
    setAccessToken() {
        const now = new Date().getTime();
        const expiryTime = now + this.tokenExpiry;
        
        // 创建令牌对象
        const token = {
            timestamp: now,
            expiry: expiryTime
        };
        
        // 保存到本地存储
        localStorage.setItem(this.accessTokenKey, JSON.stringify(token));
    },
    
    // 检查访问权限
    checkAccess() {
        const tokenStr = localStorage.getItem(this.accessTokenKey);
        
        if (!tokenStr) {
            return false;
        }
        
        try {
            const token = JSON.parse(tokenStr);
            const now = new Date().getTime();
            
            // 检查令牌是否过期
            if (token.expiry && token.expiry > now) {
                return true;
            } else {
                // 令牌已过期，清除
                localStorage.removeItem(this.accessTokenKey);
                return false;
            }
        } catch (e) {
            console.error('解析访问令牌失败:', e);
            localStorage.removeItem(this.accessTokenKey);
            return false;
        }
    },
    
    // 显示成功消息
    showSuccessMessage() {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i> 验证成功，欢迎访问导航站！
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        messageContainer.appendChild(alertDiv);
        
        // 5秒后自动关闭
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.parentNode.removeChild(alertDiv);
                    }
                }, 150);
            }
        }, 5000);
    }
};

// 页面加载完成后初始化访问验证
document.addEventListener('DOMContentLoaded', () => {
    AccessVerifier.init();
});
