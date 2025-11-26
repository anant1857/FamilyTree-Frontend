"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Header from "../components/Header"
import { memberAPI, relationshipAPI } from "../utils/api"

export default function MemberView({ onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadMemberData()
  }, [id])

  const loadMemberData = async () => {
    try {
      setLoading(true)
      const memberResponse = await memberAPI.getById(id)
      setMember(memberResponse.data)

      const relResponse = await relationshipAPI.getByMember(id)
      setRelationships(relResponse.data)
      setError("")
    } catch (err) {
      setError("Failed to load member details")
    } finally {
      setLoading(false)
    }
  }

  const getRelatedMembers = () => {
    return relationships.map((rel) => {
      const relatedMember = rel.member1Id._id === id ? rel.member2Id : rel.member1Id
      return {
        member: relatedMember,
        relationshipType:
          rel.member1Id._id === id ? rel.relationshipType : getOppositeRelationship(rel.relationshipType),
      }
    })
  }

  const getOppositeRelationship = (type) => {
    const opposites = {
      parent: "child",
      child: "parent",
      spouse: "spouse",
      sibling: "sibling",
    }
    return opposites[type] || type
  }

  const relatedMembers = getRelatedMembers()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLogout={onLogout} />
        <div className="container py-8">
          <p className="text-center text-gray-500">Loading member details...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLogout={onLogout} />
        <div className="container py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={onLogout} />

      <main className="container py-8">
        <button onClick={() => navigate(-1)} className="btn btn-secondary mb-6">
          ← Go Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Member Profile */}
          <div className="md:col-span-1">
            <div className="card">
              <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                {member.photo ? (
                  <img
                    src={member.photo || "/placeholder.svg"}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-6xl font-bold">{member.name.charAt(0).toUpperCase()}</div>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">{member.name}</h1>

              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-gray-600 font-medium">Gender</p>
                  <p className="text-gray-800 capitalize">{member.gender}</p>
                </div>

                {member.birthDate && (
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-gray-600 font-medium">Born</p>
                    <p className="text-gray-800">{new Date(member.birthDate).toLocaleDateString()}</p>
                  </div>
                )}

                {member.deathDate && (
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-gray-600 font-medium">Died</p>
                    <p className="text-gray-800">{new Date(member.deathDate).toLocaleDateString()}</p>
                  </div>
                )}

                {member.occupation && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-gray-600 font-medium">Occupation</p>
                    <p className="text-gray-800">{member.occupation}</p>
                  </div>
                )}

                {member.generation >= 0 && (
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-gray-600 font-medium">Generation</p>
                    <p className="text-gray-800">Level {member.generation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Member Details */}
          <div className="md:col-span-2 space-y-6">
            {member.bio && (
              <div className="card">
                <h2 className="text-xl font-bold mb-3 text-gray-800">Biography</h2>
                <p className="text-gray-700 leading-relaxed">{member.bio}</p>
              </div>
            )}

            {member.contactInfo && (member.contactInfo.email || member.contactInfo.phone) && (
              <div className="card">
                <h2 className="text-xl font-bold mb-3 text-gray-800">Contact Information</h2>
                <div className="space-y-2">
                  {member.contactInfo.email && (
                    <a href={`mailto:${member.contactInfo.email}`} className="text-blue-600 hover:underline">
                      📧 {member.contactInfo.email}
                    </a>
                  )}
                  {member.contactInfo.phone && (
                    <a href={`tel:${member.contactInfo.phone}`} className="text-blue-600 hover:underline block">
                      📞 {member.contactInfo.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {relatedMembers.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Family Relationships</h2>
                <div className="space-y-3">
                  {relatedMembers.map((rel, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="text-sm text-gray-600 capitalize">{rel.relationshipType}</p>
                        <p className="font-medium text-gray-800">{rel.member.name}</p>
                      </div>
                      <button onClick={() => navigate(`/member/${rel.member._id}`)} className="btn btn-primary text-sm">
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
