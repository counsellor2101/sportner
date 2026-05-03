import { createContext, useContext, useEffect, useState } from "react"
import api from "../api/api"

const MetaContext = createContext()

export function MetaProvider({ children }) {
  const [sports, setSports] = useState([])
  const [cities, setCities] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/meta")

        setSports(res.data.sports || [])
        setCities(res.data.cities || [])
        setVenues(res.data.venues || [])
      } catch (e) {
        console.log("meta error", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <MetaContext.Provider value={{ sports, cities, venues, loading }}>
      {children}
    </MetaContext.Provider>
  )
}

export function useMeta() {
  return useContext(MetaContext)
}