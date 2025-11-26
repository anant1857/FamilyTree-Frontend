"use client"
import { Link, useNavigate } from "react-router-dom"
import { getUser } from "../utils/auth"

export default function Header({ onLogout }) {
  const navigate = useNavigate()
  const user = getUser()

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container flex justify-between items-center py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">FT</span>
          </div>
          <span className="font-bold text-xl text-gray-800">Family Tree</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">
            Dashboard
          </Link>
          <Link to="/tree" className="text-gray-700 hover:text-blue-600 font-medium transition">
            Tree View
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome</p>
            <p className="font-semibold text-gray-800">{user?.username}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-primary">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
