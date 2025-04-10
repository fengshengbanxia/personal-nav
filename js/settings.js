/**
 * 设置功能
 * 处理用户界面设置，如每行卡片数量等
 */

// 设置管理器
const SettingsManager = {
    // 默认设置
    defaultSettings: {
        cardsPerRow: 4 // 默认每行4个卡片
    },
    
    // 设置存储键名
    settingsKey: 'nav_display_settings',
    
    // 初始化
    init() {
        // 加载设置
        this.loadSettings();
        
        // 设置按钮点击事件
        const settingsToggle = document.getElementById('settings-toggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => this.openSettingsModal());
        }
        
        // 保存设置按钮点击事件
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // 应用设置
        this.applySettings();
    },
    
    // 加载设置
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(this.settingsKey);
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            } else {
                this.settings = { ...this.defaultSettings };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            this.settings = { ...this.defaultSettings };
        }
    },
    
    // 保存设置
    saveSettings() {
        try {
            // 获取每行卡片数量设置
            const cardsPerRowValue = document.querySelector('input[name="cardsPerRow"]:checked').value;
            this.settings.cardsPerRow = parseInt(cardsPerRowValue);
            
            // 保存到本地存储
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
            
            // 应用设置
            this.applySettings();
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (modal) {
                modal.hide();
            }
            
            // 显示成功消息
            App.showMessage('设置已保存', 'success');
        } catch (error) {
            console.error('保存设置失败:', error);
            App.showError('保存设置失败，请稍后再试');
        }
    },
    
    // 打开设置模态框
    openSettingsModal() {
        // 设置当前值
        const cardsPerRowRadio = document.getElementById(`cardsPerRow${this.settings.cardsPerRow}`);
        if (cardsPerRowRadio) {
            cardsPerRowRadio.checked = true;
        }
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    },
    
    // 应用设置
    applySettings() {
        this.applyCardsPerRow();
    },
    
    // 应用每行卡片数量设置
    applyCardsPerRow() {
        const cardsPerRow = this.settings.cardsPerRow;
        
        // 移除可能存在的行类
        document.documentElement.classList.remove('cards-per-row-2', 'cards-per-row-3', 'cards-per-row-4', 'cards-per-row-5', 'cards-per-row-6');
        
        // 添加新的行类
        document.documentElement.classList.add(`cards-per-row-${cardsPerRow}`);
        
        // 更新站点行的类
        this.updateSitesRowClasses(cardsPerRow);
    },
    
    // 更新站点行的类
    updateSitesRowClasses(cardsPerRow) {
        const siteRows = document.querySelectorAll('.sites-row');
        siteRows.forEach(row => {
            // 移除现有的列类
            row.classList.remove('row-cols-lg-2', 'row-cols-lg-3', 'row-cols-lg-4', 'row-cols-lg-5', 'row-cols-lg-6');
            
            // 添加新的列类
            row.classList.add(`row-cols-lg-${cardsPerRow}`);
        });
    }
};

// 页面加载完成后初始化设置
document.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();
});
