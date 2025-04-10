/**
 * 拖放排序功能初始化
 * 使用SortableJS实现分类和站点的拖放排序
 */

document.addEventListener('DOMContentLoaded', () => {
    // 在App初始化后设置拖放功能
    document.addEventListener('app:initialized', initSortable);
    
    // 监听编辑模态框显示事件，为编辑模式中的列表添加拖放功能
    document.addEventListener('shown.bs.modal', function(event) {
        if (event.target.id === 'editModal') {
            initEditModalSortable();
        }
    });
});

// 初始化主页面的拖放功能
function initSortable() {
    // 只有管理员才能拖放排序
    if (!App.isAdmin) return;
    
    // 为分类容器添加拖放功能
    const sitesContainer = document.getElementById('sites-container');
    if (sitesContainer) {
        new Sortable(sitesContainer, {
            animation: 150,
            handle: '.category-title', // 只能通过标题拖动
            draggable: '.category-section',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                // 更新数据顺序
                const newOrder = Array.from(sitesContainer.querySelectorAll('.category-section'))
                    .map(el => el.dataset.categoryId);
                
                // 重新排序数据
                App.reorderCategories(newOrder);
                
                // 显示提示
                App.showMessage('分类顺序已更新，请点击"编辑站点"按钮保存更改', 'info');
            }
        });
    }
    
    // 为每个分类下的站点行添加拖放功能
    const siteRows = document.querySelectorAll('.sites-row');
    siteRows.forEach(row => {
        new Sortable(row, {
            animation: 150,
            draggable: '.col',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                // 获取分类ID
                const categorySection = evt.target.closest('.category-section');
                const categoryId = categorySection.dataset.categoryId;
                
                // 获取新的站点顺序
                const newOrder = Array.from(evt.target.querySelectorAll('.col'))
                    .map(el => el.dataset.siteId);
                
                // 更新数据顺序
                App.reorderSites(categoryId, newOrder);
                
                // 显示提示
                App.showMessage('站点顺序已更新，请点击"编辑站点"按钮保存更改', 'info');
            }
        });
    });
}

// 初始化编辑模态框中的拖放功能
function initEditModalSortable() {
    // 为分类列表添加拖放功能
    const categoriesList = document.getElementById('categories-list');
    if (categoriesList) {
        new Sortable(categoriesList, {
            animation: 150,
            handle: '.drag-handle', // 只能通过拖动图标拖动
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                // 获取新的分类顺序
                const newOrder = Array.from(categoriesList.querySelectorAll('.list-group-item'))
                    .map(el => parseInt(el.dataset.index));
                
                // 重新排序数据
                App.reorderCategoriesInModal(newOrder);
                
                // 更新JSON编辑器
                App.updateJsonEditor();
            }
        });
    }
    
    // 为站点列表添加拖放功能
    const sitesList = document.getElementById('sites-list');
    if (sitesList) {
        new Sortable(sitesList, {
            animation: 150,
            handle: '.drag-handle', // 只能通过拖动图标拖动
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                // 获取当前选中的分类索引
                const categoryIndex = App.currentCategoryIndex;
                if (categoryIndex < 0) return;
                
                // 获取新的站点顺序
                const newOrder = Array.from(sitesList.querySelectorAll('.list-group-item'))
                    .map(el => parseInt(el.dataset.siteIndex));
                
                // 重新排序数据
                App.reorderSitesInModal(categoryIndex, newOrder);
                
                // 更新JSON编辑器
                App.updateJsonEditor();
            }
        });
    }
}
