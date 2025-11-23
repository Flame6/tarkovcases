const API_URL = '/tarkov-optimizer/count';

// Cache to avoid excessive API calls
let cachedCount: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const getUsageCount = async (forceRefresh: boolean = false): Promise<number> => {
  // Return cached value if still fresh (unless forcing refresh)
  const now = Date.now();
  if (!forceRefresh && cachedCount !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedCount;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      cachedCount = data.count || 0;
      lastFetchTime = now;
      return cachedCount;
    }
  } catch (error) {
    // Silently fail - return cached value if available
  }
  
  return cachedCount ?? 0;
};

export const incrementUsageCount = async (): Promise<number> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      cachedCount = data.count || 0;
      lastFetchTime = Date.now();
      return cachedCount;
    }
  } catch (error) {
    // Silently fail - return cached value
  }
  
  return cachedCount ?? 0;
};
