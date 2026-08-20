import { auth } from '../lib/firebase';
import { apiManager } from '../services/apiManager';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  
  const headers = new Headers(options.headers || {});
  
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Tự động gắn Gemini API Key đang kích hoạt vào request
  const activeApi = apiManager.getActiveApi();
  if (activeApi && activeApi.apiKey) {
    headers.set('x-gemini-api-key', activeApi.apiKey);
  }
  
  // Đảm bảo luôn gửi request dưới dạng JSON
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  
  const startTime = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    apiManager.recordUsage(url, false, Date.now() - startTime, netErr.message || 'Lỗi kết nối mạng');
    throw new Error(`Không thể kết nối đến máy chủ: ${netErr.message || 'Lỗi mạng'}`);
  }

  const duration = Date.now() - startTime;

  // KIỂM TRA AN TOÀN: Đảm bảo phản hồi là JSON
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const textError = await response.text();
    console.warn("Phản hồi không phải JSON từ server:", response.status, textError.slice(0, 100));
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: "Cần quyền truy cập hoặc đăng nhập để thực hiện tính năng này." };
    }
    throw new Error(`Máy chủ phản hồi mã lỗi ${response.status}. Vui lòng thử lại sau!`);
  }

  const data = await response.json();
  if (!response.ok || data.success === false) {
    const errorMsg = data.error || "Có lỗi xảy ra khi gọi API.";
    apiManager.handleApiError(errorMsg);
    apiManager.recordUsage(url, false, duration, errorMsg);
    throw new Error(errorMsg);
  }
  
  apiManager.recordUsage(url, true, duration);
  return data;
}