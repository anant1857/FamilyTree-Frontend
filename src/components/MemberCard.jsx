"use client"
import { Link } from "react-router-dom"
import { getUser } from "../utils/auth"

export default function MemberCard({ member, onDelete, onEdit }) {
  const user = getUser()
  const isAdmin = user?.role === "admin"

  return (
    /* Updated card with dark theme and enhanced styling */
    <div className="card hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group border border-slate-700 hover:border-blue-500/50">
      <div className="flex flex-col h-full">
        <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg overflow-hidden mb-4 flex items-center justify-center group-hover:shadow-lg transition">
          {member.photo ? (
            <img src={member.photo || "/placeholder.svg"} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-white text-4xl font-bold">{member.name.charAt(0).toUpperCase()}</div>
          )}
        </div>

        <h3 className="font-bold text-lg text-blue-100 mb-3">{member.name}</h3>

        <div className="text-sm text-slate-400 space-y-2 mb-4 flex-grow">
          {member.gender && (
            <p>
              <span className="font-medium text-slate-300">Gender:</span>{" "}
              <span className="capitalize">{member.gender}</span>
            </p>
          )}
          {member.occupation && (
            <p>
              <span className="font-medium text-slate-300">Occupation:</span> {member.occupation}
            </p>
          )}
          {member.birthDate && (
            <p>
              <span className="font-medium text-slate-300">Born:</span> {new Date(member.birthDate).getFullYear()}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Link to={`/member/${member._id}`} className="flex-1 btn btn-primary text-center text-sm">
            View
          </Link>
          {isAdmin && (
            <>
              <button onClick={() => onEdit(member)} className="btn btn-secondary text-sm">
                Edit
              </button>
              <button onClick={() => onDelete(member._id)} className="btn btn-danger text-sm">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
