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

export interface ScadaDevice {
  id: string;
  name?: string;
  type?: string;
  status?: 'online' | 'offline';
}

export interface ScadaDeviceList {
  devices: {
    id: string[];
  };
}

export interface DeviceVariable {
  id: string;
  value: number | string | boolean;
  selected?: boolean;
}

export interface DeviceValues {
  values: {
    variable: DeviceVariable[];
  };
}

export interface SelectedDevice {
  id: string;
  name?: string;
  variables: DeviceVariable[];
  selected: boolean;
}

export interface DatabaseDevice {
  id: number;
  scada_id: string;
  name: string;
  meta: string;
  created_at?: string;
}

export interface DeviceVariablePayload {
  device_id: number;
  var_code: string;
  name?: string;
  unit?: string;
  enabled?: boolean;
  meta?: unknown;
}

export interface VariableRecord {
  id: number;
  device_id: number;
  var_code: string;
  name?: string;
  unit?: string;
  enabled?: boolean;
  sample_period_seconds?: number;
  meta?: unknown;
  created_at?: string;
}

export interface VariableRecord {
  id: number;
  device_id: number;
  var_code: string;
  name?: string;
  unit?: string;
  enabled?: boolean;
  meta?: unknown;
  created_at?: string;
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

  async post<T>(endpoint: string, data: Record<string, unknown> | LoginCredentials | Partial<User> | Partial<Device> | unknown[]): Promise<ApiResponse<T>> {
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
    const response = await apiClient.post<{ message: string }>('/logout', {});
    apiClient.setToken(null);
    return response;
  },
  
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    return apiClient.post('/refresh', {});
  },
};

export const scadaAPI = {
  // Get list of available SCADA devices
  getDeviceList: async (): Promise<ApiResponse<ScadaDeviceList>> => {
    return apiClient.get('/scada/device-list');
  },

  // Get values for selected devices
  getDeviceValues: async (deviceIds: string[]): Promise<ApiResponse<DeviceValues>> => {
    const queryParams = deviceIds.map(id => `id=${encodeURIComponent(id)}`).join('?');
    return apiClient.get(`/scada/device-value?${queryParams}`);
  },

  // Add selected devices and their variables to database
  addDevicesToDatabase: async (
    devices: SelectedDevice[] | SelectedDevice
  ): Promise<ApiResponse<{ message: string }>> => {
    // Transform devices to database format
    // NOTE: Do NOT include variables in the device meta. Variables must be persisted
    // separately via the variables endpoint. Meta should contain device-specific details only.
    const normalize = (d: SelectedDevice) => ({
      scada_id: d.id,
      name: d.name || d.id,
      meta: JSON.stringify({ selected: d.selected })
    });

    // Workaround: server controller has a bug where it handles arrays but then
    // also calls the create function with the whole array again. If we POST an
    // array even for a single device, the controller will attempt to create it
    // twice and the second call will fail. To avoid triggering that bug, send
    // a single object when adding a single device.
    if (Array.isArray(devices)) {
      const deviceData = devices.map(normalize);
      if (deviceData.length === 1) {
        return apiClient.post('/devices', deviceData[0] as Record<string, unknown>);
      }
      return apiClient.post('/devices', deviceData as unknown as Record<string, unknown>[]);
    }

    const single = normalize(devices as SelectedDevice);
    return apiClient.post('/devices', single as Record<string, unknown>);
  },
  // Get devices stored in the database (returns DB devices with numeric ids)
  getDatabaseDevices: async (): Promise<ApiResponse<DatabaseDevice[]>> => {
    return apiClient.get('/devices');
  },

  // Get a variable by device id and var_code (uses server route GET /variables/:device_id?var_code=...)
  // (VariableRecord type declared at top-level)

  getVariableByDeviceAndCode: async (deviceId: number, varCode: string): Promise<ApiResponse<VariableRecord | null>> => {
    const qp = `?var_code=${encodeURIComponent(varCode)}`;
    return apiClient.get(`/variables/${deviceId}${qp}`);
  },

  // Get all variables from DB
  getVariableList: async (): Promise<ApiResponse<VariableRecord[]>> => {
    return apiClient.get('/variables');
  },

  // Add variables to the database. Accepts either single variable or an array.
  addVariablesToDatabase: async (
    variables: DeviceVariablePayload[] | DeviceVariablePayload
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/variables', variables as unknown as Record<string, unknown>[]);
  },
};



 
export default apiClient;