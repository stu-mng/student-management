"use client"

import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { toast } from 'sonner';

// Type definitions
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ErrorData = {
  error?: string;
  message?: string;
} | string;

// Common API response types
interface ApiResponse<T = unknown> {
  data?: T;
  success?: boolean;
  message?: string;
  error?: string;
}

interface DriveApiResponse {
  success: boolean;
  files?: unknown[];
  file?: {
    name: string;
    mimeType: string;
    size: string;
    webViewLink: string;
  };
  path?: unknown[];
  error?: string;
}

// Error messages mapping for better UX
const ERROR_MESSAGES = {
  400: '請求參數錯誤',
  401: '未授權訪問，請重新登入',
  403: '權限不足，無法執行此操作',
  404: '請求的資源不存在',
  409: '資源衝突，請重新檢查',
  422: '資料驗證失敗',
  429: '請求過於頻繁，請稍後再試',
  500: '伺服器內部錯誤',
  502: '網關錯誤',
  503: '服務暫時無法使用',
  504: '請求超時',
} as const

// Success messages for different HTTP methods
const SUCCESS_MESSAGES = {
  POST: '新增成功',
  PUT: '更新成功',
  PATCH: '修改成功',
  DELETE: '刪除成功',
} as const

// Create axios instance with default config
const api = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add preview role header
api.interceptors.request.use(
  (config) => {
    // Add preview role header if available
    if (typeof window !== 'undefined') {
      try {
        const previewRole = localStorage.getItem('rolePreviewName')
        if (previewRole) {
          config.headers['x-preview-role'] = previewRole
        }
      } catch (error) {
        console.warn('Failed to get preview role from localStorage:', error)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Show success toast for non-GET requests
    const method = response.config.method?.toUpperCase() as HttpMethod
    
    if (method && method in SUCCESS_MESSAGES) {
      // Check if response has a custom success message
      const customMessage = response.data?.message || response.data?.success_message
      const title = SUCCESS_MESSAGES[method as keyof typeof SUCCESS_MESSAGES]
      
      if (customMessage) {
        toast.success(title, { description: customMessage })
      } else {
        toast.success(title)
      }
    }
    
    return response
  },
  (error: AxiosError) => {
    // Extract error details
    const status = error.response?.status
    const errorData = error.response?.data as ErrorData
    
    // Build error message
    let errorMessage = '操作失敗'
    
    if (status && ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES]) {
      errorMessage = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES]
    }
    
    // Use custom error message from server if available
    if (errorData) {
      if (typeof errorData === 'string') {
        errorMessage = errorData
      } else if (errorData.error) {
        errorMessage = errorData.error
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    }
    
    // Special handling for network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = '請求超時，請重試'
      } else if (error.message === 'Network Error') {
        errorMessage = '網路連線錯誤，請檢查網路狀態'
      } else {
        errorMessage = '網路錯誤，請重試'
      }
    }
    
    // Show error toast with title and description
    const title = status && ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES] 
      ? ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES] 
      : '操作失敗'
    
    if (errorMessage !== title) {
      toast.error(title, { description: errorMessage })
    } else {
      toast.error(title)
    }
    
    // Console error for debugging
    console.error('API Error:', {
      status,
      url: error.config?.url,
      method: error.config?.method,
      message: errorMessage,
      originalError: error,
    })
    
    return Promise.reject(error)
  }
)

// Utility functions for common HTTP methods with better type safety
export const apiClient = {
  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    api.get<T>(url, config),

  // POST request  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    api.post<T>(url, data, config),

  // PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    api.put<T>(url, data, config),

  // PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    api.patch<T>(url, data, config),

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    api.delete<T>(url, config),
}

// Silent variants (without toast notifications)
export const apiClientSilent = {
  // GET request without toast
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => {
    const axiosInstance = axios.create({
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: api.defaults.headers,
    })
    
    // Add preview role header
    axiosInstance.interceptors.request.use((requestConfig) => {
      if (typeof window !== 'undefined') {
        try {
          const previewRole = localStorage.getItem('rolePreviewName')
          if (previewRole) {
            requestConfig.headers['x-preview-role'] = previewRole
          }
        } catch (error) {
          console.warn('Failed to get preview role from localStorage:', error)
        }
      }
      return requestConfig
    })
    
    return axiosInstance.get<T>(url, config)
  },

  // POST request without toast
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const axiosInstance = axios.create({
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: api.defaults.headers,
    })
    
    axiosInstance.interceptors.request.use((requestConfig) => {
      if (typeof window !== 'undefined') {
        try {
          const previewRole = localStorage.getItem('rolePreviewName')
          if (previewRole) {
            requestConfig.headers['x-preview-role'] = previewRole
          }
        } catch (error) {
          console.warn('Failed to get preview role from localStorage:', error)
        }
      }
      return requestConfig
    })
    
    return axiosInstance.post<T>(url, data, config)
  },

  // PUT request without toast
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const axiosInstance = axios.create({
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: api.defaults.headers,
    })
    
    axiosInstance.interceptors.request.use((requestConfig) => {
      if (typeof window !== 'undefined') {
        try {
          const previewRole = localStorage.getItem('rolePreviewName')
          if (previewRole) {
            requestConfig.headers['x-preview-role'] = previewRole
          }
        } catch (error) {
          console.warn('Failed to get preview role from localStorage:', error)
        }
      }
      return requestConfig
    })
    
    return axiosInstance.put<T>(url, data, config)
  },

  // PATCH request without toast
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const axiosInstance = axios.create({
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: api.defaults.headers,
    })
    
    axiosInstance.interceptors.request.use((requestConfig) => {
      if (typeof window !== 'undefined') {
        try {
          const previewRole = localStorage.getItem('rolePreviewName')
          if (previewRole) {
            requestConfig.headers['x-preview-role'] = previewRole
          }
        } catch (error) {
          console.warn('Failed to get preview role from localStorage:', error)
        }
      }
      return requestConfig
    })
    
    return axiosInstance.patch<T>(url, data, config)
  },

  // DELETE request without toast
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => {
    const axiosInstance = axios.create({
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: api.defaults.headers,
    })
    
    axiosInstance.interceptors.request.use((requestConfig) => {
      if (typeof window !== 'undefined') {
        try {
          const previewRole = localStorage.getItem('rolePreviewName')
          if (previewRole) {
            requestConfig.headers['x-preview-role'] = previewRole
          }
        } catch (error) {
          console.warn('Failed to get preview role from localStorage:', error)
        }
      }
      return requestConfig
    })
    
    return axiosInstance.delete<T>(url, config)
  },
}

// Helper function to handle API responses with consistent data structure
export const handleApiResponse = <T>(response: AxiosResponse<T>) => {
  return response.data
}

// Helper function to handle API errors
export const handleApiError = (error: AxiosError) => {
  if (error.response?.data) {
    throw error.response.data
  }
  throw error
}

// Export common types for use in other files
export type { ApiResponse, DriveApiResponse };

export default api
