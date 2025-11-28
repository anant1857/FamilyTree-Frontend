"use client"

import { useState } from "react"

export default function RelationshipForm({ members, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    member1Id: "",
    member2Id: "",
    relationshipType: "parent",
  })

  const [errors, setErrors] = useState({})
  const [helperText, setHelperText] = useState("")

  const validateForm = () => {
    const newErrors = {}
    if (!formData.member1Id) newErrors.member1Id = "First person is required"
    if (!formData.member2Id) newErrors.member2Id = "Second person is required"
    if (!formData.relationshipType) newErrors.relationshipType = "Relationship type is required"
    if (formData.member1Id === formData.member2Id) newErrors.member2Id = "Cannot relate a person to themselves"
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    if (name === "relationshipType") {
      if (value === "parent") {
        setHelperText("If person 1 has a spouse, they will automatically be set as parent too.")
      } else if (value === "child") {
        setHelperText("If person 2 has a spouse, the child will be linked to both parents.")
      } else if (value === "spouse") {
        setHelperText("Spouses will automatically share all children relationships.")
      } else {
        setHelperText("")
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Person *</label>
          <select
            name="member1Id"
            value={formData.member1Id}
            onChange={handleChange}
            className={`input-field ${errors.member1Id ? "border-red-500" : ""}`}
          >
            <option value="">Select a person</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.member1Id && <p className="text-red-500 text-sm mt-1">{errors.member1Id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Second Person *</label>
          <select
            name="member2Id"
            value={formData.member2Id}
            onChange={handleChange}
            className={`input-field ${errors.member2Id ? "border-red-500" : ""}`}
          >
            <option value="">Select a person</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.member2Id && <p className="text-red-500 text-sm mt-1">{errors.member2Id}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type *</label>
        <select
          name="relationshipType"
          value={formData.relationshipType}
          onChange={handleChange}
          className={`input-field ${errors.relationshipType ? "border-red-500" : ""}`}
        >
          <option value="parent">is parent of</option>
          <option value="child">is child of</option>
          <option value="spouse">is spouse of</option>
          <option value="sibling">is sibling of</option>
        </select>
        {errors.relationshipType && <p className="text-red-500 text-sm mt-1">{errors.relationshipType}</p>}
        {helperText && <p className="text-blue-600 text-sm mt-1 italic">{helperText}</p>}
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Relationship"}
        </button>
      </div>
    </form>
  )
}
