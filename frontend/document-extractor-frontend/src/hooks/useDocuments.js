import { useEffect, useState } from 'react'
import axios from 'axios'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/documents/')
      setDocuments(response.data)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  return { documents, loading, error, refresh: fetchDocuments }
}
