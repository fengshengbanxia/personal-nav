# 个人导航站 (Personal Navigation)

基于 Cloudflare Pages + Workers 和 KV 存储的个人导航站点。让您可以轻松创建和管理自己的网址导航页面。

## 项目结构

```
personal-nav/
├── index.html          # 主页面
├── css/
│   ├── styles.css      # 主要样式文件
│   ├── theme-dropdown.css # 主题下拉菜单样式
│   └── cards-per-row.css  # 卡片布局样式
├── js/
│   ├── main.js         # 主要应用逻辑
│   ├── sites.js        # 站点数据管理
│   ├── theme.js        # 主题切换功能
│   ├── settings.js     # 用户设置管理
│   ├── access-verify.js # 访问验证功能
│   ├── category-icons.js # 分类图标管理
│   ├── sortable-init.js  # 拖放排序功能
│   └── quick-edit.js     # 快速编辑功能
├── assets/             # 静态资源目录
└── worker/
    └── index.js        # Cloudflare Worker 脚本（处理 API 和 KV 存储）
```

## 功能特点

- 🎨 **多主题支持**：浅色、深色和紫色主题可选
- 🔍 **实时搜索过滤**：快速查找您需要的站点
- 📱 **完全响应式设计**：在任何设备上都有良好体验
- 🔒 **访问验证系统**：保护您的导航站不被未授权访问
- 👤 **管理员认证系统**：安全管理您的站点数据
- ⚡ **基于 Cloudflare 的高速加载**：全球 CDN 加速
- 🗄️ **使用 KV 存储管理数据**：无需数据库的轻量级存储
- 🔧 **分类和自定义图标**：组织和美化您的导航链接
- 🖱️ **拖放排序**：直观地重新排列分类和站点
- ✏️ **站点卡片快速编辑**：直接在卡片上编辑站点信息
- ➕ **分类内快速添加**：在特定分类中快速添加新站点
- 📊 **自定义布局**：调整每行显示的卡片数量（2-6个）
- 🎯 **智能默认图标**：为没有设置图标的站点自动生成美观的默认图标
- 🔄 **每日一言**：显示随机名言警句
- 📅 **日期和时间显示**：实时显示当前日期和时间

## 部署方案

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
   - `https://[您的Worker域名]/api/init-token?token=YOUR_SECURE_TOKEN`

4. 使用令牌登录
   - 现在，当您访问网站并点击"管理员入口"时，输入您刚刚设置的令牌。如果一切正常，您应该能够成功登录并管理您的站点数据。

5. 移除临时端点（重要！）
   - 一旦您成功设置了API令牌并确认可以登录，请从Worker代码中删除临时的init-token端点以确保安全。这个端点只应使用一次。
   - 需要删除的代码段在worker/index.js中，大约在第63-125行：

```javascript
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

### 3. 设置 Worker 路由

1. 在 Cloudflare Pages 项目设置中找到 "Functions" 选项卡
2. 在 "Routes" 部分添加一个新路由：
   - 路由: `/api/*`
   - Worker: 选择您刚创建的 Worker

## 自定义设置

### 访问验证设置

导航站支持访问验证功能，需要输入正确的密码才能访问。默认密码为 "navigation2025"。

修改访问密码：
1. 打开 `js/access-verify.js` 文件
2. 找到 `accessPassword` 变量并修改其值：
```javascript
accessPassword: 'your-new-password',
```

### 主题设置

导航站支持三种主题：浅色、深色和紫色。用户可以通过点击顶部的主题切换按钮来选择主题。

自定义主题颜色：
1. 打开 `css/styles.css` 文件
2. 修改 `:root`、`.dark-theme` 或 `.purple-theme` 中的颜色变量

### 布局设置

用户可以自定义每行显示的卡片数量（2-6个）。这个设置会被保存在浏览器的 localStorage 中。

修改默认布局：
1. 打开 `js/settings.js` 文件
2. 修改 `defaultSettings` 对象中的 `cardsPerRow` 值：
```javascript
defaultSettings: {
    cardsPerRow: 3 // 修改为您想要的默认值（2-6）
},
```

## 数据格式

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

## 安全注意事项

- 为您的API令牌选择一个强密码（复杂且难以猜测）
- 设置令牌后，请记得从代码中删除临时端点
- 如果您需要更改令牌，可以通过Cloudflare Dashboard的KV存储界面手动更新
- 定期更改访问密码，特别是在公开环境中使用时

## 高级功能说明

### 拖放排序

管理员可以通过拖放来重新排序分类和站点：
- 拖动分类标题可以重新排序分类
- 拖动站点卡片可以重新排序站点
- 排序后会出现一个"保存排序"按钮，点击即可保存更改

### 快速编辑

管理员可以直接在站点卡片上编辑站点信息：
- 点击卡片右上角的编辑图标或底部的"编辑"按钮
- 在弹出的模态框中修改站点信息
- 点击"保存更改"按钮保存修改

### 快速添加站点

管理员可以直接在分类中添加新站点：
- 点击分类标题旁的"添加站点"按钮
- 在弹出的模态框中填写站点信息
- 点击"添加站点"按钮保存新站点

### 默认图标生成

当站点没有设置图标URL时，系统会自动生成默认图标：
- 根据站点名称选择合适的图标类型（如购物、视频、音乐等）
- 如果无法匹配，则使用站点名称的首字母
- 图标的背景颜色根据站点名称生成，确保同一站点始终使用相同的颜色

## 许可证

MIT
