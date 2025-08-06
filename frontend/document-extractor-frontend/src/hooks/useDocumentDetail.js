import { useEffect, useState } from 'react'
import axios from 'axios'

export function useDocumentDetail(documentId) {
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`/api/documents/${documentId}/`)
        setDocument(response.data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    if (documentId) fetchDetail()
  }, [documentId])

  return { document, loading, error }
}
