/**
 * 主要应用逻辑
 * 处理UI渲染、站点数据展示和用户交互
 */

// 应用主控制器
const App = {
    // 当前站点数据
    sitesData: [],
    
    // 是否已登录管理员
    isAdmin: false,
    
    // 初始化应用
    async init() {
        // 检查是否已经登录
        this.checkAdminStatus();
        
        // 加载站点数据
        await this.loadSites();
        
        // 设置事件监听器
        this.setupEventListeners();
    },
    
    // 加载站点数据
    async loadSites() {
        // 显示加载中状态
        const loadingElem = document.getElementById('loading');
        if (loadingElem) {
            loadingElem.classList.remove('d-none');
        }
        
        try {
            // 获取站点数据
            this.sitesData = await SitesManager.getSites();
            
            // 渲染站点数据
            this.renderSites();
            
        } catch (error) {
            console.error('加载站点失败:', error);
            this.showError('无法加载站点数据，请稍后再试');
        } finally {
            // 隐藏加载指示器
            if (loadingElem) {
                loadingElem.classList.add('d-none');
            }
        }
    },
    
    // 渲染站点内容
    renderSites() {
        const container = document.getElementById('sites-container');
        if (!container) return;
        
        // 清空容器（保留加载指示器）
        const loadingElem = document.getElementById('loading');
        container.innerHTML = '';
        if (loadingElem) {
            container.appendChild(loadingElem);
            loadingElem.classList.add('d-none'); // 隐藏加载指示器
        }
        
        // 如果没有数据，显示空状态
        if (!this.sitesData || this.sitesData.length === 0) {
            container.innerHTML += `
                <div class="col-12 text-center py-5">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-circle fs-1 mb-3"></i>
                        <h4>暂无站点数据</h4>
                        <p class="text-muted">您的导航站点目前没有配置任何数据</p>
                        ${this.isAdmin ? '<button class="btn btn-primary mt-3" id="add-sites-btn">添加站点</button>' : ''}
                    </div>
                </div>
            `;
            
            // 为管理员添加点击事件
            const addSitesBtn = document.getElementById('add-sites-btn');
            if (addSitesBtn) {
                addSitesBtn.addEventListener('click', () => this.openEditModal());
            }
            
            return;
        }
        
        // 渲染每个分类和站点
        this.sitesData.forEach(category => {
            const categoryHtml = `
                <div class="col-12 category-section" data-category-id="${category.id}">
                    <h2 class="category-title">${category.name}</h2>
                    <div class="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-3 sites-row">
                        ${category.sites.map(site => this.renderSiteCard(site)).join('')}
                    </div>
                </div>
            `;
            container.innerHTML += categoryHtml;
        });
        
        // 如果是管理员，添加编辑按钮
        if (this.isAdmin) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary position-fixed bottom-0 end-0 m-4';
            editBtn.innerHTML = '<i class="bi bi-pencil-square me-2"></i>编辑站点';
            editBtn.addEventListener('click', () => this.openEditModal());
            document.body.appendChild(editBtn);
        }
    },
    
    // 渲染单个站点卡片
    renderSiteCard(site) {
        return `
            <div class="col" data-site-id="${site.id}">
                <div class="site-card">
                    <div class="d-flex align-items-center mb-2">
                        ${site.icon ? `<img src="${site.icon}" alt="${site.name}" class="site-icon">` : ''}
                        <h3 class="site-card-title mb-0">${site.name}</h3>
                    </div>
                    <p class="site-card-desc">${site.desc || ''}</p>
                    <a href="${site.url}" target="_blank" class="site-card-link">
                        <i class="bi bi-box-arrow-up-right"></i> 访问
                    </a>
                </div>
            </div>
        `;
    },
    
    // 搜索站点
    searchSites(query) {
        if (!query || query.trim() === '') {
            // 如果搜索词为空，显示所有站点
            this.renderSites();
            return;
        }
        
        query = query.trim().toLowerCase();
        
        // 过滤匹配的站点
        const filteredData = this.sitesData.map(category => {
            // 复制分类但只包含匹配的站点
            return {
                ...category,
                sites: category.sites.filter(site => 
                    site.name.toLowerCase().includes(query) || 
                    (site.desc && site.desc.toLowerCase().includes(query))
                )
            };
        }).filter(category => category.sites.length > 0); // 只保留有匹配站点的分类
        
        // 保存原始数据以便恢复
        const originalData = this.sitesData;
        
        // 临时替换数据进行渲染
        this.sitesData = filteredData;
        this.renderSites();
        
        // 恢复原始数据
        this.sitesData = originalData;
        
        // 如果没有搜索结果
        if (filteredData.length === 0) {
            const container = document.getElementById('sites-container');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="empty-state">
                            <i class="bi bi-search fs-1 mb-3"></i>
                            <h4>没有匹配的结果</h4>
                            <p class="text-muted">没有找到与"${query}"相关的站点</p>
                            <button class="btn btn-outline-secondary mt-3" id="clear-search-btn">
                                清除搜索
                            </button>
                        </div>
                    </div>
                `;
                
                const clearBtn = document.getElementById('clear-search-btn');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        document.getElementById('search-input').value = '';
                        this.renderSites();
                    });
                }
            }
        }
    },
    
    // 设置事件监听器
    setupEventListeners() {
        // 搜索框
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                this.searchSites(e.target.value);
            });
        }
        
        // 管理员登录按钮
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', e => {
                e.preventDefault();
                this.openLoginModal();
            });
        }
        
        // 登录提交
        const loginSubmit = document.getElementById('login-submit');
        if (loginSubmit) {
            loginSubmit.addEventListener('click', async () => {
                await this.handleLogin();
            });
        }
        
        // 登录表单回车提交
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async e => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
        
        // 保存站点按钮
        const saveSitesBtn = document.getElementById('save-sites');
        if (saveSitesBtn) {
            saveSitesBtn.addEventListener('click', async () => {
                await this.handleSaveSites();
            });
        }
    },
    
    // 处理管理员登录
    async handleLogin() {
        const apiKeyInput = document.getElementById('api-key');
        const loginError = document.getElementById('login-error');
        
        if (!apiKeyInput || !loginError) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            loginError.textContent = '请输入API密钥';
            loginError.classList.remove('d-none');
            return;
        }
        
        try {
            // 验证令牌
            const result = await SitesManager.verifyToken(apiKey);
            
            if (result.success) {
                // 登录成功
                this.isAdmin = true;
                
                // 关闭登录模态框
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (loginModal) {
                    loginModal.hide();
                }
                
                // 重新渲染以显示管理员选项
                this.renderSites();
                
                // 显示成功提示
                this.showMessage('管理员登录成功', 'success');
            } else {
                // 显示错误
                loginError.textContent = result.error || '验证失败';
                loginError.classList.remove('d-none');
            }
        } catch (error) {
            loginError.textContent = '验证过程中发生错误';
            loginError.classList.remove('d-none');
            console.error('登录失败:', error);
        }
    },
    
    // 处理保存站点数据
    async handleSaveSites() {
        const editError = document.getElementById('edit-error');
        const sitesEditor = document.getElementById('sites-editor');
        
        if (!sitesEditor || !editError) return;
        
        try {
            // 解析JSON数据
            let newSitesData;
            try {
                newSitesData = JSON.parse(sitesEditor.value);
                if (!Array.isArray(newSitesData)) {
                    throw new Error('数据格式无效，应为数组');
                }
            } catch (e) {
                editError.textContent = `JSON解析错误: ${e.message}`;
                editError.classList.remove('d-none');
                return;
            }
            
            // 验证数据结构
            const isValid = this.validateSitesData(newSitesData);
            if (!isValid.valid) {
                editError.textContent = isValid.error;
                editError.classList.remove('d-none');
                return;
            }
            
            // 保存数据
            await SitesManager.updateSites(newSitesData);
            
            // 更新本地数据并重新渲染
            this.sitesData = newSitesData;
            this.renderSites();
            
            // 关闭模态框
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            if (editModal) {
                editModal.hide();
            }
            
            // 显示成功提示
            this.showMessage('站点数据已成功保存', 'success');
        } catch (error) {
            console.error('保存站点失败:', error);
            editError.textContent = `保存失败: ${error.message}`;
            editError.classList.remove('d-none');
        }
    },
    
    // 验证站点数据结构
    validateSitesData(data) {
        if (!Array.isArray(data)) {
            return { valid: false, error: '数据必须是数组' };
        }
        
        for (let i = 0; i < data.length; i++) {
            const category = data[i];
            
            // 检查分类必需字段
            if (!category.id || !category.name || !Array.isArray(category.sites)) {
                return { 
                    valid: false, 
                    error: `分类 #${i+1} 缺少必需字段(id, name, sites)` 
                };
            }
            
            // 检查每个站点
            for (let j = 0; j < category.sites.length; j++) {
                const site = category.sites[j];
                if (!site.id || !site.name || !site.url) {
                    return { 
                        valid: false, 
                        error: `分类 "${category.name}" 中站点 #${j+1} 缺少必需字段(id, name, url)` 
                    };
                }
            }
        }
        
        return { valid: true };
    },
    
    // 打开登录模态框
    openLoginModal() {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        
        // 重置表单
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        
        if (loginForm) loginForm.reset();
        if (loginError) loginError.classList.add('d-none');
        
        loginModal.show();
    },
    
    // 打开编辑模态框
    openEditModal() {
        if (!this.isAdmin) {
            this.openLoginModal();
            return;
        }
        
        const editModal = new bootstrap.Modal(document.getElementById('editModal'));
        const sitesEditor = document.getElementById('sites-editor');
        const editError = document.getElementById('edit-error');
        
        if (sitesEditor) {
            // 填充当前站点数据
            sitesEditor.value = JSON.stringify(this.sitesData, null, 2);
        }
        
        if (editError) {
            editError.classList.add('d-none');
        }
        
        editModal.show();
    },
    
    // 检查管理员状态
    checkAdminStatus() {
        const token = localStorage.getItem('api_token');
        this.isAdmin = !!token;
    },
    
    // 显示错误信息
    showError(message) {
        this.showMessage(message, 'danger');
    },
    
    // 显示消息通知
    showMessage(message, type = 'primary') {
        // 创建Toast元素
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('id', toastId);
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // 添加到页面
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);
        
        // 创建Bootstrap Toast实例
        const toastInstance = new bootstrap.Toast(toast);
        
        // 显示通知
        toastInstance.show();
        
        // 在关闭后删除元素
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});