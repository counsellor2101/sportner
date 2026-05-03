import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";


const firebaseConfig = {
  apiKey: "AIzaSyB4DTCXQWrMzrio1OmxwVPjKeGdX7vTHZ4",
  authDomain: "sportner-4746a.firebaseapp.com",
  projectId: "sportner-4746a",
  storageBucket: "sportner-4746a.firebasestorage.app",
  messagingSenderId: "318493173925",
  appId: "1:318493173925:web:5f84875d3de02d2e1b454c"
};


const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);