"use client"

import { useState, useEffect, useRef } from "react"
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
  const modalRef = useRef(null)

  useEffect(() => {
    loadMemberData()
  }, [id])

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && e.target === modalRef.current) {
        navigate(-1)
      }
    }

    window.addEventListener("click", handleOutsideClick)
    return () => window.removeEventListener("click", handleOutsideClick)
  }, [navigate])

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
    const members = {}

    relationships.forEach((rel) => {
      const relatedMember = rel.member1Id._id === id ? rel.member2Id : rel.member1Id
      const relationshipType =
        rel.member1Id._id === id ? rel.relationshipType : getOppositeRelationship(rel.relationshipType)

      const key = `${relatedMember._id}-${relationshipType}`

      if (!members[key]) {
        members[key] = {
          member: relatedMember,
          relationshipType: relationshipType,
        }
      }
    })

    return Object.values(members)
  }

  const getOppositeRelationship = (type) => {
    const opposites = {
      parent: "child",
      child: "parent",
      spouse: "spouse",
      sibling: "sibling",
      grandparent: "grandchild",
      grandchild: "grandparent",
    }
    return opposites[type] || type
  }

  const groupRelationships = () => {
    const relatedMembers = getRelatedMembers()
    const grouped = {
      parent: [],
      sibling: [],
      spouse: [],
      child: [],
      grandparent: [],
      grandchild: [],
    }

    relatedMembers.forEach((rel) => {
      if (grouped[rel.relationshipType]) {
        grouped[rel.relationshipType].push(rel)
      }
    })

    return grouped
  }

  const groupedRelationships = groupRelationships()
  const relatedMembers = getRelatedMembers()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Header onLogout={onLogout} />
        <div className="container py-8">
          <p className="text-center text-slate-400">Loading member details...</p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Header onLogout={onLogout} />
        <div className="container py-8">
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto"
      onClick={(e) => e.target === modalRef.current && navigate(-1)}
    >
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Header onLogout={onLogout} />

        <main className="container py-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition flex items-center gap-2"
          >
            ← Go Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Member Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                <div className="w-full h-64 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center overflow-hidden">
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

                <div className="p-6">
                  <h1 className="text-3xl font-bold text-white mb-4">{member.name}</h1>

                  <div className="space-y-3">
                    {/* Gender */}
                    <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg">
                      <p className="text-slate-400 text-sm font-medium">Gender</p>
                      <p className="text-slate-100 capitalize font-semibold">{member.gender}</p>
                    </div>

                    {/* Birth Date */}
                    {member.birthDate && (
                      <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg">
                        <p className="text-slate-400 text-sm font-medium">Date of Birth</p>
                        <p className="text-slate-100 font-semibold">
                          {new Date(member.birthDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Death Date */}
                    {member.deathDate && (
                      <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg">
                        <p className="text-slate-400 text-sm font-medium">Date of Death</p>
                        <p className="text-slate-100 font-semibold">
                          {new Date(member.deathDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Occupation */}
                    {member.occupation && (
                      <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg">
                        <p className="text-slate-400 text-sm font-medium">Occupation</p>
                        <p className="text-slate-100 font-semibold">{member.occupation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Biography */}
              {member.bio && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-4">Biography</h2>
                  <p className="text-slate-300 leading-relaxed">{member.bio}</p>
                </div>
              )}

              {/* Contact Information */}
              {member.contactInfo && (member.contactInfo.email || member.contactInfo.phone) && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    {member.contactInfo.email && (
                      <a
                        href={`mailto:${member.contactInfo.email}`}
                        className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <span className="text-xl">✉️</span>
                        {member.contactInfo.email}
                      </a>
                    )}
                    {member.contactInfo.phone && (
                      <a
                        href={`tel:${member.contactInfo.phone}`}
                        className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <span className="text-xl">📞</span>
                        {member.contactInfo.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Family Relationships */}
              {relatedMembers.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6">Family Relationships</h2>

                  <div className="space-y-6">
                    {/* Parents */}
                    {groupedRelationships.parent.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">Parents</h3>
                        <div className="space-y-2">
                          {groupedRelationships.parent.map((rel) => (
                            <div
                              key={rel.member._id}
                              className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition"
                            >
                              <div>
                                <p className="text-slate-100 font-semibold">{rel.member.name}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/member/${rel.member._id}`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Siblings */}
                    {groupedRelationships.sibling.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">Siblings</h3>
                        <div className="space-y-2">
                          {groupedRelationships.sibling.map((rel) => (
                            <div
                              key={rel.member._id}
                              className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition"
                            >
                              <div>
                                <p className="text-slate-100 font-semibold">{rel.member.name}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/member/${rel.member._id}`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spouse */}
                    {groupedRelationships.spouse.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">Spouse</h3>
                        <div className="space-y-2">
                          {groupedRelationships.spouse.map((rel) => (
                            <div
                              key={rel.member._id}
                              className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition"
                            >
                              <div>
                                <p className="text-slate-100 font-semibold">{rel.member.name}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/member/${rel.member._id}`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Children */}
                    {groupedRelationships.child.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">Children</h3>
                        <div className="space-y-2">
                          {groupedRelationships.child.map((rel) => (
                            <div
                              key={rel.member._id}
                              className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition"
                            >
                              <div>
                                <p className="text-slate-100 font-semibold">{rel.member.name}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/member/${rel.member._id}`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grandparents */}
                    {groupedRelationships.grandparent.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">Grandparents</h3>
                        <div className="space-y-2">
                          {groupedRelationships.grandparent.map((rel) => (
                            <div
                              key={rel.member._id}
                              className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition"
                            >
                              <div>
                                <p className="text-slate-100 font-semibold">{rel.member.name}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/member/${rel.member._id}`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grandchildren */}
                    {groupedRelationships.grandchild.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3 capitalize">Grandchildren</h3>
                        <div className="space-y-2">
                          {groupedRelationships.grandchild.map((rel) => (
                            <div
                              key={rel.member._id}
                              className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition"
                            >
                              <div>
                                <p className="text-slate-100 font-semibold">{rel.member.name}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/member/${rel.member._id}`)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
