import "../styles/home-landing.css"
import { texts } from "../i18n/texts"
import "../styles/login.css";
import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"

export default function HomeLanding() {

  const lang = localStorage.getItem("lang") || "bg"
  const t = texts[lang] || texts.bg

const isApple =
  /iPhone|iPad|iPod|Macintosh/i.test(
    navigator.userAgent
  )

const storeLink = isApple
  ? "https://apps.apple.com/app/id6768100727"
  : "https://play.google.com/store/apps/details?id=com.sportner.app"

useEffect(() => {

  if (Capacitor.isNativePlatform()) {

    window.location.replace("/")

    return
  }

}, [])

useEffect(() => {

  const reveals =
    document.querySelectorAll(".reveal")

  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(entry => {

          if(entry.isIntersecting){

            entry.target.classList.add("active")

          }

        })

      },

      {
        threshold:0.15
      }

    )

  reveals.forEach(el => observer.observe(el))

  return () => observer.disconnect()

}, [])

  return (
   <div className="landing-page">

  <div className="landing-screen">

      {/* HERO */}

 <section className="landing-top">
<div className="landing-topbar">

{!isApple && (

<button
  type="button"
  className="landing-open-app"
  onClick={() => {

    window.location.href =
      "intent://sportner.online/#Intent;scheme=https;package=com.sportner.app;end"

    setTimeout(() => {

      window.location.href =
        "https://play.google.com/store/apps/details?id=com.sportner.app"

    }, 1500)

  }}
>

  <img
    src="/images/logotype.png"
    alt="Sportner"
    className="landing-open-app-logo"
  />

  <span>
    {t.openApp}
  </span>

</button>

)}


  <div className="landing-lang">
    <button
      type="button"
      className={lang === "bg" ? "active" : ""}
      onClick={() => {
        localStorage.setItem("lang", "bg")
        window.location.reload()
      }}
    >
      BG
    </button>

    <span>|</span>

    <button
      type="button"
      className={lang === "en" ? "active" : ""}
      onClick={() => {
        localStorage.setItem("lang", "en")
        window.location.reload()
      }}
    >
      EN
    </button>
  </div>
</div>

  <div className="landing-logo-wrap">
    <img
      src="/images/logo1.png"
      alt="Sportner"
      className="landing-logo"
    />
  </div>

</section>    



 <section className="landing-hero">


      

  





        <div className="landing-hero-content">

          <div className="landing-text">

            <h1>
              {t.heroTitle}
            </h1>

            <p>
              {t.heroSubtitle}
            </p>

            <div className="landing-buttons">

              <a
  href={storeLink}
  className="landing-btn primary"
>
  {t.download}
</a>

              <a
                href="/"
                className="landing-btn secondary"
              >
                {t.openWebApp}
              </a>

            </div>

          </div>







          <div className="landing-phone-wrapper">

            <div className="landing-phone">

              <img
                src="/images/discover_screen.png"
                alt="Discover"
              />

            </div>

          </div>

        </div>

      </section>


{/* STATS */}

<section className="landing-stats reveal">

  <div className="landing-stat-card">
    <h3>100+</h3>
    <p>{lang === "bg" ? "Спортни съоръжения" : "Sports Venues"}</p>
  </div>

  <div className="landing-stat-card">
    <h3>13</h3>
    <p>{lang === "bg" ? "Града" : "Cities"}</p>
  </div>

  <div className="landing-stat-card">
    <h3>8</h3>
    <p>{lang === "bg" ? "Спорта" : "Sports"}</p>
  </div>

  <div className="landing-stat-card">
    <h3>24/7</h3>
    <p>{lang === "bg" ? "Активна общност" : "Active Community"}</p>
  </div>

</section>






      {/* FEATURES */}

      <section className="landing-section reveal">

        <div className="landing-section-header">

          <h2>
            {t.sectionTitle}
          </h2>

          <p>
            {t.sectionSubtitle}
          </p>

        </div>







        {/* JOIN */}

        <div className="landing-feature reverse">

          <div className="landing-feature-phone">

            <img
              src="/images/join_screen.png"
              alt="Join games"
            />

          </div>






          <div className="landing-feature-text">

            <span>
              {t.joinGames}
            </span>

            <h3>
              {t.joinGamesTitle}
            </h3>

            <p>
              {t.joinGamesText}
            </p>

          </div>

        </div>









        {/* CREATE */}

        <div className="landing-feature">

          <div className="landing-feature-phone">

            <img
              src="/images/create_screen.png"
              alt="Create games"
            />

          </div>






          <div className="landing-feature-text">

            <span>
              {t.createGames}
            </span>

            <h3>
              {t.createGamesTitle}
            </h3>

            <p>
              {t.createGamesText}
            </p>

          </div>

        </div>










        {/* AVAILABILITY */}

        <div className="landing-feature reverse">

          <div className="landing-feature-phone">

            <img
              src="/images/availability_screen.png"
              alt="Availability"
            />

          </div>






          <div className="landing-feature-text">

            <span>
              {t.availability}
            </span>

            <h3>
              {t.availabilityTitle}
            </h3>

            <p>
              {t.availabilityText}
            </p>

          </div>

        </div>

      </section>










      {/* SPORTS */}

      <section className="landing-section reveal">

        <div className="landing-section-header">

        <h2>
          {t.sportsTitle}
        </h2>

   </div>




        <div className="landing-sport-grid">

          <div className="landing-sport-card">

  <img
    src="/images/padel_icon.png"
    alt="Padel"
    className="landing-sport-icon"
  />

  <span>Padel</span>

</div>

          <div className="landing-sport-card">
  <img
    src="/images/tennis_icon.png"
    alt="Tennis"
    className="landing-sport-icon"
  />
  <span>Tennis</span>
</div>

          <div className="landing-sport-card">
  <img
    src="/images/beachtennis_icon.png"
    alt="Beach tennis"
    className="landing-sport-icon"
  />
  <span>Beach tennis</span>
</div>

          <div className="landing-sport-card">
  <img
    src="/images/pickleball_icon.png"
    alt="Pickleball"
    className="landing-sport-icon"
  />
  <span>Pickleball</span>
</div>

          <div className="landing-sport-card">
  <img
    src="/images/basketball_icon.png"
    alt="Basketball"
    className="landing-sport-icon"
  />
  <span>Basketball</span>
</div>

          <div className="landing-sport-card">
  <img
    src="/images/volleyball_icon.png"
    alt="Volleyball"
    className="landing-sport-icon"
  />
  <span>Volleyball</span>
</div>

        </div>

      </section>

{/* VENUES */}

      <section className="landing-section reveal">

        <div className="landing-section-header">

    <h2>
      {lang === "bg"
        ? "Популярни спортни клубове"
        : "Popular Sports Venues"}
    </h2>

    <p>
      {lang === "bg"
        ? "Играй в едни от най-добрите спортни клубове в България"
        : "Play in some of the best sports clubs in Bulgaria"}
    </p>

  </div>





  <div className="landing-venue-grid">

    <div className="landing-venue-card">
      <h3>Padel Club Sofia</h3>
      <span>Sofia</span>
    </div>

    <div className="landing-venue-card">
      <h3>Padel Club AYA</h3>
      <span>Sofia</span>
    </div>

    <div className="landing-venue-card">
      <h3>BETVAM Padel Club</h3>
      <span>Varna</span>
    </div>

    <div className="landing-venue-card">
      <h3>MG Paradise Krastova Vada</h3>
      <span>Sofia</span>
    </div>

    <div className="landing-venue-card">
      <h3>Winbet Arena</h3>
      <span>Sofia</span>
    </div>

    <div className="landing-venue-card more">
      <h3>100+</h3>
      <span>
        {lang === "bg"
          ? "още места"
          : "more venues"}
      </span>
    </div>

  </div>

</section>








      {/* COMMUNITY */}

      <section className="landing-community reveal">

        <div className="landing-community-card">

          <h2>
            {t.communityTitle}
          </h2>

          <p>
            {t.communityText}
          </p>

        </div>

      </section>









      {/* CTA */}

      <section className="landing-cta reveal">

        <h2>
          {t.ctaTitle}
        </h2>

        <p>
          {t.ctaText}
        </p>






        <div className="landing-store-buttons">

  <a
    href="https://apps.apple.com/app/id6768100727"
    className="landing-store-link"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="/images/app_store.png"
      alt="Download on the App Store"
      className="landing-store-badge"
    />
  </a>

  <a
    href="https://play.google.com/store/apps/details?id=com.sportner.app"
    className="landing-store-link"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="/images/GetItOnGooglePlay_Badge.png"
      alt="Get it on Google Play"
      className="landing-store-badge"
    />
  </a>

</div>

      </section>









      {/* FOOTER */}

      <footer className="landing-footer">

        <img
          src="/images/logo.png"
          alt="Sportner"
          className="landing-footer-logo"
        />

        <p>
          {t.footer}
        </p>

      </footer>

    </div>
</div>
  )
}