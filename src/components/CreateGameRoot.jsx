import { createPortal } from "react-dom"
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import CreateGameModal from "./CreateGameModal"
import { useCreateGame } from "../context/CreateGameContext"

export default function CreateGameRoot({ levels }){

  const { createData, closeCreateGame } = useCreateGame()
  const location = useLocation()

  useEffect(() => {

    const blockedRoutes = [
      "/join-group",
      "/login",
      "/register"
    ]

    if (blockedRoutes.includes(location.pathname)) {
      closeCreateGame()
    }

  }, [location.pathname])

  if (!createData) return null

  return createPortal(
    <CreateGameModal
      initialData={createData}
      onClose={closeCreateGame}
      levels={levels}
    />,
    document.body
  )
}