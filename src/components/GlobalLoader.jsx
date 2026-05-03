import { useLoading } from "../context/loadingContext"
import "../styles/loading.css"

export default function GlobalLoader() {
  const { loading } = useLoading()

  return (
    <div
      className={`global-loader-overlay ${
        loading.visible ? "show" : "hide"
      }`}
    >
      <div className="loader-wrapper">
        <div className="loader-orbit">
          <div className="loader-center" />
          <div className="loader-ball" />
          <div className="loader-ball" />
          <div className="loader-ball" />
        </div>
      </div>
    </div>
  )
}