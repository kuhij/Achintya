import { db, storageRef, database, messaging } from "../App";
import * as firebase from "firebase";

import React, { useEffect, useState, useRef, Component } from "react";
import { Dimensions, Text, TextInput, View, ScrollView } from "react-native";
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";

import {
  Snackbar,
} from "@material-ui/core";

import Alert from '@material-ui/lab/Alert';

import { Button } from "@material-ui/core";

import RecordPage from './RecordRTC';
import VideoRoom from '../webRTC/videoRoom'

import { useSelector } from "react-redux";
import swal from "sweetalert";

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

  const textInputRef = useRef();
  const recordedMessage = useRef();

  const dispatchAction = useActionDispatcher();
  const user_data = useSelector((state) => state.globalUserData);

  const handleChange = (e) => {
    setState((s) => ({
      ...s,
      amount: e,
    }));
  }

  useEffect(() => {
    messaging.onMessage((payload) => {
      const obj = JSON.parse(payload.data.status)
      const update = obj.data
      setReplayText(update)
      setOwner(obj.name)
      console.log("on message works!", payload, payload.data, update);
    });
  }, [])

  useEffect(() => {
    if (replayText !== null) {
      replay()
    }

  }, [replayText])

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
      //console.log(snapshot.val());
      if (snapshot.val().status === "waiting") {
        setState((s) => ({
          ...s,
          value: "",
        }));
      }
      if (snapshot.val().turn === props.spaceId && !user_data.is_creator) {
        setAcceptance(true)
      }
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

          // db.ref(`/Users/${props.spaceId}/count`).on("value", function (snapshot) {
          //   totalCost = totalCost + parseInt(current.length * parseInt(snapshot.val()))

          //   console.log('cost: ', totalCost, current.length, 'people ', snapshot.val());
          //   setCost(totalCost)
          // })

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
    if (user_data.is_creator) {
      docRef = db.ref(`/Users/${props.spaceId}/data`);
    } else {
      docRef = db.ref(`/Users/${user_data.joinedSpace}/data`);
    }
    keyPressFunction(docRef);
  };

  const fetchingWriter = async () => {
    let writerStatus;
    if (user_data.is_creator) {
      writerStatus = db.ref(`/Users/${props.spaceId}/`)
    } else {
      writerStatus = db.ref(`/Users/${user_data.joinedSpace}/`)
    }
    writerFunction(writerStatus)
  }

  const subscription = () => {
    let id = Math.random().toString(36).slice(2)

    database.collection("actions").doc(id).set({
      subscription: user_data.joinedSpace,
      fcmtoken: user_data.token,
      time: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      localStorage.setItem("docId", id);
    })
  }

  const spaceOwnerData = async () => {
    if (props.spaceId) {    //checking for name presence.
      const firstName = `${props.spaceId.charAt(0).toUpperCase() + props.spaceId.slice(1)}:  `

      if (user_data.is_creator) { // for owner.

        db.ref(`/Users/${props.spaceId}/`).onDisconnect().update({
          online: false,
          //balance: firebase.database.ServerValue.increment(-cost)
        });

        await db.ref(`/Users/${props.spaceId}/`).update({
          call_request: "",
          count: firebase.database.ServerValue.increment(1),
          turn: props.spaceId,
          status: 'host',
          online: true
        })

        db.ref(`/Users/${props.spaceId}/data`).update({
          currentLetter: "",
        })

        listening();

      } else {

        await db.ref(`/Users/${props.spaceId}/`).update({
          balance: firebase.database.ServerValue.increment(-1),
        });
        await db.ref(`/Users/${user_data.joinedSpace}/`).update({
          count: firebase.database.ServerValue.increment(1),
        })

        db.ref(`/Users/${user_data.joinedSpace}/`).onDisconnect().update({
          count: firebase.database.ServerValue.increment(-1),
        });

        let snap = localStorage.getItem("docId")
        if (snap === null) {
          subscription()
        } else {

          database.collection("actions").doc(snap).update({
            subscription: "none",
            fcmtoken: user_data.token,
          }).then(() => {
            subscription()
          })
        }

      await fetchingWriter();

    }
  };

  const fetchUpdate = () => {
    spaceOwnerData();
    console.log(requester);
  };

  useEffect(() => {
    console.log(user_data.is_creator, user_data.joinedSpace);
    fetchUpdate();
  }, []);

  //sending letter by letter to rtdb.
  const handleInput = async (event) => {
    const date = Date.now();

    const current = event.nativeEvent.key;

    let docRef;
    if (isprivate === false) {

      if (user_data.is_creator) {
        docRef = db.ref(`/Users/${props.spaceId}/data`);
      } else {
        docRef = db.ref(`/Users/${user_data.joinedSpace}/data`);
      }

      if (current === "Enter") {
        textInputRef.current.focus();
      }
      docRef.once("value", async function (snapshot) {

        //while deleting the letters, speaker name shouldn't be deleted
        if (state.value.substring(state.value.length - 3, state.value.length) === ":  " && current === "Backspace") {
          return null;
        } else if (current === "ArrowRight" || current === "ArrowLeft" || current === "ArrowUp" || current === "ArrowDown" || current === "Escape") {
          return null;
        } else if (current === "Tab") {
          setSingle(current)
          docRef.update({ currentLetter: "      ", time: date }).then(() => {
            textInputRef.current.focus();
          })
        } else {
          setSingle(current)
          docRef.update({ currentLetter: current, time: date }).then(() => {
            textInputRef.current.focus();
          })
        }
      });
    } else {
      setSingle(current)
      setState({
        value: state.value + current
      })

    }
  };

  const sendRequest = () => {
    let id = Math.random().toString(36).slice(2)
    db.ref(`/Users/${user_data.joinedSpace}/`).update({ call_request: props.spaceId, status: "waiting" }).then(() => {
      alert("request send! wait for acceptance...")
    })
  }

  const getTurn = async () => {

    if (user_data.is_creator) {
      db.ref(`/Users/${props.spaceId}/`).update({ status: "host", turn: props.spaceId });
      db.ref(`/Users/${props.spaceId}/webRTC/message/`).update({
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
      db.ref(`/Users/${props.spaceId}/`).update({ status: "" });
      database.collection("Creations").add({
        message: JSON.stringify(firestore)
      }).then(() => {
        setFirestore(null)
        //obj = {}
      })
    } else {
      setAcceptance(false)
      db.ref(`/Users/${user_data.joinedSpace}/`).update({ status: "host", turn: user_data.joinedSpace });
      db.ref(`/Users/${user_data.joinedSpace}/webRTC/message/`).update({
        callRequest: 'none'
      })
      setState((s) => ({
        ...s,
        value: "",
      }));
      database.collection("Creations").add({
        message: JSON.stringify(firestore)
      }).then(() => {
        setFirestore(null)
        //obj = {}
      })
    }

    textInputRef.current.focus();
  };

  const acceptRequest = () => {
    db.ref(`/Users/${props.spaceId}/`).update({ status: "guest", turn: requester, call_request: "" });
  }

  const rejectRequest = () => {
    db.ref(`/Users/${props.spaceId}/`).update({ call_request: "" });
  }

  // Register event lister for "ENTER" key press to take turn for write
  useEffect(() => {
    const listener = (event) => {
      //Escape
      if (event.keyCode === 27) {
        db.ref(`/Users/${props.spaceId}/`).update({
          eventStatus: 'end'
        })
      }
    };

    // register listener
    document.addEventListener("keydown", listener);

    // clean up function, un register listener on component unmount
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  const sendMessage = () => {

    firebase.firestore().collection("Users").doc(props.spaceId).collection("creations").doc('something').collection("Text").add({
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
  }, [isprivate])


  return (
    <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} >
      <View>
        {showRecording === true && user_data.revert === false ?
          <RecordPage spaceId={props.spaceId} /> :
          video === true ?
            <View>
              {(!user_data.is_creator && status === "guest" && accceptance === true) ?
                <VideoRoom username={user_data.joinedSpace} selfName={props.spaceId} creator={false} main={main} />
                : user_data.is_creator ?
                  <VideoRoom username={props.spaceId} creator={true} main={main} /> : null}
            </View>
            :
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
              {balance <= 0 ? null :
                <Text style={{ marginLeft: width - ((10 / 100) * width), position: 'absolute' }}>Balance: {balance}</Text>}
              <View>
                <View style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 5, fontFamily: 'cursive' }}>{turn}</View>
                {!user_data.is_creator ?
                  <Donation receiver={user_data.joinedSpace} />
                  : <button style={{ border: 'none', fontSize: 16, fontFamily: 'auto', position: 'absolute', width: '10%', background: 'none' }} onClick={() => setPrivate(!isprivate)}>{isprivate === true ? "Public" : "Private"}</button>}
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
                  {showVideo === true ?
                    <View style={{ height: '100%', width: showVideo === true ? '100%' : null }}>
                      <img src="./right-arrow.png" style={{ height: 40, width: 40, marginTop: 30, marginLeft: width / 0.5, position: 'absolute', cursor: 'pointer', zIndex: 100 }} alt="skip" onClick={() => setShowVideo(false)} />
                      <video style={{ width: width, height: height, overflow: 'hidden' }} src={videoURL} ref={recordedMessage} onEnded={() => setShowVideo(false)} autoPlay playsInline></video>
                    </View>
                    :
                    <View>
                      {!user_data.is_creator ?
                        <>
                          {state.value === "" ?
                            <Text>{message}</Text>
                            :
                            <Text>{state.value}</Text>
                          }
                        </>
                        :
                        <span style={{ letterSpacing: 1 }}>{state.value}</span>
                      }
                    </View>

                  }

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
                      editable={user_data.is_creator ? status === "host" : (status === "guest" && accceptance === true || turn === props.spaceId)}
                      ref={textInputRef}
                    />
                </Text>
              </View>
              <ScrollView
                style={{
                  position: "fixed",
                  top: user_data.is_creator ? height / 1.1 : (height / 1.1),
                  //right: width <= 400 ? 0 : width / 4.4,
                  width: "100%",
                  zIndex: 99999,
                }}
              >
                {!user_data.is_creator && status === "" && requester === "" ? (
                  <CButton onClick={getTurn} title="Take turn" />
                ) : (user_data.is_creator && status !== "host") || status === "" ? (
                    <button onClick={getTurn}>Take turn</button>
                ) : null}

                {(!user_data.is_creator && status === "guest" && accceptance === true) ||
                  (user_data.is_creator && status == "host" && isprivate === false) ? (
                    <button onClick={leaveTurn}>Leave turn</button>
                  ) :
                  // <CButton
                  //   onClick={sendMessage}
                  //   title="Send"
                  // />
                  null
                }
              </ScrollView>

              <View>
                {requester !== "" && user_data.is_creator ?
                  <Snackbar
                    open={requester !== "" && user_data.is_creator}
                    style={{ position: 'fixed', top: '580px', width: '100%' }}
                  >
                    <Alert
                      severity="info"
                      style={{ backgroundColor: "#fff", color: "#000" }}
                    >
                      {requester} sent you a stream request.{" "}
                      <Button
                        style={{ color: "#1eb2a6", fontWeight: "bold" }}
                        size="small"
                        onClick={acceptRequest}
                      >
                        Accept
            </Button>
                      <Button
                        style={{ color: "#fe346e", fontWeight: "bold" }}
                        size="small"
                        onClick={rejectRequest}
                      >
                        Decline
            </Button>
                    </Alert>
                  </Snackbar>
                  : null}
              </View>
            </View>

        }
      </View>
    </Swipeable>
  )
}
