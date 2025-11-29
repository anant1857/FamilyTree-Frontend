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
    /* Updated header with dark theme styling */
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-2xl sticky top-0 z-10 border-b border-slate-700">
      <div className=" flex justify-between  py-4">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">FT</span>
          </div>
          <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Family Tree
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link to="/dashboard" className="text-slate-300 hover:text-blue-400 font-medium transition duration-200">
            Dashboard
          </Link>
          <Link to="/tree" className="text-slate-300 hover:text-blue-400 font-medium transition duration-200">
            Tree View
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 font-medium">Welcome</p>
            <p className="font-semibold text-blue-400">{user?.username}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-primary text-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
