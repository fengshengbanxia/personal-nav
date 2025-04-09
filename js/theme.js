/**
 * 主题切换功能
 * 支持浅色/深色主题切换，并在本地保存主题偏好
 */

// 主题设置
const ThemeManager = {
    // 获取当前主题设置
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'light';
    },
    
    // 设置主题
    setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            this.updateThemeIcon('dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            this.updateThemeIcon('light');
        }
    },
    
    // 切换主题
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    },
    
    // 更新主题切换按钮图标
    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (theme === 'dark') {
                icon.className = 'bi bi-sun';
                themeToggle.setAttribute('title', '切换到浅色主题');
            } else {
                icon.className = 'bi bi-moon-stars';
                themeToggle.setAttribute('title', '切换到深色主题');
            }
        }
    },
    
    // 初始化主题
    init() {
        // 检查用户偏好或系统设置
        let theme = this.getCurrentTheme();
        
        // 如果没有保存的主题设置，检查系统偏好
        if (theme === 'auto' || !theme) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDarkMode ? 'dark' : 'light';
        }
        
        // 应用主题设置
        this.setTheme(theme);
        
        // 添加主题切换事件监听器
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
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