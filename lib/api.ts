// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  lastUpdate?: string;
}

export interface EnergyData {
  id: string;
  deviceId: string;
  timestamp: string;
  consumption: number;
  voltage: number;
  current: number;
  power: number;
}

export interface EnergyStatistics {
  totalEnergy: number;
  activeDevices: number;
  avgTemperature: number;
  avgHumidity: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to parse response',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch {
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async post<T>(endpoint: string, data: Record<string, unknown> | LoginCredentials | Partial<User> | Partial<Device>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch {
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async put<T>(endpoint: string, data: Record<string, unknown> | Partial<User> | Partial<Device>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch {
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch {
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Specific API methods
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    return apiClient.post('/auth/login', credentials);
  },
  
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout', {});
    apiClient.setToken(null);
    return response;
  },
  
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    return apiClient.post('/auth/refresh', {});
  },
};




export default apiClient;