"use client"

import { useState, useEffect } from "react"
import Header from "../components/Header"
import { memberAPI, relationshipAPI } from "../utils/api"

export default function TreeView({ onLogout }) {
  const [members, setMembers] = useState([])
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedGeneration, setSelectedGeneration] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const membersRes = await memberAPI.getAll()
      const relsRes = await relationshipAPI.getAll()
      setMembers(membersRes.data)
      setRelationships(relsRes.data)
      setError("")
    } catch (err) {
      setError("Failed to load family tree data")
    } finally {
      setLoading(false)
    }
  }

  const groupByGeneration = () => {
    const grouped = {}
    members.forEach((member) => {
      const gen = member.generation || 0
      if (!grouped[gen]) grouped[gen] = []
      grouped[gen].push(member)
    })
    return grouped
  }

  const getGenerationLabel = (gen) => {
    const labels = {
      0: "Generation 0 (Root)",
      1: "Generation 1 (Children)",
      2: "Generation 2 (Grandchildren)",
      3: "Generation 3 (Great-grandchildren)",
      "-1": "Generation -1 (Parents)",
      "-2": "Generation -2 (Grandparents)",
    }
    return labels[gen] || `Generation ${gen}`
  }

  const groupedMembers = groupByGeneration()
  const generations = Object.keys(groupedMembers).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={onLogout} />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Family Tree</h1>
          <p className="text-gray-600">View your complete family structure organized by generation</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading family tree...</p>
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No family members added yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {generations.map((gen) => (
              <div key={gen} className="card">
                <h2 className="text-2xl font-bold mb-6 pb-4 border-b-2 border-blue-600">{getGenerationLabel(gen)}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedMembers[gen].map((member) => (
                    <div
                      key={member._id}
                      className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-lg transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate">{member.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{member.gender}</p>
                          {member.occupation && <p className="text-sm text-gray-600 truncate">{member.occupation}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-sm opacity-90 font-medium">Total Members</p>
            <p className="text-3xl font-bold">{members.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-sm opacity-90 font-medium">Total Relationships</p>
            <p className="text-3xl font-bold">{relationships.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-sm opacity-90 font-medium">Generations</p>
            <p className="text-3xl font-bold">{generations.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <p className="text-sm opacity-90 font-medium">Avg Members/Gen</p>
            <p className="text-3xl font-bold">{(members.length / generations.length).toFixed(1)}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
