import firebase from "firebase";
import { View } from "react-native";

import './App.css';
import Login from './Login'
/*                           Firebase configurations                          */
/* -------------------------------------------------------------------------- */

import { FIREBASE_CONFIG } from "./constants";

/* --------------------------- Initialize Firebase -------------------------- */
const app = firebase.initializeApp(FIREBASE_CONFIG);
export const db = app.database();
export const fbDatabase = firebase.database();

export const firebaseAuth = firebase.auth();
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

function App() {
  return (
    <Login />
  );
}

export default App;
