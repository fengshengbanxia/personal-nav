# 个人导航站 (Personal Navigation)

基于 Cloudflare Pages + Workers 和 KV 存储的个人导航站点。让您可以轻松创建和管理自己的网址导航页面。

## 项目结构

```
personal-nav/
├── index.html          # 主页面
├── css/
│   └── styles.css      # 样式文件
├── js/
│   ├── main.js         # 主要应用逻辑
│   ├── sites.js        # 站点数据管理
│   └── theme.js        # 主题切换功能
├── assets/             # 静态资源目录
└── worker/
    └── index.js        # Cloudflare Worker 脚本（处理 API 和 KV 存储）
```

## 功能特点

- 🌙 明暗主题切换
- 🔍 实时搜索过滤
- 📱 完全响应式设计
- 🔒 管理员认证系统
- ⚡ 基于 Cloudflare 的高速加载
- 🗄️ 使用 KV 存储管理数据
- 🔧 支持分类和自定义图标

## 简化部署方案

### 1. Cloudflare Pages 部署

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 创建一个新的 Pages 项目
2. 连接您的 GitHub 仓库或直接上传此项目目录
3. 使用以下构建设置：
   - 框架预设: `None`
   - 构建命令: 留空
   - 构建输出目录: 留空 (默认为根目录)
4. 部署完成后，记下您的 Pages URL (例如 `https://your-project.pages.dev`)

### 2. Cloudflare Worker 部署

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 创建两个 KV 命名空间:
   - `KV_SITES`: 用于存储网站链接数据
   - `KV_CONFIG`: 用于存储配置和 API 令牌

2. 创建一个新的 Worker：
   - 复制 `worker/index.js` 的内容
   - 在 Worker 设置中绑定 KV 命名空间：
     - 变量名: `KV_SITES`, 命名空间: 选择刚创建的 `KV_SITES`
     - 变量名: `KV_CONFIG`, 命名空间: 选择刚创建的 `KV_CONFIG`

3. 初始化API令牌
  - 部署Worker后，访问以下URL来设置您的API令牌（请替换为您自己的Worker域名和所需的令牌）：
  - https://[您的Worker域名]/api/init-token?token=YOUR_SECURE_TOKEN

  - 使用令牌登录
现在，当您访问网站并点击"管理员入口"时，输入您刚刚设置的令牌。如果一切正常，您应该能够成功登录并管理您的站点数据。

4. 移除临时端点（重要！）
一旦您成功设置了API令牌并确认可以登录，请从Worker代码中删除临时的init-token端点以确保安全。这个端点只应使用一次。

安全注意事项
为您的API令牌选择一个强密码（复杂且难以猜测）
设置令牌后，请记得从代码中删除临时端点
如果您需要更改令牌，可以通过Cloudflare Dashboard的KV存储界面手动更新

5. 在 `KV_CONFIG` 命名空间添加一个管理员令牌：
   - 键名: `api_token`
   - 值: 您的自定义 API 令牌 (保持机密性和复杂性)

### 3. 设置 Worker 路由

1. 在 Cloudflare Pages 项目设置中找到 "Functions" 选项卡
2. 在 "Routes" 部分添加一个新路由：
   - 路由: `/api/*`
   - Worker: 选择您刚创建的 Worker

访问密码或其他设置。默认的访问密码设置为"navigation2025"，您可以在access-verify.js文件中修改这个值。
## 自定义数据格式

站点数据格式示例：

```json
[
  {
    "id": "category-id",
    "name": "分类名称",
    "sites": [
      {
        "id": "site-id",
        "name": "网站名称",
        "url": "https://example.com",
        "desc": "网站描述",
        "icon": "图标URL"
      }
    ]
  }
]
```
从Worker代码中删除临时的init-token端点以确保安全，第63行
```
 // 临时端点：初始化API令牌 - 部署后用一次，然后移除此代码
    else if (apiPath === 'init-token') {
      const url = new URL(request.url);
      const tokenParam = url.searchParams.get('token');
      
      if (!tokenParam) {
        return jsonResponse({ error: '未提供令牌' }, corsHeaders, 400);
      }
      
      try {
        // 设置API令牌
        await KV_CONFIG.put('api_token', tokenParam);
        return jsonResponse({ 
          success: true, 
          message: 'API令牌已成功初始化，请保存这个令牌用于后续管理操作',
          token: tokenParam
        }, corsHeaders);
      } catch (e) {
        return jsonResponse({ error: '设置API令牌失败' }, corsHeaders, 500);
      }
    }
```
## 许可证

MIT
