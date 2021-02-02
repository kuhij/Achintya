import firebase from "firebase";

import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";

import './App.css';
import Login from './Login'
import Creation from './text/Creation';
/*                           Firebase configurations                          */
/* -------------------------------------------------------------------------- */

import { FIREBASE_CONFIG } from "./constants";

/* ------------------------------ Redux imports ----------------------------- */
import globalStateReducer from "./Store/reducers/globalStateReducer";
import globalUserDataReducer from "./Store/reducers/globalUserDataReducer";

/* --------------------------- Initialize Firebase -------------------------- */
const app = firebase.initializeApp(FIREBASE_CONFIG);
export const db = app.database();

export const storageRef = firebase.storage().ref();
export const fbDatabase = firebase.database();
export const database = firebase.firestore()
export const messaging = app.messaging();
export const firebaseAuth = firebase.auth();
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
messaging.usePublicVapidKey("BOMtci_z8K7FLTKJcdlg8tQcMmNGhyn-wQesDCm-p24J6Js1x7UPU2k6TBwSY684KZtd9KCRk5uZkueK3C1IO5k");


/*                             Redux Configuration                            */
/* -------------------------------------------------------------------------- */
const rootReducers = combineReducers({
  globalState: globalStateReducer,
  globalUserData: globalUserDataReducer,
});

const store = createStore(rootReducers, composeWithDevTools());
/* ----------------------------------- end ---------------------------------- */

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Switch>
          <Route exact path="/" component={Login} />
          <Route exact path="/:username" component={Creation} />
        </Switch>
      </Router>
      {/* <Login /> */}
    </Provider>

  );
}

export default App;
