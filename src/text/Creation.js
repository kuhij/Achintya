import * as firebase from "firebase";
import Groups from "./groups";
import React, { useEffect, useState, useRef } from "react";
import { Dimensions, Text, TextInput, View } from "react-native";
import {
  useSwipeable,
  Swipeable,
  LEFT,
  RIGHT,
  UP,
  DOWN,
} from "react-swipeable";
import { useSelector } from "react-redux";
//import SpacesList from "../spaces";
import useActionDispatcher from "../Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";
import { useHistory, useParams } from "react-router-dom";
import swal from "sweetalert";
import { messaging, database, db } from '../App'
//import PrivateSession from './privateSession'

export default function Creation(props) {
  const { username } = useParams();
  const dispatchAction = useActionDispatcher();

  const user_data = useSelector((state) => state.globalUserData);

  const [count, setCount] = useState(0);

  const [open, setOpen] = useState(false)
  const [privateCall, setPrivate] = useState(false)

  const onSwiping = ({ dir }) => {
    if (dir === DOWN) {
      setCount(count - 1)
    }
    if (dir === UP) {
      setCount(count + 1)
      setOpen(true)
      setPrivate(true)
    }
  };

  return (
    <Swipeable
      onSwiped={(eventData) => onSwiping(eventData)}
      preventDefaultTouchmoveEvent={true}
      trackMouse={true}
      style={{ height: "100%", width: '100%' }}
    >

      <View
        style={{
          shadowOpacity: 4,
          width: "100%",
          marginRight: "4px",
          overflow: 'hidden',
          height: "100%",
        }}
      >
            <Groups
              spaceId={username}
              creator={user_data.is_creator}
            />
         
      </View>
    </Swipeable>
  );
}
