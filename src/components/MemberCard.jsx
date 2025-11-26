"use client"
import { Link } from "react-router-dom"
import { getUser } from "../utils/auth"

export default function MemberCard({ member, onDelete, onEdit }) {
  const user = getUser()
  const isAdmin = user?.role === "admin"

  return (
    <div className="card hover:shadow-xl transition-all duration-300 group">
      <div className="flex flex-col h-full">
        <div className="w-full h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
          {member.photo ? (
            <img src={member.photo || "/placeholder.svg"} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-white text-4xl font-bold">{member.name.charAt(0).toUpperCase()}</div>
          )}
        </div>

        <h3 className="font-bold text-lg text-gray-800 mb-1">{member.name}</h3>

        <div className="text-sm text-gray-600 space-y-1 mb-3 flex-grow">
          {member.gender && (
            <p>
              <span className="font-medium">Gender:</span> {member.gender}
            </p>
          )}
          {member.occupation && (
            <p>
              <span className="font-medium">Occupation:</span> {member.occupation}
            </p>
          )}
          {member.birthDate && (
            <p>
              <span className="font-medium">Born:</span> {new Date(member.birthDate).getFullYear()}
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
