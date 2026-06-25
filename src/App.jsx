import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";


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

import { usePushPrompt } from "./push/usePushPrompt";
import PushPrompt from "./components/PushPrompt";
import { registerPushIfAlreadyGranted } from "./push/pushService";
import HomeLanding from "./pages/HomeLanding"

import FeedbackModalHost from "./components/FeedbackModalHost"


import Venues from "./pages/Venues";
import Privacy from "./pages/Privacy";
import Safety from "./pages/Safety";

import { Capacitor } from "@capacitor/core";
import { initNativePushListeners } from "./push/pushService";

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
const platform = Capacitor.getPlatform();
const isNative = Capacitor.isNativePlatform();

const push = usePushPrompt();

console.log("IS NATIVE:", isNative);

useEffect(() => {
  try {
    if (isNative) {
      localStorage.setItem("has_native_app", "1");
    }
  } catch {}
}, [isNative]);


useEffect(() => {
  if (!isNative) return;

  const token = localStorage.getItem("access_token");
  if (!token) return;

  registerPushIfAlreadyGranted();
  initNativePushListeners();

}, [isNative]);

useEffect(() => {

  function handleNativeFCMToken(event) {

    const token = event.detail?.token;

    if (!token) return;

    console.log(
      "🔥 CACHE NATIVE FCM TOKEN",
      token
    );

    window.nativeFCMToken = token;

    localStorage.setItem(
      "native_fcm_token",
      token
    );
  }

  window.addEventListener(
    "nativeFCMToken",
    handleNativeFCMToken
  );

  return () => {
    window.removeEventListener(
      "nativeFCMToken",
      handleNativeFCMToken
    );
  };

}, []);


// 🔥 Native push navigation (enterprise)
useEffect(() => {
  if (!isNative) return;

  let pushHandlerRef = null;
  let stateListenerRef = null;

  const pendingPathRef = { current: null };

  const setup = async () => {
    const { App } = await import("@capacitor/app");

    const pushHandler = (e) => {
  const path = e.detail?.path;
  if (!path) return;



  pendingPathRef.current = path;

  // 🔥 ако app вече е активен → навигирай веднага
  document.visibilityState === "visible" &&
    navigate(path.replace("https://sportner.online", ""));
};

    window.addEventListener("pushNavigate", pushHandler);
    pushHandlerRef = pushHandler;

    stateListenerRef = await App.addListener("appStateChange", (state) => {
      if (!state.isActive) return;

      const path = pendingPathRef.current;
      if (!path) return;



      const finalPath = path.replace("https://sportner.online", "");
      navigate(finalPath);

      pendingPathRef.current = null;
    });

    // 🔥 ако app вече е активен (foreground)
    const { isActive } = await App.getState();

    if (isActive && pendingPathRef.current) {
      const finalPath = pendingPathRef.current.replace("https://sportner.online", "");
      navigate(finalPath);
      pendingPathRef.current = null;
    }
  };

  setup();

  return () => {
    if (pushHandlerRef) {
      window.removeEventListener("pushNavigate", pushHandlerRef);
    }

    stateListenerRef?.remove?.();
  };
}, [isNative, navigate]);








useEffect(() => {
  if (!isNative) return;

  let listenerRef;
  let isActive = true;

  const setupDeepLinks = async () => {
    const { App } = await import("@capacitor/app");

    if (!isActive) return;

    listenerRef = await App.addListener("appUrlOpen", (event) => {
      const url = event.url;

      if (!url) return;

      const path = url.replace("https://sportner.online", "");

      navigate(path);
    });
  };

  setupDeepLinks();

  return () => {
    isActive = false;
    listenerRef?.remove?.();
  };
}, [navigate, isNative]);



function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

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

  const hasNativeApp =
    isNative || localStorage.getItem("has_native_app");

  function handler(e) {

    e.preventDefault();

    if (hasNativeApp) {
      return;
    }

    window.__installEvent = e;
  }

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };

}, [isNative]);







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

<Route
  path="/venues"
  element={
    <PrivateRoute>
      <Venues />
    </PrivateRoute>
  }
/>

<Route path="/privacy" element={<Privacy />} />

<Route path="/safety" element={<Safety />} />

<Route
  path="/landing"
  element={<HomeLanding />}
/>

<Route path="/reset-password" element={<ResetPassword />} />


</Routes>

<CreateGameRoot levels={["beginner","intermediate","advanced","pro"]} />

<FeedbackModalHost />

{push.visible && (
      <PushPrompt
  onAccept={push.accept}
  onDecline={push.decline}
  loading={push.loading}
  permission={push.permission}
/>
    )}


  </LoadingProvider>
);

}

export default App;
