/**
 * 快速编辑和添加功能
 * 实现站点卡片的直接编辑和在分类中直接添加站点
 */

document.addEventListener('DOMContentLoaded', () => {
    // 在App初始化后设置快速编辑功能
    document.addEventListener('app:initialized', initQuickEdit);
});

// 初始化快速编辑功能
function initQuickEdit() {
    // 监听站点卡片上的编辑按钮点击事件
    document.addEventListener('click', function(event) {
        // 快速编辑按钮
        if (event.target.closest('.btn-quick-edit') || event.target.closest('.btn-card-edit')) {
            const button = event.target.closest('.btn-quick-edit') || event.target.closest('.btn-card-edit');
            const siteId = button.dataset.siteId;
            openQuickEditModal(siteId);
        }
        
        // 分类中的添加站点按钮
        if (event.target.closest('.btn-add-site')) {
            const button = event.target.closest('.btn-add-site');
            const categoryId = button.dataset.categoryId;
            openQuickAddModal(categoryId);
        }
    });
    
    // 设置快速编辑保存按钮事件
    const quickEditSaveBtn = document.getElementById('quick-edit-save-btn');
    if (quickEditSaveBtn) {
        quickEditSaveBtn.addEventListener('click', saveQuickEdit);
    }
    
    // 设置快速添加保存按钮事件
    const quickAddSaveBtn = document.getElementById('quick-add-save-btn');
    if (quickAddSaveBtn) {
        quickAddSaveBtn.addEventListener('click', saveQuickAdd);
    }
}

// 打开快速编辑模态框
function openQuickEditModal(siteId) {
    // 查找站点数据
    const site = findSiteById(siteId);
    if (!site) {
        App.showError('无法找到站点数据');
        return;
    }
    
    // 填充表单数据
    document.getElementById('quick-edit-site-id').value = site.id;
    document.getElementById('quick-edit-category-id').value = site.categoryId;
    document.getElementById('quick-edit-name').value = site.name;
    document.getElementById('quick-edit-url').value = site.url;
    document.getElementById('quick-edit-icon').value = site.icon || '';
    document.getElementById('quick-edit-desc').value = site.desc || '';
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('quickEditModal'));
    modal.show();
}

// 打开快速添加模态框
function openQuickAddModal(categoryId) {
    // 重置表单
    document.getElementById('quick-add-form').reset();
    
    // 设置分类ID
    document.getElementById('quick-add-category-id').value = categoryId;
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('quickAddModal'));
    modal.show();
}

// 保存快速编辑
async function saveQuickEdit() {
    // 获取表单数据
    const siteId = document.getElementById('quick-edit-site-id').value;
    const categoryId = document.getElementById('quick-edit-category-id').value;
    const name = document.getElementById('quick-edit-name').value.trim();
    const url = document.getElementById('quick-edit-url').value.trim();
    const icon = document.getElementById('quick-edit-icon').value.trim();
    const desc = document.getElementById('quick-edit-desc').value.trim();
    
    // 验证必填字段
    if (!name || !url) {
        App.showError('请填写站点名称和网址');
        return;
    }
    
    // 验证URL格式
    if (!isValidUrl(url)) {
        App.showError('请输入有效的URL格式 (例如: https://example.com)');
        return;
    }
    
    // 查找站点和分类
    const { categoryIndex, siteIndex } = findSiteIndexes(siteId);
    if (categoryIndex < 0 || siteIndex < 0) {
        App.showError('无法找到站点数据');
        return;
    }
    
    // 更新站点数据
    App.sitesData[categoryIndex].sites[siteIndex].name = name;
    App.sitesData[categoryIndex].sites[siteIndex].url = url;
    App.sitesData[categoryIndex].sites[siteIndex].icon = icon || null;
    App.sitesData[categoryIndex].sites[siteIndex].desc = desc || '';
    
    try {
        // 保存更新后的数据
        await SitesManager.saveSites(App.sitesData);
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickEditModal'));
        if (modal) {
            modal.hide();
        }
        
        // 重新渲染站点
        App.renderSites();
        
        // 显示成功消息
        App.showMessage('站点已成功更新', 'success');
    } catch (error) {
        console.error('保存站点失败:', error);
        App.showError('保存站点失败，请稍后再试');
    }
}

// 保存快速添加
async function saveQuickAdd() {
    // 获取表单数据
    const categoryId = document.getElementById('quick-add-category-id').value;
    const name = document.getElementById('quick-add-name').value.trim();
    const url = document.getElementById('quick-add-url').value.trim();
    const icon = document.getElementById('quick-add-icon').value.trim();
    const desc = document.getElementById('quick-add-desc').value.trim();
    
    // 验证必填字段
    if (!name || !url) {
        App.showError('请填写站点名称和网址');
        return;
    }
    
    // 验证URL格式
    if (!isValidUrl(url)) {
        App.showError('请输入有效的URL格式 (例如: https://example.com)');
        return;
    }
    
    // 查找分类
    const categoryIndex = App.sitesData.findIndex(category => category.id === categoryId);
    if (categoryIndex < 0) {
        App.showError('无法找到分类数据');
        return;
    }
    
    // 创建新站点
    const newSite = {
        id: 'site_' + Date.now(),
        name: name,
        url: url,
        icon: icon || null,
        desc: desc || '',
        categoryId: categoryId
    };
    
    // 添加到分类中
    App.sitesData[categoryIndex].sites.push(newSite);
    
    try {
        // 保存更新后的数据
        await SitesManager.saveSites(App.sitesData);
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickAddModal'));
        if (modal) {
            modal.hide();
        }
        
        // 重新渲染站点
        App.renderSites();
        
        // 显示成功消息
        App.showMessage('站点已成功添加', 'success');
    } catch (error) {
        console.error('添加站点失败:', error);
        App.showError('添加站点失败，请稍后再试');
    }
}

// 查找站点数据
function findSiteById(siteId) {
    for (const category of App.sitesData) {
        const site = category.sites.find(site => site.id === siteId);
        if (site) {
            // 添加分类ID以便于后续处理
            site.categoryId = category.id;
            return site;
        }
    }
    return null;
}

// 查找站点索引
function findSiteIndexes(siteId) {
    for (let i = 0; i < App.sitesData.length; i++) {
        const siteIndex = App.sitesData[i].sites.findIndex(site => site.id === siteId);
        if (siteIndex >= 0) {
            return { categoryIndex: i, siteIndex };
        }
    }
    return { categoryIndex: -1, siteIndex: -1 };
}

// 验证URL格式
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}
