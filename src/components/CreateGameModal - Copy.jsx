import { useEffect, useRef, useState } from "react"
import "../styles/create-game-modal.css"
import api from "../api/api"
import { useMeta } from "../context/meta-context"
import { texts } from "../i18n/texts"
import DaySelector from "./DaySelector"
import ProfileSetupModal from "./ProfileSetupModal"
import { triggerPushPrompt } from "../push/pushBus"
import { Capacitor } from "@capacitor/core"




export default function CreateGameModal({ initialData, onClose, levels }) {

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg
const [playersTouched, setPlayersTouched] = useState(false)
const [errors, setErrors] = useState({})
const { sports, cities, venues, loading } = useMeta()
const [groups, setGroups] = useState([])
const [groupsLoading, setGroupsLoading] = useState(false)
const [profileModalSport, setProfileModalSport] = useState(null)

const timeLineRef = useRef(null)

const [creating, setCreating] = useState(false)
const creatingRef = useRef(false)

function getCityName(c){
  return lang === "bg"
    ? c.name_bg || c.name
    : c.name_en || c.name_bg
}

if (loading) return <div className="cgm-loading">Loading...</div>

const defaultForm = {
  game_type: "public",   // 🔥 ново
  group_id: null,
  sport_id: null,
  city_id: null,
  venue_id: null,
  level_required: null,
  game_date: null,
  start_time: null,
  max_players: null,
  note: "",
  court_reserved: true,
name: "" // 🔥 ADD
}




function formatDate(date){
  if(!date) return ""

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}


const [form, setForm] = useState(() => ({
  ...defaultForm,
  ...initialData,
  date: initialData?.date || new Date(),
  court_reserved: initialData?.court_reserved || false,
  start_time: initialData?.start_time || getNowTimeRounded(),
  note: initialData?.note || ""
}))



const [duration, setDuration] = useState(120)


const availableCities = venues
  .filter(v =>
    !form?.sport_id || v.sport_ids?.includes(form.sport_id)
  )
  .map(v => v.city_id)

const uniqueCityIds = [...new Set(availableCities)]

const filteredCities = cities.filter(c =>
  uniqueCityIds.includes(c.id)
)

const filteredVenues = venues.filter(v =>
  (!form?.sport_id || v.sport_ids?.includes(form.sport_id)) &&
  (!form?.city_id || v.city_id === form.city_id)
)

useEffect(() => {
  if (!form?.sport_id && sports.length && !initialData){
    setForm(prev => ({
      ...prev,
      sport_id: sports[0].id
    }))
  }
}, [sports])

useEffect(() => {
  if (!form.sport_id) return
  if (playersTouched) return
  if (form.max_players !== null) return

  let defaultPlayers = 4

  if (form.sport_id === 1) defaultPlayers = 4
  if (form.sport_id === 2) defaultPlayers = 2



  setForm(prev => ({
    ...prev,
    max_players: defaultPlayers
  }))
}, [form.sport_id, playersTouched, form.max_players])

useEffect(() => {
  if(!form?.city_id && filteredCities.length){
    setForm(prev => ({
      ...prev,
      city_id: filteredCities[0].id
    }))
  }
}, [filteredCities])

  const sheetRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

useEffect(() => {
  if (initialData) {

    setPlayersTouched(false) // 🔥 КЛЮЧОВО

    setForm(prev => {

  let maxPlayers = initialData?.max_players ?? null

  if (maxPlayers === null) {

    if (initialData?.sport_id === 2) maxPlayers = 2
if (initialData?.sport_id === 1) maxPlayers = 4
if (initialData?.sport_id === 3) maxPlayers = 10
    else maxPlayers = 4

  }

  return {
    ...defaultForm,
    ...initialData,
    max_players: maxPlayers
  }
     
    })
  }
}, [initialData])


function addMinutes(time, minutes){

  const [h, m] = time.split(":").map(Number)

  const date = new Date()
  date.setHours(h)
  date.setMinutes(m + minutes)

  const hh = String(date.getHours()).padStart(2,"0")
  const mm = String(date.getMinutes()).padStart(2,"0")

  return `${hh}:${mm}`
}

const end_time = form.start_time
  ? addMinutes(form.start_time, duration)
  : null

  /*
  🔒 LOCK BODY SCROLL (CRITICAL FOR iOS)
  */
  useEffect(() => {
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  /*
  DRAG EVENTS
  */
  useEffect(() => {

    function handleMove(e) {
      moveDrag(e)
    }

    function handleEnd() {
      endDrag()
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", handleMove, { passive: false })
    window.addEventListener("touchend", handleEnd)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleMove)
      window.removeEventListener("touchend", handleEnd)
    }

  }, [])

  function startDrag(e) {
    dragging.current = true
    startY.current = e.touches ? e.touches[0].clientY : e.clientY
    currentY.current = startY.current

    document.body.style.userSelect = "none"
  }

  function moveDrag(e) {
  if (!dragging.current) return
  if (!sheetRef.current) return

  if (e.cancelable && dragging.current) {
    e.preventDefault()
  }

  currentY.current = e.touches
    ? e.touches[0].clientY
    : e.clientY

  const diff = currentY.current - startY.current

  if (diff > 0) {
    sheetRef.current.style.transition = "none"
    sheetRef.current.style.transform = `translateY(${diff}px)`
  }
}

  function endDrag() {
    if (!dragging.current) return
    if (!sheetRef.current) return

    dragging.current = false

    const diff = currentY.current - startY.current

    sheetRef.current.style.transition = "transform .25s ease"

    if (diff > 120) {
      sheetRef.current.style.transform = "translateY(100%)"
      setTimeout(onClose, 200)
    } else {
      sheetRef.current.style.transform = "translateY(0)"
    }

    document.body.style.userSelect = "auto"
  }

  function handleBackdrop(e) {
    if (dragging.current) return

    if (e.target.classList.contains("cgm-backdrop")) {
      onClose()
    }
  }


useEffect(() => {
  console.log("SPORTS:", sports)
  console.log("CITIES:", cities)
  console.log("VENUES:", venues)
}, [sports, cities, venues])



const textareaRef = useRef(null)

useEffect(() => {
  textareaRef.current?.focus()
}, [])


function timeToMinutes(time){
  const [h,m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(mins){
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
}

const BASE_MIN_TIME = 8 * 60
const MAX_TIME = 23 * 60 + 30 // 23:30
const STEP = 30

const dynamicMinTime = (() => {
  if (!isToday(form.date)) return BASE_MIN_TIME

  const now = getNowMinutes()
  const rounded = Math.ceil(now / STEP) * STEP

  return Math.max(BASE_MIN_TIME, rounded) // ✅ ЕДИНСТВЕН return
})()



function getNowTimeRounded(){
  const now = new Date()

  let h = now.getHours()
  let m = now.getMinutes()

  // закръгляме до 30 мин
  m = m < 30 ? 30 : 0
  if(m === 0) h += 1

  // clamp (пример 08:00–22:00)
  if(h < 8) return "08:00"
  if(h > 22) return "22:00"

  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
}



function getNowMinutes(){
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function isToday(date){
  const d = new Date(date)
  const now = new Date()

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}


useEffect(() => {
  if (!form.start_time) return

  const current = timeToMinutes(form.start_time)

  if (current < dynamicMinTime) {
    setForm(prev => ({
      ...prev,
      start_time: minutesToTime(dynamicMinTime)
    }))
  }
}, [form.date])

useEffect(() => {
  if (!timeLineRef.current) return
  if (!form.start_time) return

  const index = Array.from({
    length: (MAX_TIME - dynamicMinTime) / STEP + 1
  }).findIndex((_, i) => {
    const mins = dynamicMinTime + i * STEP
    return minutesToTime(mins) === form.start_time
  })

  if (index === -1) return

  const ITEM_WIDTH = 56
  const GAP = 6

  timeLineRef.current.scrollTo({
    left: index * (ITEM_WIDTH + GAP),
    behavior: "auto"
  })

}, [form.start_time, dynamicMinTime])


function validateForm(){

  const e = {}

  if (!form.sport_id) e.sport_id = "Select sport"
  if (!form.level_required) e.level_required = "Select level"
  if (!form.venue_id) e.venue_id = "Select venue"
  if (!form.start_time) e.start_time = "Select time"
  if (form.game_type === "group" && !form.group_id) {
    e.group_id = "Select group"}

  if (form.game_type === "tournament" && !form.name) {
  e.name = true
}

  setErrors(e)

  return Object.keys(e).length === 0
}


async function handleCreate(e) {

  e?.preventDefault?.()
  e?.stopPropagation?.()

  // 🔒 HARD LOCK
  if (creatingRef.current) return

  creatingRef.current = true
  setCreating(true)

  if (!validateForm()) {
    creatingRef.current = false
    setCreating(false)
    return
  }

  try {

    const dateStr = formatDate(form.date)

    // 🔥 helper
    const formatDateTime = (d) => {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const hh = String(d.getHours()).padStart(2, "0")
      const mi = String(d.getMinutes()).padStart(2, "0")

      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:00`
    }

    // 🔥 build start
    const startDate = new Date(`${dateStr}T${form.start_time}:00`)

    // 🔥 build end
    let endDate = null

    if (end_time) {
      endDate = new Date(`${dateStr}T${end_time}:00`)

      // 🔥 ключът
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1)
      }
    }

    const payload = {
      sport_id: form.sport_id,
      venue_id: form.venue_id,
      game_date: dateStr,
      start_time: formatDateTime(startDate),
      end_time: endDate ? formatDateTime(endDate) : null,
      level_required: form.level_required,
      max_players: form.max_players,
      note: form.note || null,
      court_reserved: form.court_reserved ? 1 : 0,
      group_id: form.game_type === "group" ? form.group_id : null,
      name: form.game_type === "tournament"
  ? (form.name?.trim() || null)
  : null,
    }

    console.log("CREATE GAME:", payload)

    await api.post("/games", payload)

    window.dispatchEvent(new Event("gamesUpdated"))

window.dispatchEvent(new Event("gameCreated"))

const isNative = Capacitor.isNativePlatform()

if (isNative) {
  // native (android / ios)
  const { PushNotifications } = await import("@capacitor/push-notifications")

const perm = await PushNotifications.checkPermissions()

  if (perm?.receive !== "granted") {
    triggerPushPrompt("create_game")
  }

} else {
  // web
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    triggerPushPrompt("create_game")
  }
}

    onClose()

  } catch (e) {

    console.log("ERROR FULL:", e.response)
    console.log("ERROR DATA:", e.response?.data)
    console.log("STATUS:", e.response?.status)

    const error = e.response?.data?.error
    const status = e.response?.status

if (error?.code === "SPORT_NOT_ALLOWED") {

  const selectedSport = sports.find(s => s.id === form.sport_id)

  setProfileModalSport({
    sport_id: selectedSport?.id,
    sport_name: selectedSport?.name_en,
    sport_icon: selectedSport?.icon,
    sport_color: selectedSport?.color
  })

  return
}

    if (status === 422 && error === "Time overlap") {
      setErrors(prev => ({
        ...prev,
        start_time: t.has_overlap
      }))
      return
    }

    console.error("create game unexpected error", e)

  } finally {
    creatingRef.current = false
    setCreating(false)
  }
}

function isFormValid(){
  return (
    form.sport_id &&
    form.level_required &&
    form.venue_id &&
    form.start_time &&
(form.game_type !== "group" || form.group_id) // 🔥 ТОВА
  )
}

useEffect(() => {
  if (form.game_type !== "group") return

  setGroupsLoading(true)

  api.get("/me/groups")
    .then(res => {
      setGroups(res.data.data || [])
    })
    .catch(err => {
      console.error("Failed to load groups", err)
    })
    .finally(() => {
      setGroupsLoading(false)
    })

}, [form.game_type])



const sortedCities = [
  ...filteredCities.filter(c => c.id === form.city_id),
  ...filteredCities.filter(c => c.id !== form.city_id)
]
  /*
  UI
  */






  return (
    <div className="cgm-backdrop" onClick={handleBackdrop}>

      <div className="cgm-sheet" ref={sheetRef}>
<div 
  className="cgm-header"
  onMouseDown={startDrag}
  onTouchStart={startDrag}
>

  <div className="cgm-handle" />

  <div className="cgm-title">
    {t.create_game}
  </div>

</div>
        



<div className="cgm-content">





{/* 🔥 Sport SECTION */}
<div className="cgm-card">
<div className={`cgm-section ${errors.sport_id ? "error" : ""}`}>

  <div className="cgm-section-title1">
    {t.cgm_sport}
  </div>

  <div className="cgm-row">

    {sports.map(s => {
      const isActive = form.sport_id === s.id

      return (
        <div
          key={s.id}
          onClick={() => {
  setPlayersTouched(false) // 🔥 ЕТО ТУК Е ЦЕЛИЯТ ПРОБЛЕМ

  setForm(prev => ({
    ...prev,
    sport_id: s.id,
    city_id: null,
    venue_id: null,
    max_players: null // 🔥 force recalculation
  }))
}}
          className={`cgm-chip cgm-sport-chip ${isActive ? "active" : ""}`}>
  <div className="cgm-sport-icon">
<img
  src={s.icon ? `/images/${s.icon}` : `/images/sports/${s.id}.png`}
  alt={s.name_en}
/>
  </div>

  {s.name_en}
        </div>
      )
    })}

  </div>
{/* 🔴 ТУК */}
  {errors.sport_id && (
    <div className="cgm-error">
      {errors.sport_id}
    </div>
  )}
</div>



{/* 🔥 Levels SECTION */}
<div className={`cgm-section ${errors.level_required ? "error" : ""}`}>

  <div className="cgm-section-title">
    {t.level}
  </div>

  <div className="cgm-row">

    {levels.map(level => {

      const isActive = form.level_required === level

      return (
        <div
          key={level}
          onClick={() => {
            setForm(prev => ({
              ...prev,
              level_required: level
            }))

            // 🔥 маха грешката веднага
            setErrors(prev => ({
              ...prev,
              level_required: null
            }))
          }}
          className={`cgm-chip cgm-level-chip ${isActive ? `active level-${level}` : ""}`}
        >
          {t[`level_${level}`] || level}
        </div>
      )
    })}

  </div>

  {errors.level_required && (
    <div className="cgm-error">
      {errors.level_required}
    </div>
  )}

</div>
</div>




{/* 🔥 Game type SECTION */}
<div className="cgm-card">
<div className="cgm-section">

  <div className="cgm-section-title1">
    {t.cgm_time}
  </div>

  





{/* 🔥 Date SECTION */}

<DaySelector
  selectedDate={form.date}
  setSelectedDate={(date) =>
    setForm(prev => ({
      ...prev,
      date
    }))
  }
/>


{/* 🔥 TIME SECTION */}

<div className="cgm-time-info">

  <div className={`cgm-section ${errors.start_time ? "error" : ""}`}>



    <div className="cgm-time-line" ref={timeLineRef}>

  <div className="cgm-time-track" />

  {Array.from({
    length: (MAX_TIME - dynamicMinTime) / STEP + 1
  }).map((_, i) => {

    const mins = dynamicMinTime + i * STEP
    const time = minutesToTime(mins)
    const isActive = form.start_time === time

    const isHour = mins % 60 === 0

    return (
      <div
        key={time}
        className="cgm-time-item"
        onClick={() => {
          setForm(prev => ({
            ...prev,
            start_time: time
          }))

          setErrors(prev => ({
            ...prev,
            start_time: null
          }))
        }}
      >
        <div
          className={`
            cgm-time-label
            ${isHour ? "hour" : "half"}
            ${isActive ? "active" : ""}
          `}
        >
          {time}
        </div>
      </div>
    )
  })}

</div>

    {/* 🔴 error ВЪТРЕ */}
    {errors.start_time && (
      <div className="cgm-error">
        {errors.start_time}
      </div>
    )}

  </div>
    


  <div className="cgm-row-wrap">
    {[30,60,90,120].map(d => (
      <div
        key={d}
        onClick={() => setDuration(d)}
        className={`cgm-chip ${duration === d ? "active" : ""}`}
      >
        {d}m
      </div>
    ))}
  </div>
<div className="cgm-time-row">
      
 <div className="cgm-row-icon">
<img src="/images/clock_icon.png" alt="time"/></div>
{t.start} {form.start_time} - {t.end} {end_time}
    </div>





</div>
</div>
</div>



{/* 🔥 Players SECTION */}
<div className="cgm-card">
<div className="cgm-section">

  <div className="cgm-section-title1">
    {t.cgm_setup}
  </div>



  <div className="cgm-section-title">
    {t.game_type}
  </div>
<div className="cgm-row">

    {["public","group","tournament"].map(type => {

      
      const isActive = form.game_type === type

      return (
        <div
          key={type}
          onClick={() => {
            

            setForm(prev => ({
              ...prev,
              game_type: type,
              group_id: null,
              name: type === "tournament" ? prev.name : "" // 🔥 важно
            }))
          }}
          className={`cgm-chip 
            ${isActive ? "active" : ""} 
            
          `}
        >
          {t[`game_type_${type}`]}
        </div>
      )
    })}

  </div>

{form.game_type === "tournament" && (
  <div className={`cgm-section ${errors.name ? "error" : ""}`}>

    <div className="cgm-section-title">
      {t.tournament_name}
    </div>

    <input
      type="text"
      className="cgm-note-input"
      placeholder={t.tournament_name_placeholder}
      value={form.name || ""}
      onChange={(e) => {
        setForm(prev => ({
          ...prev,
          name: e.target.value
        }))

        setErrors(prev => ({
          ...prev,
          name: null
        }))
      }}
    />

    {errors.name && (
      <div className="cgm-error">
        {t.tournament_name_error}
      </div>
    )}

  </div>
)}


{/* 🔥 Group SECTION */}


{form.game_type === "group" && (

  <div className={`cgm-section ${errors.group_id ? "error" : ""}`}>

    <div className="cgm-section-title">

    {t.filter_group}


    </div>

    {groupsLoading && (
      <div className="cgm-loading">Loading...</div>
    )}

    {!groupsLoading && groups.length === 0 && (
      <div className="cgm-empty">
        You are not in any groups
      </div>
    )}

    {!groupsLoading && groups.length > 0 && (
      <div className="cgm-row">
        {groups.map(g => {
          const isActive = form.group_id === g.id

          return (
            <div
              key={g.id}
              className={`cgm-chip cgm-venue-chip ${isActive ? "active" : ""}`}
              onClick={() => {
                setForm(prev => ({
                  ...prev,
                  group_id: g.id
                }))

                setErrors(prev => ({
                  ...prev,
                  group_id: null
                }))
              }}
            >
              {g.name}
            </div>
          )
        })}
      </div>
    )}

    {errors.group_id && (
      <div className="cgm-error">
        {errors.group_id}
      </div>
    )}

  </div>
)}

        <div className="cgm-section-title">
    {t.player_details}
  </div>
  <div className="cgm-time-line">

  {Array.from({ length: 19 }).map((_, i) => {

    const num = i + 2 // 2 → 20
    const isActive = form.max_players === num

    return (
      <div
        key={num}
        className="cgm-time-item"
        onClick={() => {
          setPlayersTouched(true)

          setForm(prev => ({
            ...prev,
            max_players: num
          }))
        }}
      >
        <div className={`cgm-time-label ${isActive ? "active" : ""}`}>
          {num}
        </div>
      </div>
    )
  })}

</div>

</div>


{/* 🔥 City SECTION */}

<div className="cgm-section">

  <div className="cgm-section-title">
    {t.city}
  </div>

  <div className="cgm-row">

    {sortedCities.map(c => (
      <div
        key={c.id}
        onClick={() =>
          setForm(prev => ({
            ...prev,
            city_id: c.id,
            venue_id: null
          }))
        }
        className={`cgm-chip ${form.city_id === c.id ? "active" : ""}`}
      >
        {getCityName(c)}
      </div>
    ))}

  </div>

</div>



{/* 🔥 Venue SECTION */}

<div className={`cgm-section ${errors.venue_id ? "error" : ""}`}>

  <div className="cgm-section-title">
    {t.venue}
  </div>

  <div className="cgm-row">

    {filteredVenues.map(v => (
      <div
        key={v.id}
        onClick={() =>
          setForm(prev => ({
            ...prev,
            venue_id: v.id
          }))
        }
        className={`cgm-chip cgm-venue-chip ${form.venue_id === v.id ? "active" : ""}`}
      >
        {v.name}
      </div>
    ))}

  </div>
{errors.venue_id && (
  <div className="cgm-error">
    {errors.venue_id}
  </div>
)}
</div>


{/* 🔥 Court reserved SECTION */}

<div className="cgm-section">

  <div className="cgm-section-title">
    {t.court}
  </div>

  <div className="cgm-row">

    <div
      onClick={() =>
        setForm(prev => ({
          ...prev,
          court_reserved: true
        }))
      }
      className={`cgm-chip ${form.court_reserved ? "active" : ""}`}
    >
      {t.court_reserved}
    </div>

    <div
  onClick={() =>
    setForm(prev => ({
      ...prev,
      court_reserved: false
    }))
  }
  className={`cgm-chip ${!form.court_reserved ? "active danger" : ""}`}
>
  {t.court_not_reserved}
</div>

  </div>
</div>
</div>

{/* 🔥 Note SECTION */}

<div className="cgm-card">



    <div className="cgm-section-title">
      {t.note}
    </div>

    <textarea
      className="cgm-note-input"
      placeholder={t.note_placeholder}
      value={form.note}
      onChange={(e) =>
        setForm(prev => ({
          ...prev,
          note: e.target.value
        }))
      }
      rows={2}
      maxLength={120}
    />

    <div className="cgm-note-footer">
      <div className="cgm-note-hint">
        {t.note_hint || ""}
      </div>

      <div className="cgm-note-count">
        {form.note.length}/120
      </div>
    </div>



</div>

{/* 🔥 create button*/}
<div className="cgm-footer">

<button
  className="cgm-create-btn"
  onClick={handleCreate}
  disabled={
  !isFormValid() ||
  creating
}
>
  {creating ? t.creating_game : t.create_game}
</button>

</div>


        </div>

      </div>


{profileModalSport && (
  <ProfileSetupModal
    sport={profileModalSport}
    onClose={() => setProfileModalSport(null)}
  />
)}

    </div>
  )
}