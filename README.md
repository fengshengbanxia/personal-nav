personal-nav/
├── index.html          # 主页面
├── css/
│   └── styles.css      # 样式
├── js/
│   ├── main.js         # 前端逻辑，调用 Worker API
│   ├── sites.js        # 前端渲染（可选）
│   └── theme.js        # 主题切换
├── assets/
│   └── default-icon.png # 默认图标
└── worker/
    └── index.js        # Worker 脚本（KV ）

Pages 部署 index.html 和静态文件。
Worker 部署 worker/index.js，处理数据存储。
