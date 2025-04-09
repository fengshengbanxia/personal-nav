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
  
  // 处理不需要认证的请求
  if (request.method === 'GET') {
    // 获取所有网站链接 - 公开接口
    if (apiPath === 'sites') {
      try {
        const sites = await KV_SITES.get('sites', { type: 'json' });
        return jsonResponse(sites || [], corsHeaders);
      } catch (e) {
        return jsonResponse({ error: '获取网站数据失败' }, corsHeaders, 500);
      }
    }
    // 验证管理员令牌 - 新的认证端点
    else if (apiPath === 'auth/verify') {
      return await handleTokenVerification(request, corsHeaders);
    }
    // 默认返回404，而不是400
    else {
      return jsonResponse({ 
        success: false, 
        error: '找不到请求的API端点'
      }, corsHeaders, 404);
    }
  } 
  // 需要认证的POST请求
  else if (request.method === 'POST') {
    // 处理认证后才能访问的接口
    if (apiPath === 'sites' || apiPath === 'config') {
      // 验证令牌
      const validationResult = await validateAdminToken(request);
      if (!validationResult.valid) {
        return jsonResponse({ 
          success: false, 
          error: validationResult.error || '未授权访问' 
        }, corsHeaders, 401);
      }
      
      // 通过认证后处理请求
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
    // 初始化管理员令牌 - 仅用于首次设置
    else if (apiPath === 'auth/init') {
      return await handleTokenInitialization(request, corsHeaders);
    }
  }
  
  // 默认处理所有不匹配的请求
  return jsonResponse({ 
    success: false,
    error: '无效的API请求方法或路径',
    path: apiPath,
    method: request.method
  }, corsHeaders, 404);
}

// 处理令牌验证请求
async function handleTokenVerification(request, corsHeaders) {
  try {
    // 从请求头获取API密钥
    const validationResult = await validateAdminToken(request);
    
    if (validationResult.valid) {
      return jsonResponse({ 
        success: true,
        message: '令牌验证成功，与KV存储中的令牌匹配'
      }, corsHeaders);
    } else {
      return jsonResponse({ 
        success: false, 
        error: validationResult.error || '令牌验证失败' 
      }, corsHeaders, 401);
    }
  } catch (e) {
    console.error('令牌验证过程中发生错误:', e);
    return jsonResponse({ 
      success: false, 
      error: '令牌验证过程中发生错误' 
    }, corsHeaders, 500);
  }
}

// 处理令牌初始化请求
async function handleTokenInitialization(request, corsHeaders) {
  try {
    // 检查是否已经设置了令牌
    const existingToken = await KV_CONFIG.get('api_token');
    if (existingToken) {
      return jsonResponse({ 
        success: false, 
        error: '令牌已存在，无法重新初始化。如需重置，请直接编辑KV存储。' 
      }, corsHeaders, 400);
    }
    
    // 解析请求体获取新令牌
    const requestData = await request.json();
    const newToken = requestData.token;
    
    // 验证令牌有效性
    if (!newToken || typeof newToken !== 'string' || newToken.length < 8) {
      return jsonResponse({ 
        success: false, 
        error: '无效的令牌：令牌必须是至少8个字符的字符串' 
      }, corsHeaders, 400);
    }
    
    // 存储新令牌
    await KV_CONFIG.put('api_token', newToken);
    
    return jsonResponse({ 
      success: true, 
      message: '管理员令牌初始化成功'
    }, corsHeaders);
  } catch (e) {
    console.error('初始化令牌过程中发生错误:', e);
    return jsonResponse({ 
      success: false, 
      error: '初始化令牌过程中发生错误' 
    }, corsHeaders, 500);
  }
}

// 验证管理员令牌
async function validateAdminToken(request) {
  try {
    // 从请求头获取API密钥
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        valid: false, 
        error: '未提供认证令牌或格式不正确' 
      };
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // 获取存储的API令牌
    let storedToken;
    
    // 尝试从环境变量获取令牌
    if (typeof API_TOKEN !== 'undefined') {
      // 如果API_TOKEN作为全局变量存在（环境变量方式）
      storedToken = API_TOKEN;
    } else {
      // 从KV获取存储的API令牌
      storedToken = await KV_CONFIG.get('api_token');
    }
    
    // 验证存储的令牌
    if (!storedToken || typeof storedToken !== 'string' || storedToken.length === 0) {
      return { 
        valid: false, 
        error: '管理员令牌未配置或无效' 
      };
    }
    
    // 安全的时间常数比较
    const tokenMatches = token.length === storedToken.length && 
                         token === storedToken;
    
    // 返回验证结果
    return { 
      valid: tokenMatches,
      error: tokenMatches ? null : '令牌不匹配'
    };
  } catch (e) {
    console.error('令牌验证过程中发生错误:', e);
    return { 
      valid: false, 
      error: '令牌验证过程中发生内部错误' 
    };
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