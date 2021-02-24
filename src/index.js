import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import globalStateReducer from "./Store/reducers/globalStateReducer";
import globalUserDataReducer from "./Store/reducers/globalUserDataReducer";
import './Style/index.css';

const rootReducers = combineReducers({
  globalState: globalStateReducer,
  globalUserData: globalUserDataReducer,
});

const store = createStore(rootReducers, composeWithDevTools());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
