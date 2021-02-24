import React, { useEffect } from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import Views from "./Views/views";
// import CreationView from "./Views/CreationView";
import Home from "./Views/Home";
import Spaces from './Views/spaces'
// import CreateStatus from "./Views/CreateStatus";
// import Profile from './Views/Profile';
// import NotFound from "./Views/NotFound";
import firebaseapp from 'firebase';

export default function App() {
  var loggedInUser = firebaseapp.auth().currentUser;
  //var email = loggedInUser.email.split("@")[0]

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/:creatorId" > <Spaces /> </Route>
      </Switch>
    </Router>
  );
}

//createrId={creatorId}
