import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAzQ0jVpurMyxCsDZF8uLGQrGJEQFnyRFE",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "syncly-5e3f3.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "syncly-5e3f3",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "syncly-5e3f3.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "785381918482",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:785381918482:web:ac9b089b2590a409cbd5cb",
};

const app = initializeApp(firebaseConfig);

export const getMessagingIfSupported = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};
