"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { getAuthToken } from "../utils/auth"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export default function ImageGalleryModal({ isOpen, onClose, onSelectImage }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchImages()
    }
  }, [isOpen])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      const response = await axios.get(`${API_BASE_URL}/upload/images`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setImages(response.data)
    } catch (error) {
      console.error("Error fetching images:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!previewImage) return

    setUploading(true)
    try {
      const token = getAuthToken()
      const response = await axios.post(
        `${API_BASE_URL}/upload/image`,
        { image: previewImage },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setImages([response.data, ...images])
      setPreviewImage(null)
      alert("Image uploaded successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSelectImage = (imageUrl) => {
    setSelectedImage(imageUrl)
  }

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelectImage(selectedImage)
      onClose()
      setSelectedImage(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Image Gallery</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={uploading}
          >
            ×
          </button>
        </div>

        {/* Upload Section */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              disabled={uploading}
            />
            {previewImage && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            )}
          </div>
          {previewImage && (
            <div className="mt-3">
              <img src={previewImage} alt="Preview" className="h-24 w-24 object-cover rounded-lg border-2 border-indigo-200" />
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading images...</div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">No images uploaded yet. Upload your first image!</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectImage(image.url)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                    selectedImage === image.url ? "border-indigo-600 shadow-lg" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img src={image.url} alt={`Gallery ${index}`} className="w-full h-32 object-cover" />
                  {selectedImage === image.url && (
                    <div className="absolute inset-0 bg-indigo-600 bg-opacity-30 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" disabled={uploading}>
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedImage || uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Select Image
          </button>
        </div>
      </div>
    </div>
  )
}
