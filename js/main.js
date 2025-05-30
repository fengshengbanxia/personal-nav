/**
 * 主要应用逻辑
 * 处理UI渲染、站点数据展示和用户交互
 */

// 新增：获取并显示一言
async function loadHitokotoQuote() {
    const apiUrl = 'https://v1.hitokoto.cn/?c=a&c=c&c=f&encode=json'; // 动画(a)、游戏(c)、网络(f) - 符合二次元、中二、网络调性
    const quoteElement = document.getElementById('daily-quote');
    const fromElement = document.getElementById('quote-from');
    const defaultQuote = '只要你还记得我，我就会一直在你的身边。';
    const defaultFrom = '— 符文工房';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (quoteElement) {
            quoteElement.textContent = data.hitokoto || defaultQuote;
        }
        if (fromElement) {
            fromElement.textContent = '— ' + (data.from || data.from_who || '未知来源');
        }
    } catch (error) {
        console.error('获取一言失败:', error);
        // 网络错误或解析失败时显示默认值
        if (quoteElement) {
            quoteElement.textContent = defaultQuote;
        }
        if (fromElement) {
            fromElement.textContent = defaultFrom;
        }
    }
}

// 应用主控制器
const App = {
    // 当前站点数据
    sitesData: [],

    // 是否已登录管理员
    isAdmin: false,

    // 当前选中的分类和站点（用于表单编辑）
    currentCategoryIndex: -1,
    currentSiteIndex: -1,
    formMode: 'add', // 'add' 或 'edit'

    // 初始化应用
    async init() {
        // 检查是否已经登录
        await this.checkAdminStatus();

        // 加载站点数据
        await this.loadSites();

        // 更新页面元素
        this.updateDateTimeWidgets();
        this.renderCategoryNav();

        // 设置事件监听器
        this.setupEventListeners();

        // 初始化编辑模态框
        this.initEditModal();

        // 启动时间更新间隔
        this.startTimeInterval();
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
                    <div class="category-header">
                        <h2 class="category-title">
                            ${this.isAdmin ? '<i class="bi bi-grip-horizontal me-2 drag-indicator" title="拖动排序"></i>' : ''}
                            ${category.name}
                        </h2>
                        ${this.isAdmin ? `
                            <button class="btn-add-site" data-category-id="${category.id}" title="在此分类添加站点">
                                <i class="bi bi-plus-circle"></i> 添加站点
                            </button>
                        ` : ''}
                    </div>
                    <div class="row row-cols-1 row-cols-md-3 row-cols-lg-${SettingsManager && SettingsManager.settings ? SettingsManager.settings.cardsPerRow : 4} g-3 sites-row">
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
        // 生成图标HTML
        let iconHtml = '';
        if (site.icon) {
            // 使用用户提供的图标
            iconHtml = `<img src="${site.icon}" alt="${site.name}" class="site-icon">`;
        } else {
            // 生成默认图标 - 使用网站首字母或图标
            const firstLetter = site.name.charAt(0).toUpperCase();
            const iconColors = [
                '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
                '#4895ef', '#560bad', '#f15bb5', '#fee440', '#00bbf9',
                '#00f5d4', '#e63946', '#588157', '#ff9e00', '#8338ec'
            ];
            // 根据站点名称生成随机但固定的颜色
            const colorIndex = site.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % iconColors.length;
            const bgColor = iconColors[colorIndex];

            // 判断是否使用图标或字母
            let iconContent = '';
            if (site.name.includes('购物') || site.name.includes('商城')) {
                iconContent = '<i class="bi bi-cart"></i>';
            } else if (site.name.includes('视频') || site.name.includes('电影') || site.name.includes('影视')) {
                iconContent = '<i class="bi bi-film"></i>';
            } else if (site.name.includes('音乐')) {
                iconContent = '<i class="bi bi-music-note"></i>';
            } else if (site.name.includes('游戏')) {
                iconContent = '<i class="bi bi-controller"></i>';
            } else if (site.name.includes('学习') || site.name.includes('教育')) {
                iconContent = '<i class="bi bi-book"></i>';
            } else if (site.name.includes('工具')) {
                iconContent = '<i class="bi bi-tools"></i>';
            } else if (site.name.includes('社交') || site.name.includes('社区')) {
                iconContent = '<i class="bi bi-people"></i>';
            } else if (site.name.includes('新闻') || site.name.includes('资讯')) {
                iconContent = '<i class="bi bi-newspaper"></i>';
            } else if (site.name.includes('开发') || site.name.includes('编程')) {
                iconContent = '<i class="bi bi-code-square"></i>';
            } else {
                // 使用首字母
                iconContent = firstLetter;
            }

            // 创建自定义图标
            iconHtml = `<div class="default-site-icon" style="background-color: ${bgColor}">${iconContent}</div>`;
        }

        return `
            <div class="col" data-site-id="${site.id}">
                <div class="site-card">
                    ${this.isAdmin ? `
                        <div class="site-card-actions">
                            <button class="btn-card-edit" title="编辑站点" data-site-id="${site.id}"><i class="bi bi-pencil"></i></button>
                        </div>
                        <div class="drag-handle-site" title="拖动排序"><i class="bi bi-grip-vertical"></i></div>
                    ` : ''}
                    <div class="d-flex align-items-center mb-2">
                        ${iconHtml}
                        <h3 class="site-card-title mb-0">${site.name}</h3>
                    </div>
                    <p class="site-card-desc">${site.desc || ''}</p>
                    <div class="site-card-footer">
                        <a href="${site.url}" target="_blank" class="site-card-link">
                            <i class="bi bi-box-arrow-up-right"></i> 访问
                        </a>
                        ${this.isAdmin ? `
                            <button class="btn-quick-edit" title="快速编辑" data-site-id="${site.id}">
                                <i class="bi bi-pencil-square"></i> 编辑
                            </button>
                        ` : ''}
                    </div>
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

        // 登录表单提交
        const loginSubmit = document.getElementById('login-submit');
        if (loginSubmit) {
            loginSubmit.addEventListener('click', () => this.handleLogin());
        }

        // 初始化令牌按钮
        const initTokenBtn = document.getElementById('init-token-btn');
        if (initTokenBtn) {
            initTokenBtn.addEventListener('click', e => {
                e.preventDefault();
                this.openInitTokenModal();
            });
        }

        // 初始化令牌表单提交
        const initTokenSubmit = document.getElementById('init-token-submit');
        if (initTokenSubmit) {
            initTokenSubmit.addEventListener('click', () => this.handleInitToken());
        }

        // 保存站点按钮
        const saveSitesBtn = document.getElementById('save-sites');
        if (saveSitesBtn) {
            saveSitesBtn.addEventListener('click', async () => {
                await this.handleSaveSites();
            });
        }

        // 添加分类按钮
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showCategoryForm('add');
            });
        }

        // 分类表单提交
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', e => {
                e.preventDefault();
                this.saveCategoryForm();
            });
        }

        // 取消分类编辑按钮
        const cancelCategoryBtn = document.getElementById('cancel-category-btn');
        if (cancelCategoryBtn) {
            cancelCategoryBtn.addEventListener('click', () => {
                this.hideCategoryForm();
            });
        }

        // 分类选择下拉框
        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.handleCategorySelect();
            });
        }

        // 添加站点按钮
        const addSiteBtn = document.getElementById('add-site-btn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', () => {
                this.showSiteForm('add');
            });
        }

        // 站点表单提交
        const siteForm = document.getElementById('site-form');
        if (siteForm) {
            siteForm.addEventListener('submit', e => {
                e.preventDefault();
                this.saveSiteForm();
            });
        }

        // 取消站点编辑按钮
        const cancelSiteBtn = document.getElementById('cancel-site-btn');
        if (cancelSiteBtn) {
            cancelSiteBtn.addEventListener('click', () => {
                this.hideSiteForm();
            });
        }

        // 编辑模态框的多个选项卡切换事件
        const jsonTab = document.getElementById('json-tab');
        if (jsonTab) {
            jsonTab.addEventListener('shown.bs.tab', () => {
                // 当切换到JSON标签时，更新JSON编辑器的内容
                this.updateJsonEditor();
            });
        }
    },

    // 初始化编辑模态框
    initEditModal() {
        // 初始化分类表单
        this.initCategoryForm();
        // 初始化站点表单
        this.initSiteForm();
        // 初始化JSON编辑器
        this.initJsonEditor();
        // 设置保存按钮事件
        this.initSaveSitesButton();
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

        // 显示正在验证的状态
        loginError.textContent = '正在验证令牌...';
        loginError.className = 'alert alert-info';
        loginError.classList.remove('d-none');

        try {
            // 验证令牌
            const result = await SitesManager.verifyToken(apiKey);

            if (result.success) {
                // 登录成功
                this.isAdmin = true;

                // 显示详细成功信息
                loginError.textContent = '验证成功！令牌匹配。即将进入管理界面...';
                loginError.className = 'alert alert-success';

                // 延迟关闭模态框，让用户看到成功消息
                setTimeout(() => {
                    // 关闭登录模态框
                    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (loginModal) {
                        loginModal.hide();
                    }

                    // 重新渲染以显示管理员选项
                    this.renderSites();

                    // 显示成功提示
                    this.showMessage('管理员登录成功', 'success');
                }, 1500);
            } else {
                // 显示错误
                loginError.textContent = `验证失败：${result.error || '令牌不匹配'}`;
                loginError.className = 'alert alert-danger';
                loginError.classList.remove('d-none');
            }
        } catch (error) {
            loginError.textContent = `验证过程中发生错误: ${error.message || '未知错误'}`;
            loginError.className = 'alert alert-danger';
            loginError.classList.remove('d-none');
            console.error('登录失败:', error);
        }
    },

    // 打开初始化令牌模态框
    openInitTokenModal() {
        // 隐藏登录模态框
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }

        // 重置表单
        const tokenForm = document.getElementById('init-token-form');
        const errorMsg = document.getElementById('init-token-error');
        if (tokenForm) tokenForm.reset();
        if (errorMsg) errorMsg.classList.add('d-none');

        // 显示初始化模态框
        const initModal = new bootstrap.Modal(document.getElementById('initTokenModal'));
        if (initModal) {
            initModal.show();
        }
    },

    // 处理初始化令牌
    async handleInitToken() {
        const newTokenInput = document.getElementById('new-token');
        const confirmTokenInput = document.getElementById('confirm-token');
        const errorMsg = document.getElementById('init-token-error');

        if (!newTokenInput || !confirmTokenInput || !errorMsg) return;

        const newToken = newTokenInput.value.trim();
        const confirmToken = confirmTokenInput.value.trim();

        // 隐藏之前的错误
        errorMsg.classList.add('d-none');

        // 验证令牌
        if (!newToken) {
            errorMsg.textContent = '请输入令牌';
            errorMsg.classList.remove('d-none');
            return;
        }

        if (newToken.length < 8) {
            errorMsg.textContent = '令牌必须至少包含8个字符';
            errorMsg.classList.remove('d-none');
            return;
        }

        if (newToken !== confirmToken) {
            errorMsg.textContent = '两次输入的令牌不一致';
            errorMsg.classList.remove('d-none');
            return;
        }

        try {
            // 初始化令牌
            const result = await SitesManager.initializeToken(newToken);

            if (result.success) {
                // 初始化成功
                this.isAdmin = true;

                // 关闭初始化模态框
                const initModal = bootstrap.Modal.getInstance(document.getElementById('initTokenModal'));
                if (initModal) {
                    initModal.hide();
                }

                // 重新渲染以显示管理员选项
                this.renderSites();

                // 显示成功提示
                this.showMessage('管理员令牌初始化成功，您已自动登录', 'success');
            } else {
                // 显示错误
                errorMsg.textContent = result.error || '初始化失败';
                errorMsg.classList.remove('d-none');
            }
        } catch (error) {
            errorMsg.textContent = '初始化过程中发生错误';
            errorMsg.classList.remove('d-none');
            console.error('初始化失败:', error);
        }
    },

    // 显示分类表单
    showCategoryForm(mode) {
        this.formMode = mode;
        const categoryFormCard = document.getElementById('category-form-card');
        const categoryIdInput = document.getElementById('category-id');
        const categoryNameInput = document.getElementById('category-name');
        const categoryFormTitle = document.getElementById('category-form-title');

        if (!categoryFormCard || !categoryNameInput || !categoryFormTitle) return;

        // 重置表单
        if (categoryIdInput) categoryIdInput.value = '';
        categoryNameInput.value = '';

        if (mode === 'add') {
            // 添加分类模式
            categoryFormTitle.textContent = '添加分类';
        } else {
            // 编辑分类模式 - 已在 editCategory 中处理
            return;
        }

        // 显示表单
        categoryFormCard.classList.remove('d-none');
    },

    // 隐藏分类表单
    hideCategoryForm() {
        const categoryFormCard = document.getElementById('category-form-card');
        if (categoryFormCard) {
            categoryFormCard.classList.add('d-none');
        }
    },

    // 保存分类表单
    saveCategoryForm() {
        const categoryIdInput = document.getElementById('category-id');
        const categoryNameInput = document.getElementById('category-name');

        if (!categoryNameInput) return;

        const categoryName = categoryNameInput.value.trim();
        if (!categoryName) {
            this.showError('请输入分类名称');
            return;
        }

        if (this.formMode === 'add') {
            // 添加新分类
            const newCategoryId = 'category_' + Date.now();
            const newCategory = {
                id: newCategoryId,
                name: categoryName,
                sites: []
            };
            this.sitesData.push(newCategory);

            this.showMessage(`已添加分类 "${categoryName}"`, 'success');
        } else if (this.formMode === 'edit') {
            // 编辑现有分类
            if (this.currentCategoryIndex >= 0 && this.currentCategoryIndex < this.sitesData.length) {
                const category = this.sitesData[this.currentCategoryIndex];
                category.name = categoryName;

                this.showMessage(`已更新分类 "${categoryName}"`, 'success');
            }
        }

        // 隐藏表单
        this.hideCategoryForm();

        // 重新渲染分类列表
        this.renderCategoriesList();

        // 重新填充分类选择下拉框
        this.populateCategorySelect();

        // 更新JSON编辑器
        this.updateJsonEditor();
    },

    // 显示站点表单
    showSiteForm(mode) {
        this.formMode = mode;
        const siteFormCard = document.getElementById('site-form-card');
        const siteIdInput = document.getElementById('site-id');
        const siteNameInput = document.getElementById('site-name');
        const siteUrlInput = document.getElementById('site-url');
        const siteIconInput = document.getElementById('site-icon');
        const siteDescInput = document.getElementById('site-desc');
        const siteFormTitle = document.getElementById('site-form-title');

        if (!siteFormCard || !siteNameInput || !siteUrlInput || !siteFormTitle) return;

        // 检查是否已选择分类
        if (this.currentCategoryIndex < 0 || this.currentCategoryIndex >= this.sitesData.length) {
            this.showError('请先选择一个分类');
            return;
        }

        // 重置表单
        if (siteIdInput) siteIdInput.value = '';
        siteNameInput.value = '';
        siteUrlInput.value = '';
        if (siteIconInput) siteIconInput.value = '';
        if (siteDescInput) siteDescInput.value = '';

        if (mode === 'add') {
            // 添加站点模式
            siteFormTitle.textContent = '添加网站';
        } else {
            // 编辑站点模式 - 已在 editSite 中处理
            return;
        }

        // 显示表单
        siteFormCard.classList.remove('d-none');
    },

    // 隐藏站点表单
    hideSiteForm() {
        const siteFormCard = document.getElementById('site-form-card');
        if (siteFormCard) {
            siteFormCard.classList.add('d-none');
        }
    },

    // 保存站点表单
    saveSiteForm() {
        const siteIdInput = document.getElementById('site-id');
        const siteNameInput = document.getElementById('site-name');
        const siteUrlInput = document.getElementById('site-url');
        const siteIconInput = document.getElementById('site-icon');
        const siteDescInput = document.getElementById('site-desc');

        if (!siteNameInput || !siteUrlInput) return;

        // 检查表单值
        const siteName = siteNameInput.value.trim();
        const siteUrl = siteUrlInput.value.trim();
        const siteIcon = siteIconInput ? siteIconInput.value.trim() : '';
        const siteDesc = siteDescInput ? siteDescInput.value.trim() : '';

        if (!siteName) {
            this.showError('请输入网站名称');
            return;
        }

        if (!siteUrl) {
            this.showError('请输入网站URL');
            return;
        }

        // 验证URL格式
        if (!this.isValidUrl(siteUrl)) {
            this.showError('请输入有效的URL格式 (例如: https://example.com)');
            return;
        }

        if (this.formMode === 'add') {
            // 添加新站点
            const newSiteId = 'site_' + Date.now();
            const newSite = {
                id: newSiteId,
                name: siteName,
                url: siteUrl,
                desc: siteDesc,
                icon: siteIcon
            };

            // 添加到当前选择的分类
            this.sitesData[this.currentCategoryIndex].sites.push(newSite);

            this.showMessage(`已添加网站 "${siteName}"`, 'success');
        } else if (this.formMode === 'edit') {
            // 编辑现有站点
            if (this.currentCategoryIndex >= 0 && this.currentCategoryIndex < this.sitesData.length &&
                this.currentSiteIndex >= 0 && this.currentSiteIndex < this.sitesData[this.currentCategoryIndex].sites.length) {

                const site = this.sitesData[this.currentCategoryIndex].sites[this.currentSiteIndex];
                site.name = siteName;
                site.url = siteUrl;
                site.icon = siteIcon;
                site.desc = siteDesc;

                this.showMessage(`已更新网站 "${siteName}"`, 'success');
            }
        }

        // 隐藏表单
        this.hideSiteForm();

        // 重新渲染站点列表
        this.renderSitesList(this.currentCategoryIndex);

        // 更新JSON编辑器
        this.updateJsonEditor();
    },

    // 验证URL格式
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    },

    // 更新JSON编辑器
    updateJsonEditor() {
        const sitesEditor = document.getElementById('sites-editor');
        if (sitesEditor) {
            sitesEditor.value = JSON.stringify(this.sitesData, null, 2);
        }
    },

    // 处理分类选择事件（站点管理选项卡）
    handleCategorySelect() {
        const categorySelect = document.getElementById('category-select');
        const addSiteBtn = document.getElementById('add-site-btn');
        const selectMessage = document.getElementById('select-category-message');
        const sitesList = document.getElementById('sites-list');

        if (!categorySelect) return;

        const selectedValue = categorySelect.value;

        // 设置添加站点按钮状态
        if (addSiteBtn) {
            addSiteBtn.disabled = selectedValue === '';
        }

        if (selectedValue === '') {
            // 未选择分类
            this.currentCategoryIndex = -1;

            // 显示提示信息，隐藏站点列表
            if (selectMessage) selectMessage.classList.remove('d-none');
            if (sitesList) sitesList.classList.add('d-none');
        } else {
            // 选择了分类
            this.currentCategoryIndex = parseInt(selectedValue);

            // 隐藏提示信息，显示站点列表
            if (selectMessage) selectMessage.classList.add('d-none');
            if (sitesList) sitesList.classList.remove('d-none');

            // 加载该分类的站点列表
            this.renderSitesList(this.currentCategoryIndex);
        }
    },

    // 处理保存站点数据
    async handleSaveSites() {
        const editError = document.getElementById('edit-error');
        const sitesEditor = document.getElementById('sites-editor');

        if (!sitesEditor || !editError) return;

        try {
            // 处理当前活跃的选项卡
            const jsonTab = document.querySelector('#json-tab.active');
            let newSitesData;

            if (jsonTab) {
                // 如果激活的是JSON编辑选项卡，解析JSON数据
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

                // 更新数据
                this.sitesData = newSitesData;
            }

            // 保存数据到服务器
            await SitesManager.updateSites(this.sitesData);

            // 重新渲染站点数据
            this.renderSites();

            // 关闭模态框
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            editModal.hide();

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

        // 重置错误信息
        if (editError) {
            editError.classList.add('d-none');
        }

        // 填充JSON编辑器内容
        if (sitesEditor) {
            sitesEditor.value = JSON.stringify(this.sitesData, null, 2);
        }

        // 填充分类列表
        this.renderCategoriesList();

        // 填充分类选择下拉框
        this.populateCategorySelect();

        // 显示模态框
        editModal.show();
    },

    // 渲染分类列表（用于分类管理选项卡）
    renderCategoriesList() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        if (!this.sitesData || this.sitesData.length === 0) {
            categoriesList.innerHTML = `
                <div class="alert alert-info">
                    暂无分类数据，请点击"添加分类"按钮创建
                </div>
            `;
            return;
        }

        this.sitesData.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            categoryItem.innerHTML = `
                <div>
                    <span class="badge bg-primary rounded-pill me-2">${category.sites.length}</span>
                    ${category.name}
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-category-btn" data-index="${index}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-category-btn" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
        });

        // 添加编辑和删除按钮的事件监听
        const editButtons = categoriesList.querySelectorAll('.edit-category-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.editCategory(index);
            });
        });

        const deleteButtons = categoriesList.querySelectorAll('.delete-category-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.deleteCategory(index);
            });
        });
    },

    // 填充分类选择下拉框（用于站点管理选项卡）
    populateCategorySelect() {
        const categorySelect = document.getElementById('category-select');
        const addSiteBtn = document.getElementById('add-site-btn');

        if (!categorySelect) return;

        // 清空并添加默认选项
        categorySelect.innerHTML = '<option value="">-- 请选择分类 --</option>';

        // 如果没有分类数据
        if (!this.sitesData || this.sitesData.length === 0) {
            categorySelect.disabled = true;
            if (addSiteBtn) addSiteBtn.disabled = true;
            return;
        }

        // 添加所有分类选项
        categorySelect.disabled = false;
        this.sitesData.forEach((category, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // 设置"添加站点"按钮的初始状态
        if (addSiteBtn) addSiteBtn.disabled = true;

        // 添加选择事件
        categorySelect.addEventListener('change', () => {
            const selectedIndex = categorySelect.value;

            // 启用/禁用"添加站点"按钮
            if (addSiteBtn) {
                addSiteBtn.disabled = selectedIndex === '';
            }

            if (selectedIndex !== '') {
                // 保存当前选择的分类索引
                this.currentCategoryIndex = parseInt(selectedIndex);

                // 渲染该分类下的站点列表
                this.renderSitesList(this.currentCategoryIndex);
            } else {
                // 隐藏站点列表，显示提示信息
                const sitesList = document.getElementById('sites-list');
                const selectMessage = document.getElementById('select-category-message');

                if (sitesList) sitesList.classList.add('d-none');
                if (selectMessage) selectMessage.classList.remove('d-none');
            }
        });
    },

    // 渲染站点列表（用于站点管理选项卡）
    renderSitesList(categoryIndex) {
        const sitesList = document.getElementById('sites-list');
        const selectMessage = document.getElementById('select-category-message');

        if (!sitesList || categoryIndex < 0 || categoryIndex >= this.sitesData.length) return;

        // 显示站点列表，隐藏提示信息
        sitesList.classList.remove('d-none');
        if (selectMessage) selectMessage.classList.add('d-none');

        // 获取当前分类
        const category = this.sitesData[categoryIndex];

        // 清空列表
        sitesList.innerHTML = '';

        // 如果该分类下没有站点
        if (!category.sites || category.sites.length === 0) {
            sitesList.innerHTML = `
                <div class="alert alert-info">
                    此分类下暂无站点数据，请点击"添加网站"按钮创建
                </div>
            `;
            return;
        }

        // 添加所有站点项
        category.sites.forEach((site, index) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            siteItem.innerHTML = `
                <div class="d-flex align-items-center">
                    ${site.icon ? `<img src="${site.icon}" alt="${site.name}" class="site-icon me-2">` : ''}
                    <div>
                        <h6 class="mb-0">${site.name}</h6>
                        <small class="text-muted">${site.url}</small>
                    </div>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-site-btn" data-index="${index}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-site-btn" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            sitesList.appendChild(siteItem);
        });

        // 添加编辑和删除按钮的事件监听
        const editButtons = sitesList.querySelectorAll('.edit-site-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.editSite(categoryIndex, index);
            });
        });

        const deleteButtons = sitesList.querySelectorAll('.delete-site-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.deleteSite(categoryIndex, index);
            });
        });
    },

    // 编辑分类
    editCategory(index) {
        if (index < 0 || index >= this.sitesData.length) return;

        this.currentCategoryIndex = index;
        this.formMode = 'edit';

        // 获取分类数据
        const category = this.sitesData[index];

        // 填充表单
        const categoryIdInput = document.getElementById('category-id');
        const categoryNameInput = document.getElementById('category-name');
        const categoryFormTitle = document.getElementById('category-form-title');
        const categoryFormCard = document.getElementById('category-form-card');

        if (categoryIdInput) categoryIdInput.value = category.id;
        if (categoryNameInput) categoryNameInput.value = category.name;
        if (categoryFormTitle) categoryFormTitle.textContent = '编辑分类';
        if (categoryFormCard) categoryFormCard.classList.remove('d-none');
    },

    // 删除分类
    deleteCategory(index) {
        if (index < 0 || index >= this.sitesData.length) return;

        // 确认删除
        if (!confirm(`确定删除分类 "${this.sitesData[index].name}" 及其所有网站吗？`)) return;

        // 删除分类
        this.sitesData.splice(index, 1);

        // 重新渲染分类列表
        this.renderCategoriesList();

        // 重新渲染分类选择下拉框
        this.populateCategorySelect();

        // 更新JSON编辑器
        this.updateJsonEditor();

        this.showMessage(`分类已删除`, 'success');
    },

    // 编辑站点
    editSite(categoryIndex, siteIndex) {
        if (categoryIndex < 0 || categoryIndex >= this.sitesData.length || siteIndex < 0 || siteIndex >= this.sitesData[categoryIndex].sites.length) return;

        this.currentCategoryIndex = categoryIndex;
        this.currentSiteIndex = siteIndex;
        this.formMode = 'edit';

        // 获取站点数据
        const site = this.sitesData[categoryIndex].sites[siteIndex];

        // 填充表单
        const siteIdInput = document.getElementById('site-id');
        const siteNameInput = document.getElementById('site-name');
        const siteUrlInput = document.getElementById('site-url');
        const siteIconInput = document.getElementById('site-icon');
        const siteDescInput = document.getElementById('site-desc');
        const siteFormTitle = document.getElementById('site-form-title');
        const siteFormCard = document.getElementById('site-form-card');

        if (siteIdInput) siteIdInput.value = site.id;
        if (siteNameInput) siteNameInput.value = site.name;
        if (siteUrlInput) siteUrlInput.value = site.url;
        if (siteIconInput) siteIconInput.value = site.icon || '';
        if (siteDescInput) siteDescInput.value = site.desc || '';
        if (siteFormTitle) siteFormTitle.textContent = '编辑站点';
        if (siteFormCard) siteFormCard.classList.remove('d-none');
    },

    // 删除站点
    deleteSite(categoryIndex, siteIndex) {
        if (categoryIndex < 0 || categoryIndex >= this.sitesData.length || siteIndex < 0 || siteIndex >= this.sitesData[categoryIndex].sites.length) return;

        const siteName = this.sitesData[categoryIndex].sites[siteIndex].name;

        if (confirm(`确定要删除网站 "${siteName}" 吗？`)) {
            this.sitesData[categoryIndex].sites.splice(siteIndex, 1);

            // 重新渲染站点列表
            this.renderSitesList(categoryIndex);

            // 更新JSON编辑器
            this.updateJsonEditor();

            this.showMessage(`网站已删除`, 'success');
        }
    },

    // 检查管理员状态
    async checkAdminStatus() {
        const token = localStorage.getItem('api_token');

        if (!token) {
            this.isAdmin = false;
            return;
        }

        try {
            // 实际验证令牌的有效性
            const result = await SitesManager.verifyToken(token);
            this.isAdmin = result.success;

            // 如果令牌无效，清除它
            if (!result.success) {
                SitesManager.logout();
            }
        } catch (error) {
            console.error('验证管理员状态时出错:', error);
            this.isAdmin = false;
            SitesManager.logout();
        }
    },

    // 显示错误信息
    showError(message) {
        const editError = document.getElementById('edit-error');
        if (editError) {
            editError.textContent = message;
            editError.classList.remove('d-none');
        }
    },

    // 隐藏所有错误消息
    hideErrorMessages() {
        const errorElements = document.querySelectorAll('.alert-danger');
        errorElements.forEach(element => {
            element.classList.add('d-none');
            element.textContent = '';
        });
    },

    // 显示提示消息
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
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
    },

    // 渲染分类列表
    renderCategoriesList() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        if (this.sitesData.length === 0) {
            categoriesList.innerHTML = '<div class="alert alert-info">没有分类，请添加一个新分类。</div>';
            return;
        }

        this.sitesData.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            categoryItem.dataset.index = index;
            categoryItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="drag-handle me-2" title="拖动排序">
                        <i class="bi bi-grip-vertical"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">${category.name}</h5>
                        <small class="text-muted">${category.sites.length} 个网站</small>
                    </div>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-category-btn" data-index="${index}">
                        <i class="bi bi-pencil"></i> 编辑
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-category-btn" data-index="${index}">
                        <i class="bi bi-trash"></i> 删除
                    </button>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
        });

        // 添加编辑和删除按钮事件监听器
        const editButtons = categoriesList.querySelectorAll('.edit-category-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.editCategory(index);
            });
        });

        const deleteButtons = categoriesList.querySelectorAll('.delete-category-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.deleteCategory(index);
            });
        });
    },

    // 填充分类选择下拉框
    populateCategorySelect() {
        const categorySelect = document.getElementById('category-select');
        if (!categorySelect) return;

        // 清空当前选项
        categorySelect.innerHTML = '';

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 请选择分类 --';
        categorySelect.appendChild(defaultOption);

        // 添加分类选项
        this.sitesData.forEach((category, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // 重置当前选择的分类和站点
        this.currentCategoryIndex = -1;
        this.currentSiteIndex = -1;

        // 处理分类选择变化
        this.handleCategorySelect();
    },

    // 渲染站点列表
    renderSitesList(categoryIndex) {
        const sitesList = document.getElementById('sites-list');
        if (!sitesList) return;

        sitesList.innerHTML = '';

        if (categoryIndex < 0 || categoryIndex >= this.sitesData.length) {
            return;
        }

        const category = this.sitesData[categoryIndex];

        if (category.sites.length === 0) {
            sitesList.innerHTML = '<div class="alert alert-info">该分类下没有网站，请添加一个新网站。</div>';
            return;
        }

        category.sites.forEach((site, index) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            siteItem.dataset.siteIndex = index;

            // 生成图标HTML
            let iconHtml = '';
            if (site.icon) {
                // 使用用户提供的图标
                iconHtml = `<img src="${site.icon}" alt="${site.name}" class="me-2" style="width: 24px; height: 24px;">`;
            } else {
                // 生成默认图标 - 使用网站首字母或图标
                const firstLetter = site.name.charAt(0).toUpperCase();
                const iconColors = [
                    '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
                    '#4895ef', '#560bad', '#f15bb5', '#fee440', '#00bbf9',
                    '#00f5d4', '#e63946', '#588157', '#ff9e00', '#8338ec'
                ];
                // 根据站点名称生成随机但固定的颜色
                const colorIndex = site.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % iconColors.length;
                const bgColor = iconColors[colorIndex];

                // 判断是否使用图标或字母
                let iconContent = '';
                if (site.name.includes('购物') || site.name.includes('商城')) {
                    iconContent = '<i class="bi bi-cart"></i>';
                } else if (site.name.includes('视频') || site.name.includes('电影') || site.name.includes('影视')) {
                    iconContent = '<i class="bi bi-film"></i>';
                } else if (site.name.includes('音乐')) {
                    iconContent = '<i class="bi bi-music-note"></i>';
                } else if (site.name.includes('游戏')) {
                    iconContent = '<i class="bi bi-controller"></i>';
                } else if (site.name.includes('学习') || site.name.includes('教育')) {
                    iconContent = '<i class="bi bi-book"></i>';
                } else if (site.name.includes('工具')) {
                    iconContent = '<i class="bi bi-tools"></i>';
                } else if (site.name.includes('社交') || site.name.includes('社区')) {
                    iconContent = '<i class="bi bi-people"></i>';
                } else if (site.name.includes('新闻') || site.name.includes('资讯')) {
                    iconContent = '<i class="bi bi-newspaper"></i>';
                } else if (site.name.includes('开发') || site.name.includes('编程')) {
                    iconContent = '<i class="bi bi-code-square"></i>';
                } else {
                    // 使用首字母
                    iconContent = firstLetter;
                }

                // 创建自定义图标
                iconHtml = `<div class="default-site-icon me-2" style="background-color: ${bgColor}; width: 24px; height: 24px; font-size: 14px;">${iconContent}</div>`;
            }

            siteItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="drag-handle me-2" title="拖动排序">
                        <i class="bi bi-grip-vertical"></i>
                    </div>
                    ${iconHtml}
                    <div>
                        <h5 class="mb-1">${site.name}</h5>
                        <small class="text-muted">
                            <a href="${site.url}" target="_blank">${site.url}</a>
                        </small>
                    </div>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-site-btn"
                        data-category-index="${categoryIndex}" data-site-index="${index}">
                        <i class="bi bi-pencil"></i> 编辑
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-site-btn"
                        data-category-index="${categoryIndex}" data-site-index="${index}">
                        <i class="bi bi-trash"></i> 删除
                    </button>
                </div>
            `;
            sitesList.appendChild(siteItem);
        });

        // 添加编辑和删除按钮事件监听器
        const editButtons = sitesList.querySelectorAll('.edit-site-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryIndex = parseInt(e.currentTarget.dataset.categoryIndex);
                const siteIndex = parseInt(e.currentTarget.dataset.siteIndex);
                this.editSite(categoryIndex, siteIndex);
            });
        });

        const deleteButtons = sitesList.querySelectorAll('.delete-site-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryIndex = parseInt(e.currentTarget.dataset.categoryIndex);
                const siteIndex = parseInt(e.currentTarget.dataset.siteIndex);
                this.deleteSite(categoryIndex, siteIndex);
            });
        });
    },

    // 更新日期和时间组件
    updateDateTimeWidgets() {
        this.updateDateTime();
        this.updateQuote();
    },

    // 更新时间和日期
    updateDateTime() {
        const dateDisplay = document.getElementById('date-display');
        const dayDisplay = document.getElementById('day-display');
        const timeDisplay = document.getElementById('time-display');

        if (!dateDisplay || !dayDisplay || !timeDisplay) return;

        // 获取当前日期和时间
        const now = new Date();

        // 格式化日期: 2025年4月9日
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('zh-CN', dateOptions);

        // 星期几
        const dayOptions = { weekday: 'long' };
        dayDisplay.textContent = now.toLocaleDateString('zh-CN', dayOptions);

        // 更新时间: 09:44:05
        timeDisplay.textContent = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    },

    // 更新每日一言
    updateQuote() {
        // 这里可以实现从API获取每日一言，或使用预定义的名言列表
        // 目前使用静态内容，可以后续扩展
    },

    // 启动时间更新间隔
    startTimeInterval() {
        // 每秒更新一次时间
        setInterval(() => this.updateDateTime(), 1000);
    },

    // 渲染分类导航
    renderCategoryNav() {
        const navContainer = document.getElementById('nav-categories');
        if (!navContainer || !this.sitesData || this.sitesData.length === 0) return;

        // 获取已有的分类ID，避免重复添加
        const existingCategoryIds = Array.from(navContainer.querySelectorAll('.nav-category-item'))
            .map(item => item.dataset.categoryId);

        // 保留"全部"导航项和基本分类，只添加尚未在HTML中定义的分类
        this.sitesData.forEach(category => {
            // 如果此分类ID已存在于HTML中，则跳过
            if (existingCategoryIds.includes(category.id)) {
                return;
            }

            const navItem = document.createElement('div');
            navItem.className = 'nav-category-item';
            navItem.dataset.categoryId = category.id;

            // 根据分类名称选择图标
            let icon = 'bi-bookmark';
            if (category.name.includes('工具')) icon = 'bi-tools';
            else if (category.name.includes('学习') || category.name.includes('教育')) icon = 'bi-book';
            else if (category.name.includes('社交')) icon = 'bi-people';
            else if (category.name.includes('娱乐')) icon = 'bi-film';
            else if (category.name.includes('设计')) icon = 'bi-brush';

            navItem.innerHTML = `<i class="bi ${icon}"></i> ${category.name}`;
            navItem.addEventListener('click', () => this.filterByCategory(category.id));
            navContainer.appendChild(navItem);
        });

        // 为所有导航项（包括HTML中预设的）添加点击事件
        navContainer.querySelectorAll('.nav-category-item').forEach(item => {
            // 移除可能的重复事件监听器
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);

            // 添加新的事件监听器
            newItem.addEventListener('click', () => {
                this.filterByCategory(newItem.dataset.categoryId);
            });
        });
    },

    // 按分类筛选站点
    filterByCategory(categoryId) {
        // 更新导航项激活状态
        const navItems = document.querySelectorAll('.nav-category-item');
        navItems.forEach(item => {
            if (item.dataset.categoryId === categoryId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 显示全部或筛选特定分类
        if (categoryId === 'all') {
            this.renderSites();
        } else {
            // 找到对应分类
            const category = this.sitesData.find(cat => cat.id === categoryId);
            if (!category) return;

            // 只渲染该分类的站点
            this.renderFilteredSites(category);
        }
    },

    // 渲染筛选后的站点
    renderFilteredSites(category) {
        const container = document.getElementById('sites-container');
        if (!container) return;

        // 清空容器（保留加载指示器）
        const loadingElem = document.getElementById('loading');
        container.innerHTML = '';
        if (loadingElem) {
            container.appendChild(loadingElem);
            loadingElem.classList.add('d-none'); // 隐藏加载指示器
        }

        // 渲染单个分类
        const categoryHtml = `
            <div class="col-12 mb-3">
                <h2 class="category-title">${category.name}</h2>
                <div class="row g-3">
                    ${category.sites.map(site => this.renderSiteCard(site)).join('')}
                </div>
            </div>
        `;
        container.innerHTML = categoryHtml;
    },

    // 初始化分类表单相关事件
    initCategoryForm() {
        // 绑定添加分类按钮事件
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showCategoryForm('add');
            });
        }

        // 绑定分类表单提交事件
        const saveCategoryBtn = document.getElementById('save-category-btn');
        if (saveCategoryBtn) {
            saveCategoryBtn.addEventListener('click', () => {
                this.saveCategoryForm();
            });
        }

        // 绑定取消分类表单事件
        const cancelCategoryBtn = document.getElementById('cancel-category-btn');
        if (cancelCategoryBtn) {
            cancelCategoryBtn.addEventListener('click', () => {
                this.hideCategoryForm();
            });
        }

        // 选项卡切换事件
        const categoryTab = document.getElementById('category-tab');
        if (categoryTab) {
            categoryTab.addEventListener('click', () => {
                this.hideErrorMessages();
                this.renderCategoriesList();
            });
        }
    },

    // 初始化站点表单相关事件
    initSiteForm() {
        // 绑定分类选择事件
        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.handleCategorySelect();
            });
        }

        // 绑定添加站点按钮事件
        const addSiteBtn = document.getElementById('add-site-btn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', () => {
                this.showSiteForm('add');
            });
        }

        // 绑定站点表单提交事件
        const saveSiteBtn = document.getElementById('save-site-btn');
        if (saveSiteBtn) {
            saveSiteBtn.addEventListener('click', () => {
                this.saveSiteForm();
            });
        }

        // 绑定取消站点表单事件
        const cancelSiteBtn = document.getElementById('cancel-site-btn');
        if (cancelSiteBtn) {
            cancelSiteBtn.addEventListener('click', () => {
                this.hideSiteForm();
            });
        }

        // 选项卡切换事件
        const siteTab = document.getElementById('site-tab');
        if (siteTab) {
            siteTab.addEventListener('click', () => {
                this.hideErrorMessages();
                this.populateCategorySelect();
            });
        }
    },

    // 初始化JSON编辑器相关事件
    initJsonEditor() {
        // 选项卡切换事件
        const jsonTab = document.getElementById('json-tab');
        if (jsonTab) {
            jsonTab.addEventListener('click', () => {
                this.hideErrorMessages();
                this.updateJsonEditor();
            });
        }
    },

    // 初始化保存按钮事件
    initSaveSitesButton() {
        const saveBtn = document.getElementById('save-sites-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.handleSaveSites();
            });
        }
    },

    // 重新排序分类（主页面拖放后）
    reorderCategories(newOrder) {
        // 创建一个新的数组来存储重新排序后的分类
        const reorderedCategories = [];

        // 根据新的顺序重新排列分类
        newOrder.forEach(categoryId => {
            const category = this.sitesData.find(cat => cat.id === categoryId);
            if (category) {
                reorderedCategories.push(category);
            }
        });

        // 更新数据
        this.sitesData = reorderedCategories;
    },

    // 重新排序站点（主页面拖放后）
    reorderSites(categoryId, newOrder) {
        // 找到对应的分类
        const categoryIndex = this.sitesData.findIndex(cat => cat.id === categoryId);
        if (categoryIndex < 0) return;

        // 创建一个新的数组来存储重新排序后的站点
        const reorderedSites = [];

        // 根据新的顺序重新排列站点
        newOrder.forEach(siteId => {
            const site = this.sitesData[categoryIndex].sites.find(site => site.id === siteId);
            if (site) {
                reorderedSites.push(site);
            }
        });

        // 更新数据
        this.sitesData[categoryIndex].sites = reorderedSites;
    },

    // 重新排序分类（编辑模态框中）
    reorderCategoriesInModal(newOrder) {
        // 创建一个新的数组来存储重新排序后的分类
        const reorderedCategories = [];

        // 根据新的顺序重新排列分类
        newOrder.forEach(index => {
            if (index >= 0 && index < this.sitesData.length) {
                reorderedCategories.push(this.sitesData[index]);
            }
        });

        // 更新数据
        this.sitesData = reorderedCategories;

        // 重新渲染分类列表
        this.renderCategoriesList();
    },

    // 重新排序站点（编辑模态框中）
    reorderSitesInModal(categoryIndex, newOrder) {
        if (categoryIndex < 0 || categoryIndex >= this.sitesData.length) return;

        // 创建一个新的数组来存储重新排序后的站点
        const reorderedSites = [];

        // 根据新的顺序重新排列站点
        newOrder.forEach(index => {
            if (index >= 0 && index < this.sitesData[categoryIndex].sites.length) {
                reorderedSites.push(this.sitesData[categoryIndex].sites[index]);
            }
        });

        // 更新数据
        this.sitesData[categoryIndex].sites = reorderedSites;

        // 重新渲染站点列表
        this.renderSitesList(categoryIndex);
    },
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
    await loadHitokotoQuote(); // 在App初始化后加载一言

    // 触发自定义事件，通知其他脚本App已初始化完成
    document.dispatchEvent(new CustomEvent('app:initialized'));
});