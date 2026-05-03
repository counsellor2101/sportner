import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { shouldAskForPush } from "./push";
import PushPrompt from "./components/PushPrompt";
import { LoadingProvider } from "./context/loadingContext";
import GlobalLoader from "./components/GlobalLoader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Games from "./pages/Games";
import ResetPassword from "./pages/ResetPassword";
import Discover from "./pages/Discover";
import GameDetails from "./pages/GameDetails";
import Profile from "./pages/Profile";
import CreateGameRoot from "./components/CreateGameRoot";
import MyGames from "./pages/MyGames";
import Groups from "./pages/Groups";
import JoinGroup from "./pages/JoinGroup";
import Availability from "./pages/Availability";
import NotificationSettings from "./pages/NotificationSettings";
import Notifications from "./pages/Notifications";
import { initPush } from "./push";
import { setInstallPrompt } from "./install";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  if (!token) {
    const currentPath = location.pathname + location.search;

// ако е просто "/" → не слагаме redirect
if (currentPath === "/") {
  return <Navigate to="/login" replace />;
}

// save fallback
sessionStorage.setItem("pending_redirect", currentPath);

return (
  <Navigate
    to={`/login?redirect=${encodeURIComponent(currentPath)}`}
    replace
  />
);
  }

  return children;
}

function App(){
const navigate = useNavigate();
const location = useLocation();
const [showPushPrompt, setShowPushPrompt] = useState(false);

useEffect(() => {
  if (!navigator.serviceWorker) return;

  const handler = (event) => {
    if (event.data?.type === "NAVIGATE") {

      const url = event.data.url;
      const path = url.replace("https://sportner.online", "");

      navigate(path); // 🔥 това е всичко
    }
  };

  navigator.serviceWorker.addEventListener("message", handler);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handler);
  };

}, [navigate]);

useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    setShowPushPrompt(false);
    return;
  }

  const askedAt = localStorage.getItem("push_asked_at");

const recentlyAsked =
  askedAt && Date.now() - Number(askedAt) < 1000 * 60 * 60 * 24; // 24h

  if (recentlyAsked || !shouldAskForPush()) {
    setShowPushPrompt(false);
    return;
  }

  // 🔥 delay за UX
  const timer = setTimeout(() => {
    setShowPushPrompt(true);
  }, 1500);

  return () => clearTimeout(timer);

}, [location.pathname]);

useEffect(() => {
  function handlePushTrigger() {
    const askedAt = localStorage.getItem("push_asked_at");

const recentlyAsked =
  askedAt && Date.now() - Number(askedAt) < 1000 * 60 * 60 * 24; // 24h

    if (recentlyAsked || !shouldAskForPush()) return;

    setShowPushPrompt(prev => {
      if (prev) return prev; // 🔥 правилен guard
      return true;
    });
  }

  window.addEventListener("gameCreated", handlePushTrigger);
  window.addEventListener("gameJoined", handlePushTrigger);

  return () => {
    window.removeEventListener("gameCreated", handlePushTrigger);
    window.removeEventListener("gameJoined", handlePushTrigger);
  };
}, []);

useEffect(() => {
  async function autoRegisterPush() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (Notification.permission === "granted") {
      try {
        console.log("🔥 auto push register");

        await initPush(); // 🔥 това ти липсва

      } catch (e) {
        console.log("auto push error", e);
      }
    }
  }

  autoRegisterPush();
}, [location.pathname]);

useEffect(() => {
  function handler(e) {
    e.preventDefault();

    console.log("🔥 INSTALL READY (APP)");

    setInstallPrompt(e);
  }

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };
}, []);

return(
  <LoadingProvider>

    <GlobalLoader />

<Routes>

<Route path="/login" element={<Login />} />

<Route path="/register" element={<Register />} />

<Route path="/forgot-password" element={<ForgotPassword />} />

<Route path="/join-group" element={<JoinGroup />} />

<Route
path="/"
element={
<PrivateRoute>
<Discover/>
</PrivateRoute>
}
/>

<Route
path="/game/:id"
element={
  <PrivateRoute>
    <Discover/>
  </PrivateRoute>
}
/>

<Route
  path="/profile"
  element={
    <PrivateRoute>
      <Profile/>
    </PrivateRoute>
  }
/>

<Route
  path="/notifications"
  element={
    <PrivateRoute>
      <NotificationSettings />
    </PrivateRoute>
  }
/>

<Route
  path="/notifications-list"
  element={
    <PrivateRoute>
      <Notifications />
    </PrivateRoute>
  }
/>

<Route
  path="/my-games"
  element={
    <PrivateRoute>
      <MyGames/>
    </PrivateRoute>
  }
/>

<Route
  path="/groups"
  element={
    <PrivateRoute>
      <Groups />
    </PrivateRoute>
  }
/>

<Route
  path="/availability"
  element={
    <PrivateRoute>
      <Availability />
    </PrivateRoute>
  }
/>


<Route path="/reset-password" element={<ResetPassword />} />


</Routes>

<CreateGameRoot levels={["beginner","intermediate","advanced","pro"]} />

{showPushPrompt && (
  <PushPrompt onClose={() => setShowPushPrompt(false)} />
)}

<PWAInstallPrompt />

  </LoadingProvider>
);

}

export default App;