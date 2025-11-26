"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authAPI } from "../utils/api"
import { setAuthData } from "../utils/auth"

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authAPI.login(formData.username, formData.password)
      setAuthData(response.data.token, response.data.refreshToken, response.data.user)
      onLogin()
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="w-full max-w-md">
        <div className="card backdrop-blur-md bg-white/95 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">FT</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient">Family Tree</h1>
            <p className="text-gray-600 mt-2">Manage your family history</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="w-full btn btn-primary font-semibold py-3 mt-6" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
