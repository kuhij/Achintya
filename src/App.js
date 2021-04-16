import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Login from './components/login'
import Spaces from './components/spaces'
import TopCreators from "./components/topcreators";

import firebase from "./config";
import 'antd/dist/antd.css';

function App() {
  return (
    <div>
      <Router>
        <Switch>
          <Route exact path="/">
            <TopCreators />
          </Route>
          <Route exact path="/space/:spaceId">
            <Spaces />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
