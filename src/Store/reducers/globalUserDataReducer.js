import * as actionTypes from "../actions";

const initialUserData = {
  user_id: "",
  email_id: '',
  totalUsers: null,
  token: "",
  anonymous_user: false,
  active_room_id: "",
  is_creator: false,
  is_spaceOwner: false,
  active_creation_name: "",
  active_space: "",
  joinedSpace: "",
  is_creator_online: true,
  sessionType: "",
  acceptance: false,
  creationType: "",
};

const globalUserDataReducer = (state = initialUserData, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_USER_DATA:
      let intermediateState = state;
      intermediateState = {
        ...intermediateState,
        ...action.payload.data,
      };
      return intermediateState;
    default:
      return state;
  }
};

export default globalUserDataReducer;
