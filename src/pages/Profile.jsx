import AppShell from "../components/AppShell"
import { useEffect, useState } from "react"
import api from "../api/api"
import { useAuth } from "../context/authcontext"
import { texts } from "../i18n/texts"
import { getProfileCompletion } from "../helpers/profile"
import ProfileRow from "../components/ProfileRow"
import "../styles/profile.css"
import ConfirmModal from "../components/ConfirmModal"
import { triggerPushPrompt } from "../push/pushBus"
import ActivityRail from "../components/ActivityRail"


export default function Profile() {

const [phoneError, setPhoneError] = useState(null)
const [cityOpen, setCityOpen] = useState(false)



const [confirmState, setConfirmState] = useState(null)
// { type: "delete_sport", sportId }

  const { user, loading, refreshUser } = useAuth()
const [localCity, setLocalCity] = useState("")
  const [allSports, setAllSports] = useState([])
  const [cities, setCities] = useState([])
const [selectedCityId, setSelectedCityId] = useState("")

  const [sportSearch, setSportSearch] = useState("")
  const [selectedSportId, setSelectedSportId] = useState("")
  const [newSportLevel, setNewSportLevel] = useState("beginner")
  const [newSportSide, setNewSportSide] = useState("both")
const [showAddSports, setShowAddSports] = useState(false)

  const [loadingAddSport, setLoadingAddSport] = useState(false)
  const [loadingDeleteAccount, setLoadingDeleteAccount] = useState(false)
const [avatarPreview, setAvatarPreview] = useState(null)
const [uploadProgress, setUploadProgress] = useState(0)
const [uploading, setUploading] = useState(false)


  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg

  /* 🔴 FIX: extract real user */
  const u = user?.user ?? {}
  const sports = user?.sports || []

async function loadCities() {
  try {
    const res = await api.get("/cities")
    setCities(Array.isArray(res.data) ? res.data : [])
  } catch (e) {
    console.log("load cities error", e)
  }
}

useEffect(() => {
  if (user?.user) {
    setLocalCity(user.user.city || "")
    setSelectedCityId(
      user.user.play_city?.id
        ? String(user.user.play_city.id)
        : ""
    )
  }
}, [user])


useEffect(() => {
  return () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
  }
}, [avatarPreview])


  /* REDIRECT */

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login"
    }
  }, [loading, user])

  /* LOAD STATIC DATA */

  useEffect(() => {
    loadSports()
    loadCities()
  }, [])

async function loadSports() {
  try {
    const res = await api.get("/sports")

    const data = res.data?.sports || []

    setAllSports(Array.isArray(data) ? data : [])

  } catch (e) {
    console.log("load sports error", e)
  }
}


useEffect(() => {
  if (!loading && user) {
    const timer = setTimeout(() => {
      triggerPushPrompt("profile")
    }, 1500)

    return () => clearTimeout(timer)
  }
}, [loading, user])

  /* LOADING */

  if (loading) {
  return null
}

  if (!user) return null

  /* SAFE AFTER USER */

  const completion = getProfileCompletion({
    ...u,
    sports
  })

  const userSportIds = new Set(
    sports.map(s => String(s.sport_id))
  )

  const selectedSport = allSports.find(
    s => String(s.id) === String(selectedSportId)
  ) || null

  const filteredSports = allSports.filter(s => {
    const sportId = String(s.id)
    const sportName = s.sport_name || s.name || s.name_en || "Sport"

    if (userSportIds.has(sportId)) return false

    const q = sportSearch.trim().toLowerCase()
    if (!q) return true

    return sportName.toLowerCase().includes(q)
  })


const missingSports = allSports.filter(
  s => !userSportIds.has(String(s.id))
)

const canAddMoreSports = missingSports.length > 0








  /* ACTIONS */

  async function savePhone(phone) {
    try {
      await api.put("/me", { phone })
      await refreshUser()
    } catch (e) {
const msg = e?.response?.data?.error

    if (msg === "Phone already in use") {
      setPhoneError("Телефонът вече се използва")
      return
    }

    setPhoneError("Грешка при запазване")
  }
}

  async function saveCity(cityId) {
  try {

    // ✅ UI веднага
    setSelectedCityId(cityId ? String(cityId) : "")

    // ✅ backend
    await api.put("/me", {
      city_id: cityId ? Number(cityId) : null
    })

    // 🔥 НОВО — CREATE AI RULE
    if (cityId) {
      await ensureAiRule(cityId)
    }

await refreshUser() // 🔥 ТОВА ЛИПСВА

    // ❌ БЕЗ refreshUser
  } catch (e) {
    console.log("save city error", e)
  }
}

  async function addSport() {
    if (!selectedSportId) return

    try {
      setLoadingAddSport(true)

      await api.put(`/me/sports/${selectedSportId}`, {
        level: newSportLevel,
        preferred_side: newSportSide
      })

      await refreshUser()

      setSelectedSportId("")
      setSportSearch("")
      setNewSportLevel("beginner")
      setNewSportSide("both")

    } catch (e) {
      console.log("add sport error", e)
    } finally {
      setLoadingAddSport(false)
    }
  }

async function ensureAiRule(cityId) {
  try {
    const res = await api.get("/notification-rules")

    const rules = Array.isArray(res.data)
      ? res.data
      : res.data?.data || []

    const exists = rules.some(r =>
      r.type === "game_discovery" &&
      r.filters?.city_id === Number(cityId) &&
      r.filters?.ai_mode === true
    )

    if (exists) {
      
      return
    }

    // ✅ CREATE RULE
    await api.post("/notification-rules", {
      type: "game_discovery",
      priority: 50,
      filters: {
        city_id: Number(cityId),
        ai_mode: true,
        sport_levels: {},
        venue_ids: [],
        period_hours: 168
      },
      channels: ["in_app","push","email"],
      settings: {},
      is_active: true
    })

    

  } catch (e) {
    console.log("ensureAiRule error", e)
  }
}



async function handleAvatarUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.type.startsWith("image/")) {
    alert("Invalid file type")
    e.target.value = ""
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Max file size is 5MB")
    e.target.value = ""
    return
  }

  const preview = URL.createObjectURL(file)
  setAvatarPreview(preview)

  const formData = new FormData()
  formData.append("avatar", file)

  try {
    setUploading(true)
    setUploadProgress(0)

    await api.post("/me/avatar", formData, {
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return

        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )

        setUploadProgress(percent)
      }
    })

    await refreshUser()

    e.target.value = ""

  } catch (e) {
    console.log("upload avatar error", e)
  } finally {
    setUploading(false)
  }
}

async function deleteAvatar() {
  try {
    await api.delete("/me/avatar")
    await refreshUser()
  } catch (e) {
    console.log("delete avatar error", e)
  }
}
  

function deleteSport(sportId) {
  setConfirmState({
    type: "delete_sport",
    sportId
  })
}

  function editSport(sport) {

  // 🔍 намери full sport от allSports
  const full = allSports.find(s => String(s.id) === String(sport.sport_id))

  window.dispatchEvent(
    new CustomEvent("openProfileSetup", {
      detail: {
        sport_id: sport.sport_id,
        sport_name: sport.name_en,
        sport_icon: full?.icon,
        sport_color: full?.color,
        level: sport.level,
        preferred_side: sport.preferred_side
      }
    })
  )
}

async function handleDeleteAccount() {

  const password = prompt(t.enter_password_delete)

  if (!password) return

  try {
    setLoadingDeleteAccount(true)

    await api.request({
      method: "DELETE",
      url: "/me",
      data: { password }
    })

    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")

    window.location.replace("/login")

  } catch (e) {
    alert(e?.response?.data?.error || "Failed to delete account")
  } finally {
    setLoadingDeleteAccount(false)
  }
}

 




 /* UI */

  return (
    <AppShell pageClass="app-layout">

      <div className="screen">

<div className="profile-discover-panel">

<div className="profile-discover-title">
<label className="profile-avatar">

  {u.avatar ? (
    <img src={avatarPreview || (u.avatar ? u.avatar + "?t=" + Date.now() : "")} />
  ) : (
    <span>{u.nickname?.charAt(0)?.toUpperCase() || "U"}</span>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
  handleAvatarUpload(e)
}}
    className="avatar-input"
  />
{uploading && (
  <div className="avatar-overlay">
    <div className="avatar-loading-small">Loading...</div>

    <div className="avatar-progress-small">
      <div
        className="avatar-progress-fill-small"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
  </div>
)}

</label>

            <div className="profile-name">
              {u.nickname || "User"}
            </div>
</div>
</div>

        <div className="timeline">

          <div className="profile-completion">

            <div className="pc-row">
              <span>{t.profile_completeness || "Profile completeness"}</span>
              <span>{completion}%</span>
            </div>

            <div className="pc-bar">
              <div className="pc-fill" style={{ width: `${completion}%` }} />
            </div>

          </div>

          <div className="profile-card">

<ProfileRow label={t.nickname || "Nickname"} value={u.nickname} editable={false} />


<ProfileRow label={t.email || "Email"} value={u.email} editable={false} />

<ProfileRow
  label={t.phone || "Phone"}
  value={u.phone}
  editable={true}
  onSave={savePhone}
/>

{phoneError && (
  <div className="profile-error">{phoneError}</div>
)}

<ProfileRow
  label={t.city || "City"}
  value={localCity}
  editable={true}
  onSave={async (val) => {
  setLocalCity(val)

  await api.put("/me", { city: val })
  await refreshUser()
}}
/>



          </div>
<div className="profile-section">
<div className={`profile-card ${!selectedCityId ? "profile-card-warning" : ""}`}>	
<div className="profile-section-title">
  {t.my_preferred_cities || "Preferred city to play sport and receive notifications"}
</div>

  <div className="profile-city-select">

  {/* BUTTON */}
  <div
    className="profile-city-select-btn"
    onClick={() => setCityOpen(prev => !prev)}
  >
    {selectedCityId
      ? (cities.find(c => String(c.id) === selectedCityId)?.name_bg ||
         cities.find(c => String(c.id) === selectedCityId)?.name_en)
      : (t.select_city || "Select city")}
  </div>

  {/* DROPDOWN */}
  {cityOpen && (
    <div className="profile-city-select-dropdown">

      {(cities || []).map(c => {
        const isActive = String(c.id) === selectedCityId

        return (
          <div
            key={c.id}
            className={`profile-add-sport-item ${isActive ? "active" : ""}`}
            onClick={() => {
              setSelectedCityId(String(c.id))
              saveCity(c.id)
              setCityOpen(false) // 🔥 затваря след избор
            }}
          >
            {lang === "bg" ? c.name_bg : c.name_en}
          </div>
        )
      })}

    </div>
  )}

</div>
{!selectedCityId && (
  <div className="profile-warning-text">
    {t.select_city_warning || "Select your city to receive game notifications"}
  </div>
)}
</div>
</div>




          {/* SPORTS */}

          <div className="profile-section">

<div className="profile-section-header">

{showAddSports && (
  <div className="profile-add-sport-list">

    {missingSports.map(s => (
      <div
        key={s.id}
        className="profile-add-sport-item"
        onClick={() => {
  setShowAddSports(false)

  window.dispatchEvent(
    new CustomEvent("openProfileSetup", {
      detail: {
        sport_id: s.id,
        sport_name: s.name_en || s.name_bg || s.slug,
        sport_icon: s.icon,
        sport_color: s.color
      }
    })
  )
}}
      >
        {s.sport_name || s.name || s.name_en || "Sport"}
      </div>
    ))}

  </div>
)}

<div className="profile-section-title">
  {t.my_sports || "My sports"}
</div>

  {canAddMoreSports && (
    <button
  className="profile-add-sport-btn"
  onClick={() => setShowAddSports(prev => !prev)}
>
  + {t.add || "Add"}
</button>
  )}

</div>

            <div className="profile-sports">

              {sports.length ? (
                sports.map(s => (

                  <div
  className="profile-sport-row"
  style={{ borderLeft: `6px solid ${s.color}` }}
>

                    <div className="ps-left">

                      <div className="ps-icon">
  <img src={`/images/${s.icon}`} alt={s.name_en} />
</div>

<div className="ps-info">

  <div className="ps-row1">
    <span className="ps-name">{s.name_en}</span>
    <span className={`player-level level-${s.level || "beginner"}`}>
      {s.level}
    </span>
  </div>

                        <div className="ps-row2">
                          {t.player_side}{" "}
                          <span className={`player-side ${s.preferred_side || "both"}`}>
                            {t[`side_${s.preferred_side}`] || s.preferred_side}
                          </span>
                        </div>

                      </div>

                    </div>

                    <div className="ps-actions">

                      <button className="ps-btn edit" onClick={() => editSport(s)}>
                        {t.edit || "Edit"}
                      </button>

                      <button className="ps-btn delete" onClick={() => deleteSport(s.sport_id)}>
                        {t.delete || "Delete"}
                      </button>

                    </div>

                  </div>

                ))
              ) : (
<div className={`profile-card ${sports.length === 0 ? "profile-card-warning" : ""}`}>
                <div className="profile-warning-text">
  {t.no_sports || "You have no sports yet."}
</div>
</div>
              )}

            </div>

          </div>


<ActivityRail userId={u.id} />

<div className="profile-danger">
 <div className="danger-text">
    {t.delete_warning || "This action is permanent and cannot be undone."}
  </div>
  <button
    className="delete-account-btn"
    onClick={handleDeleteAccount}
    disabled={loadingDeleteAccount}
  >
    {loadingDeleteAccount
      ? (t.deleting || "Deleting...")
      : (t.delete_account || "Delete account")}
  </button>

</div>

        </div>



      </div>

<ConfirmModal
  open={!!confirmState}
  title={t.confirm_delete_sport || "Remove sport"}
  message={t.confirm_delete_sport_msg || "Are you sure you want to remove this sport?"}
  confirmText={t.delete || "Delete"}
  cancelText={t.cancel || "Cancel"}
  type="danger"
  onCancel={() => setConfirmState(null)}
  onConfirm={async () => {

    if (confirmState?.type === "delete_sport") {
      try {
        await api.delete(`/me/sports/${confirmState.sportId}`)
        await refreshUser()
      } catch (e) {
        console.log("delete sport error", e)
      }
    }

    setConfirmState(null)
  }}
/>

    </AppShell>
  )
}