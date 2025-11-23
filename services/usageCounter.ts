const API_URL = '/tarkov-optimizer/count';

// Cache to avoid excessive API calls
let cachedCount: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Error logging helper - only log in development or when explicitly needed
const logError = (operation: string, error: unknown, isCritical: boolean = false) => {
  if (process.env.NODE_ENV === 'development' || isCritical) {
    console.error(`[UsageCounter] Error in ${operation}:`, error);
  }
};

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
      // Validate response data
      if (typeof data.count === 'number' && data.count >= 0 && Number.isFinite(data.count)) {
        cachedCount = data.count;
        lastFetchTime = now;
        return cachedCount;
      } else {
        logError('getUsageCount', new Error(`Invalid count value received: ${data.count}`), false);
      }
    } else {
      logError('getUsageCount', new Error(`HTTP ${response.status}: ${response.statusText}`), false);
    }
  } catch (error) {
    logError('getUsageCount', error, false);
    // Return cached value if available, otherwise 0
    // This ensures the app continues to work even if the counter API fails
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
      // Validate response data
      if (typeof data.count === 'number' && data.count >= 0 && Number.isFinite(data.count)) {
        cachedCount = data.count;
        lastFetchTime = Date.now();
        return cachedCount;
      } else {
        logError('incrementUsageCount', new Error(`Invalid count value received: ${data.count}`), false);
      }
    } else {
      logError('incrementUsageCount', new Error(`HTTP ${response.status}: ${response.statusText}`), false);
    }
  } catch (error) {
    logError('incrementUsageCount', error, false);
    // Return cached value if available, otherwise 0
    // This ensures the app continues to work even if the counter API fails
  }
  
  return cachedCount ?? 0;
};
