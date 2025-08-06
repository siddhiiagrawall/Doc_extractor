import { useState } from 'react'
import axios from 'axios'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const uploadDocument = async (formData) => {
    setUploading(true)
    setSuccess(false)
    setError(null)
    try {
      const response = await axios.post('/api/documents/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(true)
      return response.data
    } catch (err) {
      setError(err)
    } finally {
      setUploading(false)
    }
  }

  return { uploadDocument, uploading, error, success }
}
