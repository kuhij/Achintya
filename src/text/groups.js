import { db, storageRef, database, messaging } from "../App";
import firebase from "firebase";

import React, { useEffect, useState, useRef, Component } from "react";
import { Dimensions, Text, TextInput, View, ScrollView } from "react-native";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";

import {
  Snackbar,
} from "@material-ui/core";

import Alert from '@material-ui/lab/Alert';

import RecordPage from './RecordRTC';
import VideoRoom from '../webRTC/videoRoom'

import { useSelector } from "react-redux";
import swal from "sweetalert";

import CryptoJS from 'crypto-js'

import { Crypt, RSA } from 'hybrid-crypto-js';

import useActionDispatcher from "../Hooks/useActionDispatcher";
import { useHistory } from "react-router-dom";
import Donation from "../donation";

const { width, height } = Dimensions.get("window");

const initialState = {
  value: "",
  amount: null
};

let obj = { data: {} }


export default function TextBroadCast(props) {
  const history = useHistory();

  const [state, setState] = useState(initialState);
  const [count, setCount] = useState(0);
  const [guest, setGuest] = useState(false);
  const [status, setStatus] = useState("");
  const [showRecording, setShowRecording] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoURL, setVideoURL] = useState("")
  const [isprivate, setPrivate] = useState(false)

  const [balance, setBalance] = useState(null)
  const [video, setVideo] = useState(false)
  const [firestore, setFirestore] = useState(null)

  const [turn, setTurn] = useState("")
  const [requester, setRequester] = useState("")
  const [accceptance, setAcceptance] = useState(false)
  const [main, setMain] = useState(true)

  const [replayText, setReplayText] = useState(null)
  const [message, setMessage] = useState("")
  const [messgOwner, setOwner] = useState("")
  const [singleLetter, setSingle] = useState("")
  const [join, setJoin] = useState(false)

  const textInputRef = useRef();
  const recordedMessage = useRef();

  const dispatchAction = useActionDispatcher();
  const user_data = useSelector((state) => state.globalUserData);
  const [word, setWord] = useState("")

  const handleChange = (e) => {
    setState((s) => ({
      ...s,
      amount: e,
    }));
  }

  useEffect(() => {
    messaging.onMessage((payload) => {
      //const obj = JSON.parse(payload.data.status)
      // const update = obj.data
      // setReplayText(update)
      // setOwner(obj.name)
      console.log("on message works!", payload);
    });
  }, [])

  // useEffect(() => {
  //   if (replayText !== null) {
  //     replay()
  //   }

  // }, [replayText])

  const replay = () => {
    const keyArr = Object.keys(replayText)
    const valArr = Object.values(replayText)
    let fullTimeline = "";
    let count = 0

    let counter = parseInt(keyArr[count]) - parseInt(keyArr[count])
    var myFunction = async function () {
      console.log(counter, valArr[count]);
      fullTimeline = fullTimeline += valArr[count]
      setMessage(fullTimeline)

      count = await count + 1
      counter = parseInt(keyArr[count]) - parseInt(keyArr[count - 1])
      const timer = setTimeout(myFunction, counter);

      if (keyArr[count] === undefined || keyArr[count] === null) {
        clearTimeout(timer)
        setTimeout(() => {
          setMessage("")
        }, 5000);
        //alert('Replay stream finished')
      }

    }
    setTimeout(myFunction, counter)
  }

  const writerFunction = (status) => {

    /*----------------- Read host status from rtdb-------------------*/
    status.on("value", function (snapshot) {

      setStatus(snapshot.val().status);
      setTurn(snapshot.val().turn)
      setRequester(snapshot.val().call_request)

      //console.log(snapshot.val().status, snapshot.val().turn);
    });

  };

  //fetching current data from rtdb -- text/video
  const keyPressFunction = async (ref) => {
    let url;
    let totalCost = 0
    ref.on("value", function (snapshot) {
      if (snapshot.val()) {
        if (snapshot.val().currentLetter === null) {
          return null;
        } else {
          const current = snapshot.val().currentLetter;

          if (current === "Backspace") {
            setState((e) => ({
              ...e,
              value: e.value.slice(0, -1),
            }));
          } else if (current === "Enter") {
            setState((e) => ({
              ...e,
              value: e.value + "\n",
            }));
          } else if (current.substring(0, 8) === "https://") {
            url = current   //if video url is there.
            setShowVideo(true);
            setVideoURL(url)
          } else {
            setState((e) => ({
              ...e,
              value: e.value + current,
            }));
          }
        }
      }
    });
  };

  useEffect(() => {
    if (singleLetter !== "") {
      //let date = Date.now()

      obj["name"] = turn
      obj["data"][Date.now()] = singleLetter
      setFirestore(obj)
      if (!user_data.is_creator) {
        setState((e) => ({
          ...e,
          value: e.value + singleLetter,
        }));
        //singleLetter("")
      }

      console.log(firestore, state.value);
    }

  }, [singleLetter])

  const listening = () => {
    let docRef;

    if (props.creator) {
      docRef = db.ref(`/Spaces/${props.spaceId}/data`);
    } else {
      docRef = db.ref(`/Spaces/${user_data.joinedSpace}/data`);
    }
    keyPressFunction(docRef);
  };

  const fetchingWriter = async () => {
    let writerStatus;

    if (props.creator) {
      writerStatus = db.ref(`/Spaces/${props.spaceId}/`)
    } else {
      writerStatus = db.ref(`/Spaces/${user_data.joinedSpace}/`)
    }
    writerFunction(writerStatus)
  }

  const spaceOwnerData = async () => {
    //checking for name presence.

    if (props.creator) {
      if (props.spaceId) {

        // db.ref(`/Spaces/${props.spaceId}/`).onDisconnect().update({
        //   online: false,
        //   //balance: firebase.database.ServerValue.increment(-cost)
        // });

        db.ref(`/Spaces/${props.spaceId}/data`).update({
          currentLetter: "",
          time: firebase.database.ServerValue.TIMESTAMP
        });

        // await db.ref(`/Spaces/${props.spaceId}/`).update({
        //   call_request: "",
        //   count: firebase.database.ServerValue.increment(1),
        //   turn: props.spaceId,
        //   status: 'host',
        //   online: true
        // })

        listening();

      }

    } else {
      console.log('not a creator');

    }

    await fetchingWriter();

  };

  const fetchUpdate = () => {
    spaceOwnerData();
  };

  useEffect(() => {
    console.log(props.creator, props.spaceId);
    fetchUpdate();
  }, []);

  //sending letter by letter to rtdb.
  const handleInput = async (event) => {
    const date = Date.now();

    const current = event.nativeEvent.key;

    let docRef;

    if (props.creator) {
      docRef = db.ref(`/Spaces/${props.spaceId}/data`);
    } else {
      docRef = db.ref(`/Spaces/${user_data.joinedSpace}/data`);
    }

    if (current === "Enter") {
      textInputRef.current.focus();
    }

    //while deleting the letters, speaker name shouldn't be deleted
    if (current === "ArrowRight" || current === "ArrowLeft" || current === "ArrowUp" || current === "ArrowDown" || current === "Escape") {
      return null;
    } else if (current === " ") {

      let wrd = word + " "
      setSingle(wrd)


      docRef.update({ currentLetter: wrd, time: date }).then(() => {
        textInputRef.current.focus();
      })
      setWord("")
    } else {
      setWord(word + current)
    }
    console.log(word);
  };

  const sendRequest = () => {
    let id = Math.random().toString(36).slice(2)
    db.ref(`/Spaces/${user_data.joinedSpace}/`).update({ call_request: props.spaceId, status: "waiting" }).then(() => {
      alert("request send! wait for acceptance...")
    })
  }

  const getTurn = async () => {

    if (user_data.is_creator) {
      db.ref(`/Spaces/${props.spaceId}/`).update({ status: "host", turn: props.spaceId });
      db.ref(`/Spaces/${props.spaceId}/webRTC/message/`).update({
        callRequest: 'none'
      })
      setState((s) => ({
        ...s,
        value: "",
      }));
    } else {
      sendRequest()
    }

    textInputRef.current.focus();

  };

  const leaveTurn = () => {

    if (user_data.is_creator) {
      db.ref(`/Spaces/${props.spaceId}/`).update({ status: "" });

    } else {
      setAcceptance(false)
      db.ref(`/Spaces/${user_data.joinedSpace}/`).update({ status: "host", turn: user_data.joinedSpace });
      db.ref(`/Spaces/${user_data.joinedSpace}/webRTC/message/`).update({
        callRequest: 'none'
      })
      setState((s) => ({
        ...s,
        value: "",
      }));
    }

    textInputRef.current.focus();
  };

  const acceptRequest = () => {
    db.ref(`/Spaces/${props.spaceId}/`).update({ status: "guest", turn: requester, call_request: "" });
  }

  const rejectRequest = () => {
    db.ref(`/Spaces/${props.spaceId}/`).update({ call_request: "" });
  }

  const sendMessage = () => {

    firebase.firestore().collection("Spaces").doc(props.spaceId).collection("creations").doc('something').collection("Text").add({
      message: JSON.stringify({ name: props.spaceId, data: { [Date.now()]: state.value } })
    }).then(() => {
      setState({
        value: ""
      })
    })
  }

  const onSwiping = async ({ dir }) => {
    if (dir === UP) {
      console.log('up');
      setVideo(true)
    }
    if (dir === RIGHT) {
      console.log('right');
      if (video === true) {
        setMain(true)
      } else {
        setShowRecording(false)
      }

      // if (!user_data.is_creator) {
      //   setDonate(true)
      // }

    }
    if (dir === LEFT) {
      if (guest) {
        setShowRecording(true)
      } else if (video === true) {
        setMain(false)
      } else {
        alert('sorry, you can \'t send video message')
      }
    } if (dir === DOWN) {
      setVideo(false)
      //setDonate(true)
    }
  }

  const autoFocus = () => {
    textInputRef.current.focus();
  }

  useEffect(() => {
    console.log(isprivate);
    setState({
      value: ""
    })
    // db.ref(`/Spaces/${props.spaceId}/`).update({
    //   available: isprivate === true ? "public" : "private"
    // })
  }, [isprivate])


  return (
    <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} >
      {!join ?
        <View>
          <View
            style={{
              shadowOpacity: 4,
              width: width,
              overflowY: "auto",
              height: height * 0.85,
              marginTop: showVideo === false ? '18px' : null,
              zIndex: 99999,
              overscrollBehaviorY: "contain",
              scrollSnapType: "y proximity",
            }}
            onClick={autoFocus}
          >
            <View>
              <View style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 5, fontFamily: 'cursive' }}>{turn}</View>
              <View style={{ height: 1, background: 'black', marginBottom: 12 }}></View>
              <Text
                style={{
                  marginLeft: showVideo === false ? '10px' : null,
                  fontSize: 15.5,
                  paddingRight: showVideo === false ? '18px' : null,
                  overscrollBehaviorY: "contain",
                  scrollSnapType: "y proximity",
                  scrollSnapAlign: "end",
                }}
              >

                {/* <>
                  {state.value === "" ?
                    (<span>{message}</span>)
                    :
                    null
                  }
                </> */}
                <View style={{ display: 'flex', flexFlow: 'row' }}>
                  <span style={{ letterSpacing: 1 }}>{state.value}</span>
                  <span style={{ letterSpacing: 1 }}>{word}</span>
                  <TextInput
                    name="usertext"
                    multiline={true}
                    numberOfLines={1}
                    style={{
                      outline: "none",
                      border: "none",
                      color: "#888888",
                    }}
                    id="standard-multiline-flexible"
                    style={{ outline: "none", width: 2, position: 'absolute' }}
                    value=""
                    onKeyPress={handleInput}
                    autoFocus={true}
                    editable={true}
                    ref={textInputRef}
                  />
                </View>
              </Text>
            </View>
          </View>

        </View>
        :
        <View>
          <TextField id="standard-basic" label="Standard" onChange={handleChange()} />
          <br />
          <Button variant="contained" color="primary">
            Primary
      </Button>
        </View>
      }
    </Swipeable>
  )
}
