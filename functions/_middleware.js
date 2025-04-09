// Cloudflare Pages Function middleware
// 将/api请求转发到Worker

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  
  // 只拦截API请求
  if (url.pathname.startsWith('/api/')) {
    // 读取环境变量中的Worker URL（在Cloudflare Pages的环境变量中设置）
    const workerUrl = env.WORKER_URL || 'https://YOUR_WORKER_SUBDOMAIN.workers.dev';
    
    // 构建完整的Worker URL
    const workerApiUrl = new URL(url.pathname, workerUrl);
    
    // 复制原始请求，并指向Worker
    const workerRequest = new Request(workerApiUrl, request);
    
    // 发送请求到Worker
    return fetch(workerRequest);
  }
  
  // 非API请求，由Pages正常处理
  return next();
}
