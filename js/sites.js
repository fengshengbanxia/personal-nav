/**
 * 站点数据和API相关功能
 * 负责获取、处理和更新导航站点数据
 */

// 站点数据管理
const SitesManager = {
    // API基础URL - 始终使用相对路径，让Pages Functions处理路由
    apiBaseUrl: '/api',
    
    // 存储API令牌
    token: '',
    
    // 初始化
    init() {
        // 获取保存的API令牌（如果有）
        this.token = localStorage.getItem('api_token') || '';
        
        // 不再使用模拟数据，统一使用真实API
        this.useMockData = false;
    },
    
    // 获取站点数据
    async getSites() {
        try {
            // 判断是否为本地开发模式
            if (this.useMockData) {
                // 本地开发模式，返回示例数据
                return this.getMockSites();
            }
            
            // 从API获取站点数据
            const response = await fetch(`${this.apiBaseUrl}/sites`);
            
            if (!response.ok) {
                throw new Error(`API响应错误: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取站点数据失败:', error);
            // 发生错误时返回示例数据
            return this.getMockSites();
        }
    },
    
    // 获取示例站点数据
    getMockSites() {
        return [
            {
                id: 'tools',
                name: '实用工具',
                sites: [
                    {
                        id: 'github',
                        name: 'GitHub',
                        url: 'https://github.com',
                        desc: '全球最大的开源代码托管平台',
                        icon: 'https://github.githubassets.com/favicons/favicon.svg'
                    },
                    {
                        id: 'cloudflare',
                        name: 'Cloudflare',
                        url: 'https://dash.cloudflare.com',
                        desc: 'Cloudflare控制台',
                        icon: 'https://www.cloudflare.com/favicon.ico'
                    }
                ]
            },
            {
                id: 'social',
                name: '社交媒体',
                sites: [
                    {
                        id: 'twitter',
                        name: 'Twitter',
                        url: 'https://twitter.com',
                        desc: '全球知名社交媒体平台',
                        icon: 'https://abs.twimg.com/responsive-web/web/icon-default.604e2486a34a2f6e1.png'
                    },
                    {
                        id: 'weibo',
                        name: '微博',
                        url: 'https://weibo.com',
                        desc: '中国最大的社交媒体平台之一',
                        icon: 'https://weibo.com/favicon.ico'
                    }
                ]
            },
            {
                id: 'dev',
                name: '开发资源',
                sites: [
                    {
                        id: 'mdn',
                        name: 'MDN Web文档',
                        url: 'https://developer.mozilla.org',
                        desc: '最全面的Web开发文档',
                        icon: 'https://developer.mozilla.org/favicon-48x48.cbbd161b.png'
                    },
                    {
                        id: 'stackoverflow',
                        name: 'Stack Overflow',
                        url: 'https://stackoverflow.com',
                        desc: '全球最大的程序员问答社区',
                        icon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico'
                    }
                ]
            }
        ];
    },
    
    // 更新站点数据（需要身份验证）
    async updateSites(sitesData) {
        if (!this.token) {
            throw new Error('需要API令牌');
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(sitesData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API响应错误(${response.status}): ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('更新站点数据失败:', error);
            throw error;
        }
    },
    
    // 验证API令牌
    async verifyToken(token) {
        try {
            // 使用新的专用验证端点
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // 解析响应JSON
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('解析验证响应失败:', parseError);
                return { success: false, error: '无法解析服务器响应' };
            }
            
            // 检查响应状态和内容
            if (response.ok) {
                // 只有当服务器明确报告成功时才保存令牌
                if (data && data.success === true) {
                    // 保存有效的令牌
                    this.token = token;
                    localStorage.setItem('api_token', token);
                    return { success: true, message: data.message || '验证成功' };
                } else {
                    // 服务器响应OK但返回了错误
                    console.error('服务器返回了成功状态码但验证失败:', data);
                    return { 
                        success: false, 
                        error: (data && data.error) ? data.error : '验证失败' 
                    };
                }
            } else {
                // 处理非2xx响应码
                const errorMsg = data && data.error ? data.error : 
                    response.status === 401 ? '无效的API令牌' : '验证失败';
                console.error(`验证失败 (${response.status}):`, errorMsg);
                return { 
                    success: false, 
                    error: errorMsg
                };
            }
        } catch (error) {
            console.error('验证令牌失败:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 清除已保存的令牌
    logout() {
        this.token = '';
        localStorage.removeItem('api_token');
    },
    
    // 初始化管理员令牌 (仅首次使用)
    async initializeToken(newToken) {
        // 验证令牌有效性
        if (!newToken || typeof newToken !== 'string' || newToken.trim().length < 8) {
            return { 
                success: false, 
                error: '无效的令牌：令牌必须是至少8个字符的字符串' 
            };
        }
        
        try {
            // 调用初始化端点
            const response = await fetch(`${this.apiBaseUrl}/auth/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: newToken.trim() })
            });
            
            // 解析响应
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('解析初始化响应失败:', parseError);
                return { success: false, error: '无法解析服务器响应' };
            }
            
            // 检查结果
            if (response.ok && data && data.success) {
                // 初始化成功，保存令牌
                this.token = newToken.trim();
                localStorage.setItem('api_token', this.token);
                return { 
                    success: true, 
                    message: data.message || '管理员令牌初始化成功' 
                };
            } else {
                // 服务器返回了错误
                return { 
                    success: false, 
                    error: (data && data.error) ? data.error : '初始化令牌失败' 
                };
            }
        } catch (error) {
            console.error('初始化令牌失败:', error);
            return { success: false, error: error.message };
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    SitesManager.init();
});