import { useEffect, useRef, useState } from "react"
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"
import api from "../api/api"
import "../styles/join-group.css"
import { texts } from "../i18n/texts"

export default function JoinGroup(){

  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const lang = localStorage.getItem("lang") || "bg"
  const t = texts[lang] || texts.bg

  const token = params.get("token")

  const hasFetchedRef = useRef(false)
  const hasJoinedRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)

  const [autoRedirect, setAutoRedirect] = useState(false)

  function goToGroups(){
    setGroup(null)

    setTimeout(() => {
      navigate("/groups", { replace: true })
    }, 0)
  }

  useEffect(() => {

    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    if (!token) {
      navigate("/", { replace: true })
      return
    }

    const accessToken = localStorage.getItem("access_token")

    if (!accessToken) {
      const fullPath = location.pathname + location.search

      navigate(`/login?redirect=${encodeURIComponent(fullPath)}`, { replace: true })
      return
    }

    async function loadPreview(){
      try{
        setLoading(true)

        const res = await api.get("/invites/preview", {
          params: { token }
        })

        setGroup(res.data.group)
        setError(null)

      }catch(e){
        const err = e.response?.data?.error || "INVALID_TOKEN"
        setError(err)
      }finally{
        setLoading(false)
      }
    }

    loadPreview()

  }, [token, navigate, location])

  async function handleJoin(){

  if (!token || joining || hasJoinedRef.current) return

  try{
    setJoining(true)
    hasJoinedRef.current = true

    await api.post("/invites/accept", { token })

    window.dispatchEvent(new Event("groupsUpdated"))

    // 🔥 ВИНАГИ redirect при success
    setAutoRedirect(true)

  }catch(e){
    console.log("join group error", e)

    const err = e.response?.data?.error || "UNKNOWN"
    setError(err)

    hasJoinedRef.current = false

  }finally{
    setJoining(false)
  }
}

  // 🔥 ако още от preview е member
  useEffect(() => {
    if (!loading && group?.is_member) {
      setAutoRedirect(true)
    }
  }, [loading, group])

  // 🔥 централен auto redirect
  useEffect(() => {
    if (autoRedirect) {
      const timer = setTimeout(() => {
        navigate("/groups", { replace: true })
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [autoRedirect, navigate])

  return (
    <div className="join-group-page">
      <div className="join-group-container">

        {/* 🔄 Loading */}
        {loading && (
          <div className="jg-card jg-loading">
            <div className="jg-skeleton-title" />
            <div className="jg-skeleton-sub" />
            <div className="jg-skeleton-btn" />
          </div>
        )}

        {/* ❌ Error */}
        {!loading && error && (
          <div className="jg-card jg-error">
            <div className="jg-title">
              {t.join_group_error || "Invalid invitation"}
            </div>

            <div className="jg-sub">
              {error === "EXPIRED"
                ? (t.invite_expired || "This invite has expired")
                : (t.invite_invalid || "Invalid invite link")}
            </div>

            <button
              className="jg-btn-primary"
              onClick={goToGroups}
            >
              {t.open_group || "Open group"}
            </button>
          </div>
        )}

        {/* ✅ Preview / Member */}
        {!loading && group && (
          <div className="jg-card jg-enter">

            <div className="jg-group-name">
              {group.name}
            </div>

            <div className="jg-owner">
              {group.owner_name}
            </div>

            <div className="jg-members">
              {group.members_count} {t.members || "members"}
            </div>

            {group?.is_member || autoRedirect ? (
              <>
                <div className="jg-already-member">
                  {t.join_group_already_member || "You are already in this group"}
                </div>

                <button
                  className="jg-btn-primary"
                  onClick={() => navigate("/groups", { replace: true })}
                >
                  {t.open_group || "Open group"}
                </button>
              </>
            ) : (
              <button
                className="jg-btn-primary"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining
                  ? (t.joining || "Joining...")
                  : (t.join_group || "Join group")}
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  )
}