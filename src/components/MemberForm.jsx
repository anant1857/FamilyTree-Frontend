"use client"

import { useState } from "react"
import ImageGalleryModal from "./ImageGalleryModal"

export default function MemberForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      gender: "male",
      birthDate: "",
      deathDate: "",
      bio: "",
      occupation: "",
      photo: "",
      contactInfo: { email: "", phone: "" },
      generation: 0,
    },
  )

  const [errors, setErrors] = useState({})
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.gender) newErrors.gender = "Gender is required"
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes("contactInfo.")) {
      const field = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [field]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleImageSelect = (imageUrl) => {
    setFormData((prev) => ({ ...prev, photo: imageUrl }))
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
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? "border-red-500 focus:ring-red-500" : ""}`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`input-field ${errors.gender ? "border-red-500 focus:ring-red-500" : ""}`}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Death Date</label>
            <input
              type="date"
              name="deathDate"
              value={formData.deathDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Engineer, Doctor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generation Level</label>
            <input
              type="number"
              name="generation"
              value={formData.generation}
              onChange={handleChange}
              className="input-field"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo?.email || ""}
              onChange={handleChange}
              className="input-field"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo?.phone || ""}
              onChange={handleChange}
              className="input-field"
              placeholder="+1234567890"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className="input-field resize-none"
            rows="4"
            placeholder="Tell us about this person..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="url"
                name="photo"
                value={formData.photo}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
            >
              Choose from Gallery
            </button>
          </div>
          {formData.photo && (
            <div className="mt-3">
              <img src={formData.photo} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200" />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Member"}
          </button>
        </div>
      </form>

      <ImageGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelectImage={handleImageSelect} />
    </>
  )
}
