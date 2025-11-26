"use client"

import { useState, useEffect } from "react"
import Header from "../components/Header"
import MemberCard from "../components/MemberCard"
import MemberForm from "../components/MemberForm"
import RelationshipForm from "../components/RelationshipForm"
import { memberAPI, relationshipAPI, authAPI } from "../utils/api"
import { getUser } from "../utils/auth"

export default function Dashboard({ onLogout }) {
  const user = getUser()
  const isAdmin = user?.role === "admin"
  const [members, setMembers] = useState([])
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [showViewerForm, setShowViewerForm] = useState(false)
  const [viewerFormData, setViewerFormData] = useState({ username: "", password: "" })
  const [viewerError, setViewerError] = useState("")
  const [viewerSuccess, setViewerSuccess] = useState("")
  const [editingMember, setEditingMember] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadMembers()
    loadRelationships()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await memberAPI.getAll()
      setMembers(response.data)
      setError("")
    } catch (err) {
      setError("Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const loadRelationships = async () => {
    try {
      const response = await relationshipAPI.getAll()
      setRelationships(response.data)
    } catch (err) {
      console.log("Failed to load relationships")
    }
  }

  const handleAddMember = async (formData) => {
    try {
      setLoading(true)
      await memberAPI.create(formData)
      await loadMembers()
      setShowMemberForm(false)
      setError("")
    } catch (err) {
      setError("Failed to add member")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async (formData) => {
    try {
      setLoading(true)
      await memberAPI.update(editingMember._id, formData)
      await loadMembers()
      setEditingMember(null)
      setShowMemberForm(false)
      setError("")
    } catch (err) {
      setError("Failed to update member")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        setLoading(true)
        await memberAPI.delete(memberId)
        await loadMembers()
        setError("")
      } catch (err) {
        setError("Failed to delete member")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCreateRelationship = async (formData) => {
    try {
      setLoading(true)
      await relationshipAPI.create(formData)
      await loadRelationships()
      setShowRelationshipForm(false)
      setError("")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create relationship")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateViewer = async (e) => {
    e.preventDefault()
    setViewerError("")
    setViewerSuccess("")

    if (!viewerFormData.username || !viewerFormData.password) {
      setViewerError("Username and password required")
      return
    }

    try {
      await authAPI.createViewer(viewerFormData.username, viewerFormData.password)
      setViewerSuccess(`Viewer account "${viewerFormData.username}" created successfully!`)
      setViewerFormData({ username: "", password: "" })
      setTimeout(() => {
        setShowViewerForm(false)
        setViewerSuccess("")
      }, 2000)
    } catch (err) {
      setViewerError(err.response?.data?.message || "Failed to create viewer")
    }
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
    setShowMemberForm(true)
  }

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={onLogout} />

      <main className="container py-8">
        {/* Info Section */}
        <div className="mb-8 card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user?.username}!</h2>
          <p className="opacity-90">
            {isAdmin
              ? "You have full access to manage all family members and relationships."
              : "You can view all family members and their details."}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {isAdmin && showViewerForm && (
          <div className="mb-8 card bg-white border-l-4 border-green-600">
            <h3 className="text-xl font-bold mb-4">Create Viewer Account</h3>
            <form onSubmit={handleCreateViewer} className="space-y-4">
              {viewerError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{viewerError}</div>
              )}
              {viewerSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                  {viewerSuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username for Viewer</label>
                <input
                  type="text"
                  value={viewerFormData.username}
                  onChange={(e) => setViewerFormData({ ...viewerFormData, username: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter viewer username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password for Viewer</label>
                <input
                  type="password"
                  value={viewerFormData.password}
                  onChange={(e) => setViewerFormData({ ...viewerFormData, password: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter viewer password"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  Create Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewerForm(false)}
                  className="btn bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Forms */}
        {showMemberForm && (
          <div className="mb-8 card bg-white border-l-4 border-blue-600">
            <h3 className="text-xl font-bold mb-4">{editingMember ? "Edit Member" : "Add New Member"}</h3>
            <MemberForm
              initialData={editingMember}
              onSubmit={editingMember ? handleUpdateMember : handleAddMember}
              onCancel={() => {
                setShowMemberForm(false)
                setEditingMember(null)
              }}
              isLoading={loading}
            />
          </div>
        )}

        {showRelationshipForm && (
          <div className="mb-8 card bg-white border-l-4 border-purple-600">
            <h3 className="text-xl font-bold mb-4">Create Relationship</h3>
            <RelationshipForm
              members={members}
              onSubmit={handleCreateRelationship}
              onCancel={() => setShowRelationshipForm(false)}
              isLoading={loading}
            />
          </div>
        )}

        {/* Controls */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-xs">
            <input
              type="text"
              placeholder="Search family members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full"
            />
          </div>
          {isAdmin && (
            <>
              <button onClick={() => setShowMemberForm(true)} className="btn btn-primary">
                + Add Member
              </button>
              <button onClick={() => setShowRelationshipForm(true)} className="btn btn-secondary">
                + Create Relationship
              </button>
              <button
                onClick={() => setShowViewerForm(true)}
                className="btn bg-green-600 text-white hover:bg-green-700"
              >
                + Create Viewer
              </button>
            </>
          )}
        </div>

        {/* Members Grid */}
        {loading && members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No members found</p>
            {isAdmin && (
              <button onClick={() => setShowMemberForm(true)} className="mt-4 btn btn-primary">
                Add the first member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                onDelete={isAdmin ? handleDeleteMember : null}
                onEdit={isAdmin ? handleEditMember : null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
