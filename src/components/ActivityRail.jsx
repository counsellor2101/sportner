import { useEffect, useState } from "react"
import api from "../api/api"
import "../styles/activity-rail.css"
import { useAuth } from "../context/authcontext"
import { texts } from "../i18n/texts"

export default function ActivityRail({ userId }) {

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
const { user } = useAuth()

const lang =
  localStorage.getItem("lang") || "bg"

const t = texts[lang] || texts.bg

  useEffect(() => {

    if (!userId) return

    load()

  }, [userId])

  async function load() {

    try {

      const res = await api.get(
        `/users/${userId}/game-highlights`
      )

      setItems(
        res.data?.data || []
      )

    } catch(e) {

      console.log(
        "activity rail error",
        e
      )
    }
  }

  if (!items.length) {
    return null
  }

  return (

    <>

      <div className="activity-grid">

        {items.map(item => (

          <div
            key={item.id}
            className="activity-grid-item"
            onClick={() => setSelected(item)}
          >

            <img
              src={item.media_url}
              className="activity-grid-image"
            />

          </div>

        ))}

      </div>

      {selected && (

        <div
          className="activity-viewer"
          onClick={() => setSelected(null)}
        >

{Number(selected.user_id) ===
 Number(user?.user?.id) && (

  <button
    className="activity-viewer-delete"
    onClick={async (e) => {

      e.stopPropagation()

      const ok = window.confirm(
        t.delete_activity_confirm ||
        "Delete story?"
      )

      if (!ok) return

      try {

        await api.delete(
          `/activities/${selected.id}`
        )

        setItems(prev =>
          prev.filter(
            x => x.id !== selected.id
          )
        )

        setSelected(null)

      } catch(e) {

        console.log(
          "delete story error",
          e
        )
      }
    }}
  >
    {t.delete_activity || "Delete story"}
  </button>

)}

{selected.caption && (

  <div className="activity-viewer-caption">
    {selected.caption}
  </div>

)}
          <img
            src={selected.media_url}
            className="activity-viewer-image"
          />

        </div>

      )}

    </>
  )
}