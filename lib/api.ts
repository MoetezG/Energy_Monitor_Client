// API configuration and utilities
import axios, { AxiosInstance, AxiosError } from 'axios';

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
  idEx: string;
  title?: string;
  measureUnits?: string;
  value: number | string | boolean;
  selected?: boolean;
  valueInfo?: {
    ctrlType?: string;
    type?: number;
  };
}

export interface DeviceValues {
  varInfo: {
    var: DeviceVariable[];
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
  meta?: unknown;
  created_at?: string;
}



class ApiClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for SCADA operations
      withCredentials: true, 
    });

    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle axios errors consistently
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: unknown): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.data) {
        const data = axiosError.response.data as { message?: string; error?: string };
        return {
          success: false,
          error: data.message || data.error || 'An error occurred',
        };
      }
      
      if (axiosError.code === 'NETWORK_ERROR' || !axiosError.response) {
        return {
          success: false,
          error: 'Network error',
        };
      }
      
      return {
        success: false,
        error: axiosError.message || 'An error occurred',
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data: Record<string, unknown> | LoginCredentials | Partial<User> | Partial<Device> | unknown[]): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(endpoint, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data: Record<string, unknown> | Partial<User> | Partial<Device>): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(endpoint, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
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

  getVariableList: async (): Promise<ApiResponse<VariableRecord[]>> => {
    return apiClient.get('/variables');
  },


  addVariablesToDatabase: async (
    variables: DeviceVariablePayload[] | DeviceVariablePayload
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/variables', variables as unknown as Record<string, unknown>[]);
  },

  // Update a variable record
  updateVariable: async (
    id: number,
    updates: Partial<VariableRecord>
  ): Promise<ApiResponse<VariableRecord>> => {
    return apiClient.put(`/variables/${id}`, updates as Record<string, unknown>);
  },

  // Delete a variable record
  deleteVariable: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/variables/${id}`);
  },

  // Delete a device and all its variables
  deleteDevice: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/devices/${id}`);
  },

  // Get filtered device variables (SCADA variables not in database)
  getFilteredDeviceVariables: async (deviceIds: string[]): Promise<ApiResponse<{ deviceId: string, variables: DeviceVariable[] }[]>> => {
    try {
      // Get database devices and variables first
      const dbDevicesResponse = await scadaAPI.getDatabaseDevices();
      const dbVariablesResponse = await scadaAPI.getVariableList();
      
      const dbDevices: DatabaseDevice[] = dbDevicesResponse.success && dbDevicesResponse.data ? 
        (Array.isArray(dbDevicesResponse.data) ? dbDevicesResponse.data : [dbDevicesResponse.data]) : [];
      
      const dbVariables: VariableRecord[] = dbVariablesResponse.success && dbVariablesResponse.data ?
        (Array.isArray(dbVariablesResponse.data) ? dbVariablesResponse.data : [dbVariablesResponse.data]) : [];

      // Process each device individually
      const filteredDevices = await Promise.all(deviceIds.map(async (deviceId) => {
        // Get SCADA variables for this specific device
        const scadaResponse = await scadaAPI.getDeviceValues([deviceId]);
      
 
        let scadaVariables: DeviceVariable[] = [];
        if (scadaResponse.success && scadaResponse.data) {
          scadaVariables = scadaResponse.data.varInfo.var || [];
        }
        console.log('SCADA Variables for device', deviceId, ':', scadaVariables);
      
        
        // Find corresponding database device
        const dbDevice = dbDevices.find(d => d.scada_id === deviceId);
        
        if (!dbDevice) {
          // Device not in database, return all variables
          return {
            deviceId,
            variables: scadaVariables
          };
        }

        // Filter out variables that already exist in database
        const filteredVariables = scadaVariables.filter(scadaVar => {
          const existsInDb = dbVariables.some(dbVar => 
            dbVar.device_id === dbDevice.id && dbVar.var_code === scadaVar.idEx
          );
          return !existsInDb;
        });

        return {
          deviceId,
          variables: filteredVariables
        };
      }));

      return {
        success: true,
        data: filteredDevices
      };
    } catch {
      return {
        success: false,
        error: 'Network error while filtering device variables'
      };
    }
  },

};

export default apiClient;