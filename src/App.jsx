"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import MemberView from "./pages/MemberView"
import TreeView from "./pages/TreeView"
import ProtectedRoute from "./components/ProtectedRoute"
import { getAuthToken } from "./utils/auth"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken())

  useEffect(() => {
    const token = getAuthToken()
    setIsAuthenticated(!!token)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/:id"
          element={
            <ProtectedRoute>
              <MemberView onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tree"
          element={
            <ProtectedRoute>
              <TreeView onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}
