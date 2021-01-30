import * as actionTypes from "../actions";

const initialState = {
  is_home_page: false,
  is_join_room: true,
  is_show_password: false,
  is_show_room: false,
  is_profile_page: false,
  is_about_page: false,
  is_buy_newSpace: false,
};

const globalStateReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_KEYS_TRUE:
      let intermediateState = { ...state };
      for (const [key] of Object.entries(state)) {
        if (action.payload.keys.includes(key)) {
          intermediateState[key] = true;
        } else {
          intermediateState[key] = false;
        }
      }
      return intermediateState;
    default:
      return state;
  }
};

export default globalStateReducer;
