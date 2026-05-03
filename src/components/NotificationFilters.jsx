export default function NotificationFilters({
  sports,
  venues,
  cityId,
  manualFilters,
  setManualFilters,
  LEVELS,
  t
}) {

  return (
    <>
      {/* SPORTS + LEVELS */}
      <div className="profile-row">
        <div className="notification-label">
          {t.sports_and_levels || "Sports & Levels"}
        </div>

        <div className="notif-venues-vertical">
          {sports.map(s => {

            const selectedLevels = manualFilters.sport_levels?.[s.id] || []
            const isSelected = manualFilters.sport_levels?.hasOwnProperty(s.id)

            return (
              <div key={s.id}>

                {/* SPORT */}
<div className="notif-sport-block">
                <div
                  className={`cgm-chip cgm-sport-chip ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setManualFilters(prev => {
                      const next = { ...prev.sport_levels }

                      if (next[s.id]) delete next[s.id]
                      else next[s.id] = []

                      return {
                        ...prev,
                        sport_levels: next,
                        venue_ids: []
                      }
                    })
                  }}
                >
                  <div className="cgm-sport-icon">
                    <img
                      src={s.icon ? `/images/${s.icon}` : `/images/sports/${s.id}.png`}
                      alt={s.name_en}
                    />
                  </div>

                  {s.name_en || s.name}
                </div>

                {/* LEVELS */}
                {isSelected && (
                  <div className="notification-levels-vertical">
                    {LEVELS.map(level => {

                      const active = selectedLevels.includes(level)

                      return (
                        <div
                          key={level}
                          className={`cgm-chip cgm-level-chip ${active ? `active level-${level}` : ""}`}
                          onClick={() => {
                            setManualFilters(prev => {
                              const next = { ...prev.sport_levels }
                              const current = next[s.id] || []

                              next[s.id] = current.includes(level)
                                ? current.filter(l => l !== level)
                                : [...current, level]

                              return { ...prev, sport_levels: next }
                            })
                          }}
                        >
                          {t[`level_${level}`] || level}
                        </div>
                      )
                    })}
                  </div>
                )}
</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* VENUES */}
      <div className="profile-row">
        <div className="notification-label">
          {t.venue || "Venues"}
        </div>

        <div className="notif-venues-vertical">
          {venues
            .filter(v => !cityId || v.city_id === Number(cityId))
            .filter(v => {
              const selectedSportIds = Object.keys(manualFilters.sport_levels || {}).map(Number)

              if (selectedSportIds.length === 0) return true

              const venueSportIds = Array.isArray(v.sport_ids)
                ? v.sport_ids.map(Number)
                : []

              return selectedSportIds.every(sid =>
                venueSportIds.includes(sid)
              )
            })
            .map(v => (
              <div
                key={v.id}
                className={`cgm-chip cgm-venue-chip ${
                  manualFilters.venue_ids.includes(v.id) ? "active" : ""
                }`}
                onClick={() => {
                  setManualFilters(prev => ({
                    ...prev,
                    venue_ids: prev.venue_ids.includes(v.id)
                      ? prev.venue_ids.filter(id => id !== v.id)
                      : [...prev.venue_ids, v.id]
                  }))
                }}
              >
                {v.name}
              </div>
            ))}
        </div>
      </div>
    </>
  )
}