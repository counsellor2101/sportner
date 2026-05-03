import { createContext, useContext, useState } from "react"

const CreateGameContext = createContext(null)

export function CreateGameProvider({ children }){

  const [createData, setCreateData] = useState(null)

  function openCreateGame(data = null){
    setCreateData(data)
  }

  function closeCreateGame(){
    setCreateData(null)
  }

  return (
    <CreateGameContext.Provider
      value={{ openCreateGame, closeCreateGame, createData }}
    >
      {children}
    </CreateGameContext.Provider>
  )
}

export function useCreateGame(){
  return useContext(CreateGameContext)
}