import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace this with your own config object from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyADmPyv1uVn9dTqxFjqEE6EwRVPx9cZ_jI",
  authDomain: "sketch-to-3d-app.firebaseapp.com",
  projectId: "sketch-to-3d-app",
  storageBucket: "sketch-to-3d-app.firebasestorage.app",
  messagingSenderId: "65315871618",
  appId: "1:65315871618:web:7bfbd5f1e235edb7cb0d9b",
  measurementId: "G-D7D6TQHQVW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth service
export const auth = getAuth(app);