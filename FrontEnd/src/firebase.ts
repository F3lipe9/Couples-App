import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6juRywMPDgik1DDq7t9VX_XcI_oUbsh8",
  authDomain: "coupleasapp.firebaseapp.com",
  projectId: "coupleasapp",
  storageBucket: "coupleasapp.firebasestorage.app",
  messagingSenderId: "1097119339976",
  appId: "1:1097119339976:web:45fe38509a82c2df409cfd",
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);