import { texts } from "../i18n/texts"
import "../styles/promotion-card.css"

export default function PromotionCard({ promotion }) {

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg

  function handleClick(){

    if (!promotion.button_link) return

    window.location.href = promotion.button_link
  }

  return (

    <div
  className={`timeline-promotion-card timeline-promotion-${promotion.type}`}
  onClick={handleClick}
  role="button"
  tabIndex={0}
>

      <div className="timeline-promotion-badge">
  {promotion.type === "complete_profile"
    ? "COMPLETE PROFILE"
    : t.promotion_featured}
</div>

      <div className="timeline-promotion-title-row">

  {promotion.sport_icon && (
    <img
      className="timeline-promotion-sport-icon"
      src={`/images/${promotion.sport_icon}`}
      alt=""
    />
  )}

  <div className="timeline-promotion-title">
    {promotion.title}
  </div>

</div>

      {promotion.subtitle && (
        <div className="timeline-promotion-subtitle">
          {promotion.subtitle}
        </div>
      )}

    </div>

  )
}