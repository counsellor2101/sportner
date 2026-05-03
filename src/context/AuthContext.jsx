import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 🔥 LOAD ME */

  useEffect(() => {
    async function fetchMe() {

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/me");
        setUser(res.data);
      } catch (e) {
        console.log("me error", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [token]);


async function refreshUser() {

  if (!token) return

  try {

    const res = await api.get("/me")
    setUser(res.data)

  } catch (e) {

    console.log("refresh user error", e)
    setUser(null)

  }

}


  /* LOGIN */

  function login(accessToken, refreshToken) {

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);

    setToken(accessToken);
  }

  /* LOGOUT */

  function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setToken(null);
    setUser(null);
  }

  return (

    <AuthContext.Provider value={{
      token,
      user,
      loading,
      login,
      logout,
      refreshUser // ✅ ТОВА Е FIX-А
    }}>
      {children}
    </AuthContext.Provider>

  );

}

export function useAuth(){
  return useContext(AuthContext);


}