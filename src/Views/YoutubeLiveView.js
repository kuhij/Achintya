import React, { useEffect, useState } from "react";
import { View, Dimensions } from "react-native";
import YouTube from "react-player";
import {
  useSwipeable,
  Swipeable,
  LEFT,
  RIGHT,
  UP,
  DOWN,
} from "react-swipeable";
import { TextField, Button, setRef } from "@material-ui/core";
import firebase from "firebase";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import YoutubeComp from "../Components/YoutubeComp";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  FormControlLabel,
  Switch,
  Snackbar,
} from "@material-ui/core";
import { GroupAdd, PersonAddDisabled, ExitToApp } from "@material-ui/icons";

import MuiAlert from "@material-ui/lab/Alert";
import { withStyles } from "@material-ui/core/styles";
import { yellow } from "@material-ui/core/colors";
import VideoRoom from "./VideoRoom";



const YellowSwitch = withStyles({
  switchBase: {
    color: yellow[300],
    "&$checked": {
      color: yellow[500],
    },
    "&$checked + $track": {
      backgroundColor: yellow[500],
    },
  },
  checked: {},
  track: {},
})(Switch);

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const { width, height } = Dimensions.get("window");

export default function YoutubeLiveView({ loggedUser, host, primaryPresence, turn }) {
  const history = useHistory();

  const [myName, setMyname] = useState("")


  const [creatorReleaseTurn, setCreatorReleaseTurn] = useState(false);



  const [videoCallScreen, setVideoCallScreen] = useState(false);
  const [youtubeScreen, setYoutubeScreen] = useState(false);



  useEffect(() => {
    // firebase
    //   .database()
    //   .ref(`/${loggedUser}/being`)
    //   .on("value", (snap) => {
    //     fetchVidFromChannel(snap.val());
    //   });

    firebase.database().ref(`/${loggedUser}/`).update({
      space: "self",
    });

  }, []);


  useEffect(() => {
    var authUid = firebase.auth().currentUser;
    setMyname(authUid.email.split("@")[0])

    firebase.messaging().onMessage((payload) => {

      console.log("on message works!", payload.data);
    });
  }, [loggedUser]);

  useEffect(() => {
    if (turn !== myName) {
      setYoutubeScreen(true);
      setVideoCallScreen(false);
    }
    // firebase.database().ref(`/${loggedUser}`).onDisconnect().remove();
  });



  //another creator id to whom i joined
  useEffect(() => {
    if (!host) {
      setYoutubeScreen(true);

    } else {
      setVideoCallScreen(true);

    }
  }, [firebase.database().ref(`/${loggedUser}/turn`)]);

  const fetchVidFromChannel = async (videoId) => {
    // const live =
    //   "https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&channelId=" +
    //   channel +
    //   "&eventType=live&type=video&key=AIzaSyDRpDTn-sFBq6be1b-8fZTdBWc3-1vwoLw";
    const live =
      "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" +
      videoId +
      "&key=AIzaSyDReEVZ4A6hTOvAK4HduYlt14Exm5iTR00";
    const response = await fetch(live);
    const data = await response.json();
    console.log(data);
    if (data.items.length === 0) {
      alert("NO LIVE YET !!!");
    } else {

      //setHost(true);
      await firebase.database().ref(`/${loggedUser}/`).update({
        space: "self",
      });

    }
  };

  function onSwiping({ dir }) {
    if (dir === LEFT) {
      if (!videoCallScreen) {
        setVideoCallScreen(true);
      }
    } else if (dir === RIGHT) {

      if (videoCallScreen) {
        setVideoCallScreen(false);
      }
    }
  }

  return (
    <>
      <Swipeable
        onSwiped={(eventData) => onSwiping(eventData)}
        preventDefaultTouchmoveEvent={true}
        trackMouse={true}
        className="swiping"
        style={{ height: "100%", overflow: "hidden" }}
      >
        {!host && turn !== myName ? (
          <>
            <View
              style={{
                height: height,
                width: width,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <YoutubeComp videoId={primaryPresence} opacity={1} />
            </View>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                background: "black",
                opacity: 0.0,
                height: "100%",
                width: "100%",
              }}
            ></View>
          </>
        ) : (host && videoCallScreen) || (turn === myName) ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              backgroundColor: "#fff",
              height: height,
              width: width,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <VideoRoom
              username={loggedUser}
              spaceOwner={host}
              creator={host}
            />
          </View>
        ) : null}

      </Swipeable>



      <View
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          padding: 10,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      >


      </View>
    </>
  );
}
