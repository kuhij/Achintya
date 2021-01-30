import * as actionTypes from "../actions";

const initialUserData = {
  user_id: "",
  anonymous_user: false,
  active_room_id: "",
  active_userId: "",
  is_creator: false,
  is_new_user: false,
  active_creation_name: "",
  token: "",
  revert: false,
  active_space: "",
  totalUsers: 0,
  showMySpace: false,
  joinedSpace: "",
  joinedOther: false,
  is_creator_online: true,
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
