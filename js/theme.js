/**
 * 主题切换功能
 * 支持深色/浅色主题切换和自定义背景，并在本地保存主题偏好
 */

// 主题设置
const ThemeManager = {
    // 可用的主题列表
    themes: {
        light: { name: '浅色', icon: 'bi-sun', type: 'light' },
        dark: { name: '深色', icon: 'bi-moon-stars', type: 'dark' },
        custom: { name: '自定义背景', icon: 'bi-image', type: 'custom' }
    },
    
    // 获取当前主题设置
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'light';
    },
    
    // 获取自定义背景图片URL
    getCustomBackground() {
        return localStorage.getItem('customBackground') || '';
    },
    
    // 设置自定义背景
    setCustomBackground(url) {
        if (url) {
            localStorage.setItem('customBackground', url);
            document.documentElement.style.setProperty('--custom-background', `url(${url})`);
            document.body.classList.add('custom-background');
        } else {
            localStorage.removeItem('customBackground');
            document.documentElement.style.removeProperty('--custom-background');
            document.body.classList.remove('custom-background');
        }
    },
    
    // 设置主题
    setTheme(theme) {
        // 移除所有主题类
        document.body.classList.remove('dark-theme', 'custom-theme', 'custom-background');
        
        // 应用主题类
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'custom') {
            document.body.classList.add('custom-theme');
            // 应用自定义背景
            const backgroundUrl = this.getCustomBackground();
            if (backgroundUrl) {
                this.setCustomBackground(backgroundUrl);
            }
            
            // 如果没有背景，打开设置对话框
            if (!backgroundUrl) {
                this.openCustomBackgroundDialog();
            }
        }
        
        // 保存主题设置
        localStorage.setItem('theme', theme);
        
        // 更新主题选择器
        this.updateThemeSelector(theme);
    },
    
    // 切换主题（仅在浅色/深色之间切换）
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        // 只在浅色和深色之间切换
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    },
    
    // 更新主题选择器
    updateThemeSelector(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            const themeInfo = this.themes[theme] || this.themes.light;
            
            icon.className = `bi ${themeInfo.icon}`;
            themeToggle.setAttribute('title', `切换主题`);
        }
        
        // 更新主题下拉菜单（如果存在）
        const themeDropdowns = document.querySelectorAll('.theme-dropdown-item');
        themeDropdowns.forEach(item => {
            const itemTheme = item.dataset.theme;
            if (itemTheme === theme) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    // 打开自定义背景设置对话框
    openCustomBackgroundDialog() {
        const currentBg = this.getCustomBackground();
        const url = prompt('请输入背景图片URL:', currentBg);
        
        if (url !== null) { // 用户点击了确定
            this.setCustomBackground(url);
            
            // 如果URL为空且当前主题是自定义，切换到默认主题
            if (!url && this.getCurrentTheme() === 'custom') {
                this.setTheme('light');
            }
        }
    },
    
    // 创建主题下拉菜单
    createThemeDropdown() {
        const container = document.getElementById('theme-dropdown-container');
        if (!container) return;
        
        const currentTheme = this.getCurrentTheme();
        
        // 创建下拉菜单
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-menu theme-dropdown';
        dropdown.setAttribute('aria-labelledby', 'theme-toggle');
        
        // 添加主题选项
        Object.entries(this.themes).forEach(([key, value]) => {
            const item = document.createElement('a');
            item.className = `dropdown-item theme-dropdown-item ${key === currentTheme ? 'active' : ''}`;
            item.href = '#';
            item.dataset.theme = key;
            item.innerHTML = `<i class="bi ${value.icon} me-2"></i>${value.name}`;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.setTheme(key);
                
                // 关闭下拉菜单
                const dropdownToggle = document.getElementById('theme-toggle');
                if (dropdownToggle) {
                    bootstrap.Dropdown.getInstance(dropdownToggle)?.hide();
                }
            });
            
            dropdown.appendChild(item);
        });
        
        // 添加自定义背景设置选项（仅当选择了自定义主题时）
        if (currentTheme === 'custom') {
            const divider = document.createElement('div');
            divider.className = 'dropdown-divider';
            dropdown.appendChild(divider);
            
            const customBgOption = document.createElement('a');
            customBgOption.className = 'dropdown-item';
            customBgOption.href = '#';
            customBgOption.innerHTML = '<i class="bi bi-gear me-2"></i>设置背景图片';
            customBgOption.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCustomBackgroundDialog();
                
                // 关闭下拉菜单
                const dropdownToggle = document.getElementById('theme-toggle');
                if (dropdownToggle) {
                    bootstrap.Dropdown.getInstance(dropdownToggle)?.hide();
                }
            });
            dropdown.appendChild(customBgOption);
        }
        
        // 添加到容器
        container.appendChild(dropdown);
    },
    
    // 初始化主题
    init() {
        // 检查用户偏好或系统设置
        let theme = this.getCurrentTheme();
        
        // 如果没有保存的主题设置，检查系统偏好
        if (theme === 'auto' || !theme) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
        }
        
        // 应用主题设置
        this.setTheme(theme);
        
        // 创建主题下拉菜单
        this.createThemeDropdown();
        
        // 添加主题切换事件监听器
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // 为主题按钮添加下拉菜单属性
            themeToggle.setAttribute('data-bs-toggle', 'dropdown');
            themeToggle.setAttribute('aria-expanded', 'false');
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (this.getCurrentTheme() === 'auto') {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
};

// 页面加载完成后初始化主题
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});