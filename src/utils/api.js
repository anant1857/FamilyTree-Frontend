import axios from "axios"
import { getAuthToken } from "./auth"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const authAPI = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  getMe: () => api.get("/auth/me"),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  createViewer: (username, password) => api.post("/auth/create-viewer", { username, password }),
}

export const memberAPI = {
  getAll: () => api.get("/members"),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post("/members", data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
}

export const relationshipAPI = {
  getAll: () => api.get("/relationships"),
  getByMember: (memberId) => api.get(`/relationships/member/${memberId}`),
  create: (data) => api.post("/relationships", data),
  delete: (id) => api.delete(`/relationships/${id}`),
}

export default api
