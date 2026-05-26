import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { retryWithBackoff } from "@NursingPracticer/utils";
import type { 
  IBooking, 
  IService, 
  IUser, 
  BookingStatus 
} from "@NursingPracticer/types";

export interface TokenStorage {
  getAccessToken: () => string | null | Promise<string | null>;
  getRefreshToken: () => string | null | Promise<string | null>;
  setTokens: (accessToken: string, refreshToken: string) => void | Promise<void>;
  clearTokens: () => void | Promise<void>;
}

export class ApiClient {
  private instance: AxiosInstance;
  private tokenStorage: TokenStorage;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseURL: string, tokenStorage: TokenStorage) {
    this.tokenStorage = tokenStorage;
    this.instance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor: Attach Access Token
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.tokenStorage.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error),
    );

    // Response Interceptor: Auto-Refresh Access Token on 401
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config;
        if (!error.response) {
          return Promise.reject(error);
        }

        // Check if error is 401 and request hasn't been retried yet
        if (error.response.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            // Refresh call
            const refreshRes = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
              `${this.instance.defaults.baseURL}/api/v1/users/refresh-token`,
              { refreshToken },
            );

            const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data.data;
            await this.tokenStorage.setTokens(newAccess, newRefresh);

            this.isRefreshing = false;
            this.onTokenRefreshed(newAccess);

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            await this.tokenStorage.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  // Generic Request with Retry Wrapper
  public async request<T>(config: AxiosRequestConfig, retries = 2): Promise<T> {
    const makeCall = () => this.instance.request<T>(config).then((res: AxiosResponse<T>) => res.data);
    return retryWithBackoff(makeCall, retries, 1000, true);
  }

  // --- API Methods ---

  // Authentication
  public async sendOtp(payload: { email: string; phone: string; ToCreateProfile: boolean }) {
    return this.request<any>({
      url: "/api/v1/otps/send",
      method: "POST",
      data: payload,
    });
  }

  public async verifyOtp(payload: { email: string; phone: string; emailOtp: string; phoneOtp: string }) {
    return this.request<{ data: { accessToken: string; refreshToken: string; user: IUser } }>({
      url: "/api/v1/users/register", // or login/verify
      method: "POST",
      data: payload,
    });
  }

  // User & Nurse profile
  public async getProfile() {
    return this.request<{ data: IUser }>({
      url: "/api/v1/users/profile",
      method: "GET",
    });
  }

  public async submitNurseVerification(payload: {
    licenseNumber: string;
    certificateFile: string;
    services: string[];
    location: string;
  }) {
    return this.request<any>({
      url: "/api/v1/users/nurse-verify",
      method: "POST",
      data: payload,
    });
  }

  // Geolocation
  public async updateLocation(payload: { latitude: number; longitude: number; heading?: number }) {
    return this.request<any>({
      url: "/api/v1/users/location",
      method: "PATCH",
      data: payload,
    });
  }

  public async getNearbyNurses(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    serviceId?: string;
  }) {
    return this.request<{ data: any[] }>({
      url: "/api/v1/nurses/nearby",
      method: "GET",
      params,
    });
  }

  // Bookings
  public async createBooking(payload: {
    serviceId: string;
    scheduledTime: string;
    address: string;
    latitude: number;
    longitude: number;
    notes?: string;
  }) {
    return this.request<{ data: IBooking }>({
      url: "/api/v1/bookings/request",
      method: "POST",
      data: payload,
    });
  }

  public async updateBookingStatus(bookingId: string, status: BookingStatus) {
    return this.request<{ data: IBooking }>({
      url: `/api/v1/bookings/${bookingId}/status`,
      method: "PATCH",
      data: { status },
    });
  }

  public async cancelBooking(bookingId: string, reason: string) {
    return this.request<{ data: IBooking }>({
      url: `/api/v1/bookings/${bookingId}/cancel`,
      method: "PATCH",
      data: { reason },
    });
  }

  // Services (Admin CRUD & General queries)
  public async getServices() {
    return this.request<{ data: IService[] }>({
      url: "/api/v1/services",
      method: "GET",
    });
  }

  public async createService(payload: Omit<IService, "_id">) {
    return this.request<{ data: IService }>({
      url: "/api/v1/admin/services",
      method: "POST",
      data: payload,
    });
  }

  // Admin Nurse approvals
  public async getPendingNurses() {
    return this.request<{ data: any[] }>({
      url: "/api/v1/admin/nurses/pending",
      method: "GET",
    });
  }

  public async approveNurse(nurseId: string) {
    return this.request<any>({
      url: `/api/v1/admin/nurses/${nurseId}/approve`,
      method: "PATCH",
    });
  }
}
