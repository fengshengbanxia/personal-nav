/**
 * 分类图标增强功能
 * 为不同分类提供多样化的图标
 */

document.addEventListener('DOMContentLoaded', () => {
    // 在App初始化后设置分类图标
    document.addEventListener('app:initialized', enhanceCategoryIcons);
});

// 增强分类图标
function enhanceCategoryIcons() {
    // 为分类准备多样化图标
    const icons = [
        'bi-briefcase',       // 工作相关
        'bi-book',           // 学习教育
        'bi-people',         // 社交媒体
        'bi-code-square',    // 开发编程
        'bi-film',           // 娱乐影视
        'bi-brush',          // 设计创意
        'bi-cart',           // 购物商城
        'bi-newspaper',       // 新闻资讯
        'bi-music-note-beamed', // 音乐
        'bi-camera',         // 摄影图片
        'bi-bank',           // 金融理财
        'bi-heart',          // 生活健康
        'bi-globe',          // 国际网站
        'bi-controller',     // 游戏
        'bi-cloud',          // 云服务
        'bi-tools',          // 工具
        'bi-cup-hot',        // 饮食美食
        'bi-airplane',       // 旅行
        'bi-house',          // 家居
        'bi-stars',          // 收藏特色
        'bi-bookmark-star'   // 书签收藏
    ];
    
    // 获取所有分类导航项
    const navItems = document.querySelectorAll('.nav-category-item');
    
    // 跳过"全部"分类
    const categoryItems = Array.from(navItems).filter(item => item.dataset.categoryId !== 'all');
    
    // 为每个分类设置不同的图标
    categoryItems.forEach((item, index) => {
        const categoryName = item.textContent.trim();
        let icon = '';
        
        // 先尝试根据分类名称匹配图标
        if (categoryName.includes('工具')) icon = 'bi-tools';
        else if (categoryName.includes('学习') || categoryName.includes('教育')) icon = 'bi-book';
        else if (categoryName.includes('社交')) icon = 'bi-people';
        else if (categoryName.includes('娱乐')) icon = 'bi-film';
        else if (categoryName.includes('设计')) icon = 'bi-brush';
        else if (categoryName.includes('购物') || categoryName.includes('商城')) icon = 'bi-cart';
        else if (categoryName.includes('新闻') || categoryName.includes('资讯')) icon = 'bi-newspaper';
        else if (categoryName.includes('音乐')) icon = 'bi-music-note-beamed';
        else if (categoryName.includes('图片') || categoryName.includes('摄影')) icon = 'bi-camera';
        else if (categoryName.includes('金融') || categoryName.includes('理财')) icon = 'bi-bank';
        else if (categoryName.includes('生活') || categoryName.includes('健康')) icon = 'bi-heart';
        else if (categoryName.includes('游戏')) icon = 'bi-controller';
        else if (categoryName.includes('云') || categoryName.includes('服务')) icon = 'bi-cloud';
        else if (categoryName.includes('饮食') || categoryName.includes('美食')) icon = 'bi-cup-hot';
        else if (categoryName.includes('旅行') || categoryName.includes('旅游')) icon = 'bi-airplane';
        else if (categoryName.includes('家居')) icon = 'bi-house';
        else if (categoryName.includes('收藏') || categoryName.includes('特色')) icon = 'bi-stars';
        else if (categoryName.includes('开发') || categoryName.includes('编程')) icon = 'bi-code-square';
        else if (categoryName.includes('工作')) icon = 'bi-briefcase';
        
        // 如果没有匹配到，则使用随机图标，但确保同一分类始终使用相同图标
        if (!icon) {
            // 使用分类索引来选择图标，确保图标不重复
            const iconIndex = index % icons.length;
            icon = icons[iconIndex];
        }
        
        // 替换图标
        const iconElement = item.querySelector('i');
        if (iconElement) {
            iconElement.className = `bi ${icon}`;
        }
    });
}
