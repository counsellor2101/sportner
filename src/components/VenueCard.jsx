import "../styles/venue-card.css"

export default function VenueCard({ venue, cityMap, sportMap }){

  const city = cityMap[venue.city_id]
const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const venueSports = (venue.sport_ids || [])
    .map(id => sportMap[id])
    .filter(Boolean)

console.log("venue.city_id:", venue.city_id)
console.log("cityMap:", cityMap)
console.log("city found:", cityMap[venue.city_id])

  return (
    <div className="cgm-card">

      <div className="venue-name">
        {venue.name}
      </div>

<div className="venue-city">
<img src="/images/location_icon.png" className="row-icon" />
  {lang === "bg"
    ? city?.name_bg
    : city?.name_en}
</div>

      <div className="cgm-row-wrap venue-sports">
        {venueSports.map(s => (
          <div key={s.id} className="cgm-chip readonly">
            {s.icon && (
              <span className="cgm-row-icon">
                <img src={`/images/${s.icon}`} alt={s.name_en} />
              </span>
            )}
            <span>{s.name_en || s.name}</span>
          </div>
        ))}
      </div>

    </div>
  )
}