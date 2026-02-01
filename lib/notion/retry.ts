export async function retryNotionRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'notionhq_client_response_error' && 
          (error.status === 502 || error.status === 503)) {
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数バックオフ
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}