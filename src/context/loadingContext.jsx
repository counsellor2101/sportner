import { createContext, useContext, useState, useCallback, useEffect } from "react"

const LoadingContext = createContext()

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState({
    visible: false,
    text: "",
    subtext: ""
  })

useEffect(() => {
  const handleStart = () => {

    setLoading({
      visible: true,
      text: "",
      subtext: ""
    });
  };

  const handleEnd = () => {


    setLoading({
      visible: false,
      text: "",
      subtext: ""
    });
  };

  window.addEventListener("globalLoadingStart", handleStart);
  window.addEventListener("globalLoadingEnd", handleEnd);

  return () => {
    window.removeEventListener("globalLoadingStart", handleStart);
    window.removeEventListener("globalLoadingEnd", handleEnd);
  };
}, []);

  const showLoading = useCallback((text = "Зареждане...", subtext = "") => {
    setLoading({
      visible: true,
      text,
      subtext
    })
  }, [])

  const hideLoading = useCallback(() => {
    setLoading(prev => ({
      ...prev,
      visible: false
    }))
  }, [])

  return (
    <LoadingContext.Provider
      value={{
        loading,
        showLoading,
        hideLoading
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)

  if (!context) {
    throw new Error("useLoading must be used inside LoadingProvider")
  }

  return context
}