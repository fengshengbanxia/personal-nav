// Cloudflare Worker for personal navigation site
// 此 Worker 只处理 API 请求，静态内容由 Cloudflare Pages 直接提供

// KV Namespace binding name (需要在Cloudflare Workers设置中绑定)
// KV_SITES: 存储网站链接数据
// KV_CONFIG: 存储配置信息

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 设置 CORS 头，允许来自任何源的请求
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 只处理 API 请求，所有其他请求交给 Pages 处理
  if (path.startsWith('/api/')) {
    return await handleApiRequest(request, path, corsHeaders);
  }
  
  // 对于非 API 请求，返回 404，实际上这些请求应该由 Pages 处理
  return new Response('Not Found', { status: 404 });
}

async function handleApiRequest(request, path, corsHeaders) {
  // API路径解析
  const apiPath = path.replace('/api/', '');
  
  // 根据HTTP方法和路径处理不同的API请求
  if (request.method === 'GET') {
    if (apiPath === 'sites') {
      // 获取所有网站链接
      try {
        const sites = await KV_SITES.get('sites', { type: 'json' });
        return jsonResponse(sites || [], corsHeaders);
      } catch (e) {
        return jsonResponse({ error: '获取网站数据失败' }, corsHeaders, 500);
      }
    } 
    else if (apiPath === 'config') {
      // 获取配置信息
      try {
        const config = await KV_CONFIG.get('config', { type: 'json' });
        return jsonResponse(config || {}, corsHeaders);
      } catch (e) {
        return jsonResponse({ error: '获取配置数据失败' }, corsHeaders, 500);
      }
    }
  } 
  else if (request.method === 'POST') {
    // 需要身份验证的POST请求
    if (!await isAuthenticated(request)) {
      return jsonResponse({ error: '未授权访问' }, corsHeaders, 401);
    }
    
    if (apiPath === 'sites') {
      // 更新网站链接
      try {
        const sites = await request.json();
        await KV_SITES.put('sites', JSON.stringify(sites));
        return jsonResponse({ success: true }, corsHeaders);
      } catch (e) {
        return jsonResponse({ error: '更新网站数据失败' }, corsHeaders, 500);
      }
    }
    else if (apiPath === 'config') {
      // 更新配置信息
      try {
        const config = await request.json();
        await KV_CONFIG.put('config', JSON.stringify(config));
        return jsonResponse({ success: true }, corsHeaders);
      } catch (e) {
        return jsonResponse({ error: '更新配置数据失败' }, corsHeaders, 500);
      }
    }
  }
  
  return jsonResponse({ error: '无效的API请求' }, corsHeaders, 400);
}

// 检查请求是否已认证
async function isAuthenticated(request) {
  try {
    // 从请求头获取API密钥
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const storedToken = await KV_CONFIG.get('api_token');
    
    // 验证令牌是否匹配
    return token === storedToken;
  } catch (e) {
    return false;
  }
}

// 返回JSON响应
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      ...corsHeaders
    }
  });
}