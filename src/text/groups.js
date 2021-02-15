import { db, storageRef, database, messaging } from "../App";
import firebase from "firebase";

import React, { useEffect, useState, useRef, Component } from "react";
import { Dimensions, Text, TextInput, View, ScrollView } from "react-native";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";

import {
  Snackbar,
} from "@material-ui/core";
import MuiAlert from '@material-ui/lab/Alert';

import Alert from '@material-ui/lab/Alert';

import RecordPage from './RecordRTC';
import VideoRoom from '../webRTC/videoRoom'

import { useSelector } from "react-redux";
import swal from "sweetalert";

import useActionDispatcher from "../Hooks/useActionDispatcher";
import { useHistory, useParams } from "react-router-dom";
import Donation from "../donation";
import Replay from "./replay";

function Alrt(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const { width, height } = Dimensions.get("window");

const initialState = {
  value: "",
  amount: null
};

let values = []
let owner;

let obj = { data: {} }

export default function TextBroadCast(props) {
  const history = useHistory();
  const { username } = useParams();

  const [state, setState] = useState(initialState);
  const [count, setCount] = useState(-1);
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
  const [visitPast, setVisitPast] = useState(false)

  const [message, setMessage] = useState("")
  const [latest, prevLatest] = useState(null)

  const [join, setJoin] = useState(false)

  const textInputRef = useRef();
  const recordedMessage = useRef();

  const dispatchAction = useActionDispatcher();
  const user_data = useSelector((state) => state.globalUserData);
  const [word, setWord] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [showReplay, setShowReplay] = useState(true)
  const [words, setWords] = useState([])
  const [replayText, setReplayText] = useState(null)
  const [timer, setTimer] = useState(null)

  const [creationId, setCreationId] = useState()
  const [creationData, setCreationData] = useState(null)
  const [replayFinish, setReplayFinish] = useState(false)

  const [newMesage, setNewMessage] = useState(false)
  const [messgOwner, setOwner] = useState("")
  const [startTime, setStartTime] = useState(null)










  const writerFunction = (status, turn) => {
    turn.on('value', function (snapshot) {
      setState((e) => ({
        ...e,
        value: "",
      }));
    })

    /*----------------- Read host status from rtdb-------------------*/
    status.on("value", function (snapshot) {


      if (snapshot.val().turn === props.spaceId && !user_data.is_creator) {
        setAcceptance(true)
        //setMessage("")
        setShowReplay(false)

      }
      if (snapshot.val().status === "host" && accceptance) {
        setShowReplay(true)
        setAcceptance(false)

      }

      setStatus(snapshot.val().status);
      setTurn(snapshot.val().turn)
      setRequester(snapshot.val().call_request)

      console.log(snapshot.val().status, snapshot.val().turn, props.spaceId, accceptance, showReplay);
    });

  };

  //fetching current data from rtdb -- text/video
  const keyPressFunction = (ref) => {
    let writer;
    let url;
    let totalCost = 0
    ref.on("value", async function (snapshot) {
      const date = Date.now()

      if (snapshot.val()) {

        if (snapshot.val().currentLetter === null) {
          return null;
        } else {
          const current = snapshot.val().currentLetter;

          // db.ref(`/Spaces/${props.spaceId}/turn`).on("value", function (snapshot) {
          //   writer = snapshot.val()
          // })
          // obj["name"] = props.spaceId
          // obj.data[Date.now()] = current
          // setFirestore(obj)
          // setWords(wrd => [...wrd, current])
          // var val = Object.values(obj)[0]
          // var valCount = Object.values(val)
          // console.log(obj, valCount);

          // if (valCount.length === 15) {
          //   await database.collection("Users").doc(props.spaceId).collection("pages").doc(date).set({
          //     message: JSON.stringify(obj)
          //   })
          //   obj = { data: {} }
          // }


          if (current === "Backspace") {
            setState((e) => ({
              ...e,
              value: e.value.slice(0, -1),
            }));
          } else if (current === "Enter") {
            setState((e) => ({
              ...e,
              value: "\n",
            }));
          } else if (current.substring(0, 8) === "https://") {
            url = current   //if video url is there.
            setShowVideo(true);
            setVideoURL(url)
          } else {
            setState((e) => ({
              ...e,
              value: current,
            }));
          }
        }
      }
    });
  };

  useEffect(() => {
    console.log(firestore);
  }, [firestore])


  const listening = () => {
    let docRef;

    if (props.creator) {
      setShowReplay(false)
      docRef = db.ref(`/Spaces/${props.spaceId}/data`);
    } else {
      docRef = db.ref(`/Spaces/${user_data.joinedSpace}/data`);
    }
    keyPressFunction(docRef);
  };


  const subscription = () => {
    let id = props.spaceId

    database.collection("actions").doc(id).set({
      subscription: user_data.joinedSpace,
      fcmtoken: user_data.token,
      //time: firebase.firestore.FieldValue.serverTimestamp()
    })

  }


  const spaceOwnerData = async () => {
    const date = Date.now().toString()
    //checking for name presence.


    if (props.creator) {
      if (props.spaceId) {

        db.ref(`/Spaces/${props.spaceId}/`).onDisconnect().update({
          online: false,
          //balance: firebase.database.ServerValue.increment(-cost)
        });
        // database.collection("Spaces").doc(props.spaceId).collection("words").doc(date).set({
        //   word: null,
        //   start: true,
        //   time: parseInt(date)
        // })
        db.ref(`/Spaces/${props.spaceId}/data`).update({
          currentLetter: "",
          time: firebase.database.ServerValue.TIMESTAMP,
        })

        await db.ref(`/Spaces/${props.spaceId}/`).update({
          turn: props.spaceId,
          status: 'host',
          online: true,
          //count: firebase.database.ServerValue.increment(-1)
        })

      }

    } else {
      console.log('not creator');
      // if (user_data.joinedSpace) {
      //   //fireFunc(user_data.joinedSpace, user_data.token)
      //   db.ref(`/Spaces/${user_data.joinedSpace}/`).update({
      //     count: firebase.database.ServerValue.increment(-1)
      //   })
      //   db.ref(`/Spaces/${user_data.joinedSpace}/`).onDisconnect().update({
      //     count: firebase.database.ServerValue.increment(1)
      //   });

      // }

    }

    listening();
    fetchingWriter();

  };


  const fetchUpdate = () => {
    spaceOwnerData();
  };


  useEffect(() => {
    console.log(props.creator, props.spaceId);
    fetchUpdate();
  }, []);


  const fetchingWriter = () => {
    let writerStatus;
    let turnStat;

    if (props.creator) {
      writerStatus = db.ref(`/Spaces/${props.spaceId}/`)
      turnStat = db.ref(`/Spaces/${props.spaceId}/turn`)
    } else {
      writerStatus = db.ref(`/Spaces/${user_data.joinedSpace}/`)
      turnStat = db.ref(`/Spaces/${user_data.joinedSpace}/turn`)
    }
    writerFunction(writerStatus, turnStat)
  }


  useEffect(() => {
    console.log(textInputRef.current)
  }, [])



  //sending letter by letter to rtdb.
  const handleInput = async (event) => {
    const date = parseInt(Date.now());

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
      // console.log(date - startTime, startTime, date);
      let wrd = word + " "
      // setSingle(wrd)

      docRef.update({ currentLetter: wrd, time: date }).then(() => {
        textInputRef.current.focus();
        //setStartTime(date)
      })
      if (!user_data.is_creator) {
        setState((e) => ({
          ...e,
          value: e.value + current,
        }));
      }
      setWord("")
    } else if (current === "Backspace") {
      setWord(word.slice(0, -1))
    } else {
      setWord(word + current)
      if (!user_data.is_creator) {
        setState((e) => ({
          ...e,
          value: e.value + current,
        }));
      }
    }
  };

  const endSession = () => {
    let date = Date.now().toString()
    database.collection("Spaces").doc(props.spaceId).collection("words").doc(date).set({
      word: null,
      end: true,
      time: Date.now()
    })
  }

  const sendRequest = () => {

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
    } else {
      sendRequest()
    }

    textInputRef.current.focus();

  };

  const leaveTurn = () => {

    if (user_data.is_creator) {
      db.ref(`/Spaces/${props.spaceId}/`).update({ status: "", turn: 'guest' });

    } else {
      setShowReplay(true)
      setAcceptance(false)
      db.ref(`/Spaces/${user_data.joinedSpace}/`).update({ status: "host", turn: user_data.joinedSpace });
      db.ref(`/Spaces/${user_data.joinedSpace}/webRTC/message/`).update({
        callRequest: 'none'
      })
    }

    textInputRef.current.focus();
  };

  const acceptRequest = () => {
    db.ref(`/Spaces/${props.spaceId}/`).update({ status: "guest", turn: requester, call_request: "" });
  }

  const rejectRequest = () => {
    db.ref(`/Spaces/${props.spaceId}/`).update({ call_request: "" });
  }


  const onSwiping = async ({ dir }) => {
    if (dir === UP) {
      console.log('up');
      //await clearTimeout(timer)
      await db.ref(`/Spaces/${user_data.joinedSpace}/data/currentLetter/`).off()

      db.ref(`/Spaces/${user_data.joinedSpace}`).update({
        count: firebase.database.ServerValue.increment(1)
      }).then(() => {
        db.ref("Spaces").orderByChild("count").startAt(user_data.totalUsers + 1).limitToFirst(1).once("child_added", function (snap) {
          console.log(snap.val(), snap.key);

          dispatchAction(UPDATE_USER_DATA, {
            data: {
              totalUsers: snap.val().count,
              joinedSpace: snap.key
            },
          });
          history.push(`/${snap.key}`);
          //fireFunc(snap.key, user_data.token)
          //setTopCreator(snap.key)
        })
      })

    }
    if (dir === RIGHT) {
      setVisitPast(true)

      if (wordIndex >= values.length - 1) {
        alert('no more words')
      } else {
        setWordIndex(prev => prev + 1)
      }
    }

    if (dir === LEFT) {
      setVisitPast(true)

      if (wordIndex < 1) {
        alert('no more words')
      } else {
        setWordIndex(prev => prev - 1)
        console.log(wordIndex, values.length);
      }
    }

    if (dir === DOWN) {
      await clearTimeout(timer)
      dispatchAction(UPDATE_USER_DATA, {
        data: {
          showLogin: true
        },
      });
      history.push("/")
    }
  }

  const autoFocus = () => {
    textInputRef.current.focus()

    setNewMessage(false)

  }




  return user_data.showLive ? (
    <Replay spaceId={user_data.joinedSpace} />
  ) : (
      <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true}>

        <View>
          <View
            style={{
              shadowOpacity: 4,
              width: width,
              //overflowY: "auto",
              overflow: 'hidden',
              height: height * 0.85,
              marginTop: showVideo === false ? '18px' : null,
              zIndex: 99999,
              //overscrollBehaviorY: "contain",
              //scrollSnapType: "y proximity",
            }}
            onClick={!showReplay ? autoFocus : null}
          >
            <View>
              <Text style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'cursive', marginBottom: 8 }}>{turn}</Text>

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


                <View style={{ display: 'flex', flexFlow: 'row' }}>
                  {turn === props.spaceId ?
                    <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif' }}>{state.value}</Text>
                    :
                    <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: state.value.length === 1 ? "70vw" : (75 / (state.value.length) + 10) + "vw", textAlign: 'center', margin: 'auto' }}>{state.value}</Text>
                  }
                  {user_data.is_creator ?
                    <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif' }}>{word}</Text>
                    : null}
                  {(user_data.is_creator && turn === props.spaceId) ?
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
                      style={{ outline: "none", width: 2 }}
                      value=""
                      onKeyPress={handleInput}
                      editable={true}
                      ref={textInputRef}
                    />
                    : (turn === props.spaceId && !user_data.is_creator && accceptance === true) ?
                      < TextInput
                        name="usertext"
                        multiline={true}
                        numberOfLines={1}
                        style={{
                          outline: "none",
                          border: "none",
                          color: "#888888",
                        }}
                        id="standard-multiline-flexible"
                        style={{ outline: "none", width: 2 }}
                        value=""
                        onKeyPress={handleInput}
                        editable={true}
                        ref={textInputRef}
                      />
                      : null}
                </View>
              </Text>
            </View>
            <ScrollView
              style={{
                position: "fixed",
                top: user_data.is_creator ? height / 1.1 : (height / 1.1),
                right: width <= 400 ? 0 : width / 4.2,
                width: "50%",
                zIndex: 99999,
              }}
            >
              {!user_data.is_creator && status === "" && requester === "" ? (
                <button style={{ background: 'black', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 3, height: 32 }} onClick={getTurn}>Take turn</button>
              ) : (user_data.is_creator && status !== "host") || status === "" ? (
                <button style={{ background: 'black', color: 'white', border: 'none', cursor: 'pointer', height: 32, borderRadius: 3, }} onClick={getTurn}>Take turn</button>
              ) : null}

              {(!user_data.is_creator && status === "guest" && accceptance) ||
                (user_data.is_creator && status == "host" && isprivate === false) ? (
                  <button style={{ background: 'black', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 3, height: 32 }} onClick={leaveTurn}>Leave turn</button>
                ) :
                null
              }
            </ScrollView>
            <View>
              {requester !== "" && user_data.is_creator ?
                <Snackbar
                  open={requester !== "" && user_data.is_creator}
                  style={{ position: 'fixed', top: '565px', width: '100%' }}
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

        </View>

      </Swipeable>
    )
}

{/* <View>
  <TextField id="standard-basic" label="Standard" onChange={handleChange()} />
  <br />
  <Button variant="contained" color="primary">
    Primary
      </Button>

      {user_data.is_creator ?
                  <button style={{ marginLeft: '90%', position: 'absolute', height: 28, cursor: 'pointer', width: 80, fontFamily: 'fangsong', fontSize: 15, border: 'none', background: 'black', color: 'white' }} onClick={endSession}>End</button>
                  : null}

                  // if (video === true) {
      //   setMain(true)
      // } else {
      //   setShowRecording(false)
      // }

      // if (!user_data.is_creator) {
      //   setDonate(true)
      // }

      if (guest) {
        setShowRecording(true)
      } else if (video === true) {
        setMain(false)
      } else {
        alert('sorry, you can \'t send video message')
      }

      // } if (dir === DOWN) {
    //   setVideo(false)
    //   //setDonate(true)
    // }

    const path = database.collection("Spaces").doc(user_data.joinedSpace).collection("words")
      path.where("start", "==", true).where("time", "<", parseInt(latest[1])).limit(1).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
          setShowReplay(false)
        } else {
          const arr = new Array(querySnapshot.docs[0].data().time + "")
          prevLatest(arr)
        }
      })
</View> */}