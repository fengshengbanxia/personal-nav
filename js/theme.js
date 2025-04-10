document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = themeToggle.querySelector('i');

    // 创建主题选择下拉菜单
    createThemeDropdown();

    // 应用保存的主题或默认主题
    const applyTheme = (theme) => {
        // 移除所有主题类
        body.classList.remove('dark-theme', 'purple-theme');

        // 根据选择的主题设置类和图标
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeIcon.className = 'bi bi-moon-stars';
        } else if (theme === 'purple') {
            body.classList.add('purple-theme');
            themeIcon.className = 'bi bi-palette';
        } else {
            // 默认浅色主题
            themeIcon.className = 'bi bi-sun';
        }

        localStorage.setItem('theme', theme);
    };

    // 初始化主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // 切换主题按钮事件 - 现在打开下拉菜单
    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止点击事件传播到document
        const dropdown = document.getElementById('theme-dropdown');
        dropdown.classList.toggle('show');
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('theme-dropdown');
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });

    // 创建主题选择下拉菜单
    function createThemeDropdown() {
        // 创建下拉菜单容器
        const dropdown = document.createElement('div');
        dropdown.id = 'theme-dropdown';
        dropdown.className = 'theme-dropdown';

        // 添加主题选项
        dropdown.innerHTML = `
            <div class="theme-option" data-theme="light">
                <i class="bi bi-sun"></i> 浅色主题
            </div>
            <div class="theme-option" data-theme="dark">
                <i class="bi bi-moon-stars"></i> 深色主题
            </div>
            <div class="theme-option" data-theme="purple">
                <i class="bi bi-palette"></i> 紫色主题
            </div>
        `;

        // 将下拉菜单添加到页面
        document.querySelector('.theme-toggle-container').appendChild(dropdown);

        // 为主题选项添加点击事件
        dropdown.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止事件冒泡
                const theme = option.dataset.theme;
                applyTheme(theme);
                dropdown.classList.remove('show');
            });
        });
    }
});