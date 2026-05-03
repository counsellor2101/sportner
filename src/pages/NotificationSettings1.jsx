import { useEffect, useState } from "react"
import api from "../api/api"
import AppShell from "../components/AppShell"
import "../styles/app-layout.css"
import "../styles/profile.css"
import { texts } from "../i18n/texts"
import "../styles/notification.css"
import "../styles/create-game-modal.css"
import NotificationFilters from "../components/NotificationFilters"

export default function NotificationSettings(){

const [initialized, setInitialized] = useState(false)
const LEVELS = ["beginner", "intermediate", "advanced", "pro"]
const [periodOpen, setPeriodOpen] = useState(false)
const [editingRuleId, setEditingRuleId] = useState(null)


  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg

  // STATE
const [cityOpen, setCityOpen] = useState(false)
  const [cityId, setCityId] = useState("")
const [aiMode, setAiMode] = useState(false)

const [saving, setSaving] = useState(false)

const [rules, setRules] = useState([])

useEffect(() => {
  loadMeta()
  loadProfile()
  loadRules()
}, [])

function normalizeChannels(arr = []) {
  return [...new Set(arr.map(ch => String(ch).toLowerCase()))]
}

async function loadRules(){
  try{
    const res = await api.get("/notification-rules")

    const data = Array.isArray(res.data)
      ? res.data
      : res.data?.data || []

    setRules(data)

    console.log("rules:", data)

  }catch(e){
    console.log("rules error", e)
  }
}

async function toggleRule(rule){
  try{
    await api.put(`/notification-rules/${rule.id}`, {
      is_active: !rule.is_active
    })

    loadRules()

  }catch(e){
    console.log("toggle error", e)
  }
}

async function deleteRule(rule){
  if (!window.confirm("Delete rule?")) return

  try{
    await api.delete(`/notification-rules/${rule.id}`)
    loadRules()
  }catch(e){
    console.log("delete error", e)
  }
}

const [manualFilters, setManualFilters] = useState({
  sport_levels: {},
  venue_ids: []
})

  const [periodHours, setPeriodHours] = useState(168)
  const [channels, setChannels] = useState(["push","email"])
  const [isActive, setIsActive] = useState(true)

  const [cities, setCities] = useState([])
  const [sports, setSports] = useState([])
  const [venues, setVenues] = useState([])

  const [userProfile, setUserProfile] = useState(null)



  async function loadMeta(){
    try{
      const [c, s, v] = await Promise.all([
        api.get("/cities"),
        api.get("/sports"),
        api.get("/venues")
      ])

      setCities(Array.isArray(c.data) ? c.data : c.data?.data || [])
setSports(
  Array.isArray(s.data)
    ? s.data
    : s.data?.sports || s.data?.data || []
)
setVenues(Array.isArray(v.data) ? v.data : v.data?.data || [])

    }catch(e){
      console.log("meta error", e)
    }
  }

  async function loadProfile(){
    try{
      const res = await api.get("/me")
      setUserProfile(res.data)
    }catch(e){
      console.log("profile error", e)
    }
  }

function startEdit(rule){
  setInitialized(false)
  setEditingRuleId(rule.id)
}

  const canUseAI = Array.isArray(userProfile?.sports) && userProfile.sports.length > 0

console.log("userProfile", userProfile)
console.log("canUseAI", canUseAI)

  // PAYLOAD
  function buildPayload(){
    return {
      type: "game_discovery",
      priority: 50,

      filters: {
  city_id: Number(cityId),
  ai_mode: aiMode,

sport_levels: aiMode ? {} : manualFilters.sport_levels,
venue_ids: aiMode ? [] : manualFilters.venue_ids,

  period_hours: periodHours
},

      channels: normalizeChannels(channels),
      settings: {},
      is_active: isActive
    }
  }

  async function saveRule(){

if (saving) return // 🔥 блок


    if (!cityId) {
      alert("Select city")
      return
    }

    try{
      const payload = buildPayload()

      let res

if (editingRuleId) {
  res = await api.put(`/notification-rules/${editingRuleId}`, payload)
} else {
  res = await api.post("/notification-rules", payload)
}

      console.log("saved", res.data)

loadRules() // 🔥 ТУК

setEditingRuleId(null)


setCityId("")
setManualFilters({
  sport_levels: {},
  venue_ids: []
})
setAiMode(false)
setChannels(["push","email"]) // 🔥 FIX

      alert("Saved")

    }catch(e){
  console.log("save error full", e)
  console.log("save status", e?.response?.status)
  console.log("save data", e?.response?.data)
  console.log("save payload", buildPayload())
  alert(JSON.stringify(e?.response?.data || { error: "unknown" }))
}
  }

useEffect(() => {
  if (!editingRuleId || initialized) return

  const rule = rules.find(r => r.id === editingRuleId)
  if (!rule) return

  const f = rule.filters || {}

  setCityId(f.city_id || "")
  setAiMode(!!f.ai_mode)

  setManualFilters({
  sport_levels: f.sport_levels || {},
  venue_ids: Array.isArray(f.venue_ids) ? f.venue_ids : []
})

  setPeriodHours(f.period_hours || 168)
const cleaned = normalizeChannels(
  (rule.channels || []).filter(ch => ch !== "in_app")
)

setChannels(
  cleaned.length ? cleaned : ["push","email"]
)
  setIsActive(rule.is_active)

  setInitialized(true)

}, [editingRuleId, rules])

function getCityName(id){
  const city = cities.find(c => c.id === Number(id))
  if (!city) return "City"
  return lang === "bg" ? city.name_bg : city.name_en
}














return (
  <AppShell pageClass="app-layout">

    <div className="screen">

      {/* HEADER */}
      <div className="discover-panel">
        <div className="discover-title">
          {t.notification_menu || "Notifications"}
        </div>
      </div>

      <div className="profile-page">

        {/* RULES LIST */}
        <div className="rules-list">

          {rules.length === 0 && (
            <div className="profile-card">
              <div className="notification-profile-label">
                {t.no_rules || "No notification rules yet"}
              </div>
            </div>
          )}

          {rules.map(rule => {

            const isEditing = editingRuleId === rule.id
            const f = rule.filters || {}

            if (isEditing) {
              return (
                <div key={rule.id} className="profile-card rule-card">

  <div className="profile-row">
    <div className="profile-label">{t.notify_next || "Edit rule"}</div>
  </div>

  {/* CITY */}
  <div className="profile-row">
    <div className="profile-label">{t.city || "City"}</div>

    <div className="profile-city-select">

  {/* BUTTON */}
  <div
    className="profile-city-select-btn"
    onClick={() => setCityOpen(prev => !prev)}
  >
    {cityId
      ? getCityName(cityId)
      : (t.select_city || "Select city")}
  </div>

  {/* DROPDOWN */}
  {cityOpen && (
    <div className="profile-city-select-dropdown">

      {cities.map(c => {
        const isActive = String(c.id) === String(cityId)

        return (
          <div
            key={c.id}
            className={`profile-add-sport-item ${isActive ? "active" : ""}`}
            onClick={() => {
              setCityId(String(c.id))

              setManualFilters(prev => ({
                ...prev,
                venue_ids: []
              }))

              setCityOpen(false)
            }}
          >
            {lang === "bg" ? c.name_bg : c.name_en}
          </div>
        )
      })}

    </div>
  )}

</div>
  </div>

  {/* AI MODE */}
  <div className="profile-row">
    <div className="profile-label">{t.ai_mode || "AI Mode"}</div>

    <div className="profile-value">
      <div
  className="switch-wrapper"
  onClick={() => setAiMode(v => !v)}
>

  <div className={`switch-track ${aiMode ? "on" : ""}`}>
    <div className="switch-thumb" />
  </div>

<span className="switch-label">
  {aiMode
    ? (t.ai_mode_on || "Automatic")
    : (t.ai_mode_off || "Manual")}
</span>

</div>
    </div>
  </div>

  {!canUseAI && (
    <div className="profile-error">
      {t.complete_profile_ai || "Complete your profile to enable AI mode"}
    </div>
  )}

  {!aiMode && (
  <NotificationFilters
    sports={sports}
    venues={venues}
    cityId={cityId}
    manualFilters={manualFilters}
    setManualFilters={setManualFilters}
    LEVELS={LEVELS}
    t={t}
  />
)}

  {/* PERIOD */}
 <div className="profile-row">

  <div className="notification-label">
    {t.notify_next || "Notify in next"}
  </div>

  <div className="profile-city-select">

    {/* BUTTON */}
    <div
      className="profile-city-select-btn notif-period-btn"
      onClick={() => setPeriodOpen(prev => !prev)}
    >
      {periodHours
        ? (() => {
            const d = periodHours / 24
            return `${d} ${d === 1 ? (t.day || "day") : (t.days || "days")}`
          })()
        : (t.select_period || "Select period")}
    </div>

    {/* DROPDOWN */}
    {periodOpen && (
      <div className="profile-city-select-dropdown">

        {[24, 48, 168, 336].map(h => {

          const d = h / 24
          const isActive = periodHours === h

          return (
            <div
              key={h}
              className={`profile-add-sport-item ${isActive ? "active" : ""}`}
              onClick={() => {
                setPeriodHours(h)
                setPeriodOpen(false)
              }}
            >
              {d} {d === 1 ? (t.day || "day") : (t.days || "days")}
            </div>
          )
        })}

      </div>
    )}

  </div>

</div>

  {/* CHANNELS */}
  <div className="profile-row">
    <div className="profile-label">{t.channels || "Channels"}</div>

    <div className="profile-value multi">
      {["push","email"].map(ch => (
        <div
          key={ch}
          className={`cgm-chip ${
            channels.includes(ch) ? "active" : ""
          }`}
          onClick={() => {
            setChannels(prev =>
              prev.includes(ch)
                ? prev.filter(c => c !== ch)
                : [...prev, ch]
            )
          }}
        >
          {t[ch] || ch}
        </div>
      ))}
    </div>
  </div>

  {/* ACTIVE */}
  <div className="profile-row">
    <div className="notification-profile-label">{t.active || "Active"}</div>

    <div className="profile-value">
      <input
        type="checkbox"
        checked={isActive}
        onChange={() => setIsActive(v => !v)}
      />
    </div>
  </div>

  {/* ACTIONS */}
<div className="profile-row">
  <div className="profile-value multi">

    {/* UPDATE */}
    <div
      className="chip"
      onClick={saveRule}
    >
      {t.update || "Update"}
    </div>

    {/* CANCEL */}
    <div
      className="chip"
      onClick={() => {
        setEditingRuleId(null)
        setInitialized(false)
      }}
    >
      {t.cancel || "Cancel"}
    </div>

  </div>
</div>

</div>
              )
            }

            return (
              <div key={rule.id} className="profile-card rule-card">

                {/* TITLE */}
                <div className="profile-row">
                 <div className="notification-notification-label">

  {/* CITY */}
  {getCityName(f.city_id)}

{" • "}

{(() => {
  const h = f.period_hours || 168

  if (h % 24 === 0) {
    const days = h / 24
    return `${days} ${days === 1 ? (t.day || "day") : (t.days || "days")}`
  }

  return `${h}h`
})()}

  {!f.ai_mode && (
<>

      
      <div className="notification-levels-vertical">

  {Object.entries(f.sport_levels || {}).map(([sportId, levels]) => {

    const sport = sports.find(s => s.id === Number(sportId))
    if (!sport) return null

    return (
      <div key={sportId} className="notification-inline-group">

        {/* SPORT */}
        <div className="cgm-chip cgm-sport-chip active">
          <div className="cgm-sport-icon">
            <img
              src={sport.icon ? `/images/${sport.icon}` : `/images/sports/${sport.id}.png`}
              alt={sport.name_en}
            />
          </div>
          {sport.name_en}
        </div>

        {/* LEVELS */}
        {levels.map(level => (
          <div
            key={level}
            className={`cgm-chip cgm-level-chip active level-${level}`}
          >
            {t[`level_${level}`] || level}
          </div>
        ))}

      </div>
    )
  })}

</div>

      {/* VENUES */}
      {(f.venue_ids || []).map(vid => {
        const venue = venues.find(v => v.id === vid)
        return venue ? (
          <span key={vid}>
            {venue.name}{" • "}
          </span>
        ) : null
      })}

    </>


  )}



  {/* PERIOD */}

 {/* AI MODE */}
{f.ai_mode && (
<>{" • "}{t.ai_notification_mode || "AI notification mode"}</>
)}



</div>
                </div>

                {/* CHANNELS */}
                <div className="profile-row">
                  <div className="profile-value">
                    {(rule.channels || [])
  .filter(ch => ch !== "in_app")
  .join(", ")}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="profile-row">
                  <div className="profile-value multi">

                    {/* TOGGLE */}
                    <div
                      className="switch-wrapper"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleRule(rule)
                      }}
                    >
                      <div className={`switch-track ${rule.is_active ? "on" : ""}`}>
                        <div className="switch-thumb" />
                      </div>
                      <span className="switch-label">
                        {rule.is_active
  ? (t.active || "Active")
  : (t.inactive || "Inactive")}
                      </span>
                    </div>

                    {/* EDIT */}
                    <div
                      className="chip"
                      onClick={() => startEdit(rule)}
                    >
                      {t.edit || "Edit"}
                    </div>

                    {/* DELETE */}
                    <div
                      className="chip"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRule(rule)
                      }}
                    >
                      {t.delete || "Delete"}
                    </div>

                  </div>
                </div>

              </div>
            )
          })}
{!editingRuleId && (
  <div className="profile-card rule-card">

    <div className="profile-row">
      <div className="notification-notification-label">
        {t.new_rule || "Create Notification Rule"}
      </div>
    </div>

    {/* CITY */}
<div className="notification-label">
  {t.my_preferred_cities || "Preferred city to play sport and receive notifications"}
</div>

<div className="profile-city-select">

  {/* BUTTON */}
  <div
    className="profile-city-select-btn"
    onClick={() => setCityOpen(prev => !prev)}
  >
    {cityId
      ? getCityName(cityId)
      : (t.select_city || "Select city")}
  </div>

  {/* DROPDOWN */}
  {cityOpen && (
    <div className="profile-city-select-dropdown">

      {cities.map(c => {
        const isActive = String(c.id) === String(cityId)

        return (
          <div
            key={c.id}
            className={`profile-add-sport-item ${isActive ? "active" : ""}`}
            onClick={() => {
              setCityId(String(c.id))
              setCityOpen(false)
            }}
          >
            {lang === "bg" ? c.name_bg : c.name_en}
          </div>
        )
      })}

    </div>
  )}

</div>

{/* AI */}
<div className="profile-row">
  <div
    className="switch-wrapper"
    onClick={() => setAiMode(v => !v)}
  >
    <div className={`switch-track ${aiMode ? "on" : ""}`}>
      <div className="switch-thumb" />
    </div>

    <span className="switch-label">
      <span className="switch-label">
  {aiMode
    ? (t.ai_mode_on || "Automatic")
    : (t.ai_mode_off || "Manual")}
</span>
    </span>
  </div>
</div>

{!aiMode && (
  <NotificationFilters
    sports={sports}
    venues={venues}
    cityId={cityId}
    manualFilters={manualFilters}
    setManualFilters={setManualFilters}
    LEVELS={LEVELS}
    t={t}
  />
)}

{/* PERIOD */}
<div className="profile-row">
  <div className="notification-label">
    {t.notify_next || "Notify in next"}
  </div>

 <div className="profile-city-select">

  {/* BUTTON */}
  <div
    className="profile-city-select-btn notif-period-btn"
    onClick={() => setPeriodOpen(prev => !prev)}
  >
    {periodHours
      ? (() => {
          const d = periodHours / 24
          return `${d} ${d === 1 ? (t.day || "day") : (t.days || "days")}`
        })()
      : (t.select_period || "Select period")}
  </div>

  {/* DROPDOWN */}
  {periodOpen && (
    <div className="profile-city-select-dropdown">

      {[24, 48, 168, 336].map(h => {

        const d = h / 24
        const isActive = periodHours === h

        return (
          <div
            key={h}
            className={`profile-add-sport-item ${isActive ? "active" : ""}`}
            onClick={() => {
              setPeriodHours(h)
              setPeriodOpen(false)
            }}
          >
            {d} {d === 1 ? (t.day || "day") : (t.days || "days")}
          </div>
        )
      })}

    </div>
  )}

</div>
</div>

{/* CHANNELS */}
<div className="profile-row">
  <div className="notification-label">{t.channels || "Channels"}</div>

  <div className="profile-value multi">
    {["push","email"].map(ch => (
      <div
        key={ch}
        className={`cgm-chip ${
          channels.includes(ch) ? "active" : ""
        }`}
        onClick={() => {
          setChannels(prev =>
            prev.includes(ch)
              ? prev.filter(c => c !== ch)
              : [...prev, ch]
          )
        }}
      >
        {t[ch] || ch}
      </div>
    ))}
  </div>
</div>

{/* SAVE */}
<div
  className="notification-create-btn"
  onClick={saveRule}
>
  {t.new_rule || "Create"}
</div>

  </div>
)}
        </div>

      </div>

    </div>

  </AppShell>
)





}

