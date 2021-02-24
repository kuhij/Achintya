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


import { useSelector } from "react-redux";
import swal from "sweetalert";

import useActionDispatcher from "../Hooks/useActionDispatcher";
import { useHistory, useParams } from "react-router-dom";


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

export default function TextBroadCast({ spaceId, status, turn, requester, currentData, myName }) {
    const history = useHistory();
    //const { username } = useParams();

    const [state, setState] = useState(initialState);
    const [count, setCount] = useState(-1);


    const [showVideo, setShowVideo] = useState(false)
    const [videoURL, setVideoURL] = useState("")


    const [balance, setBalance] = useState(null)
    const [firestore, setFirestore] = useState(null)


    const [visitPast, setVisitPast] = useState(false)

    const [message, setMessage] = useState("")

    const textInputRef = useRef();

    const dispatchAction = useActionDispatcher();
    const user_data = useSelector((state) => state.globalUserData);
    const [word, setWord] = useState("")
    const [wordIndex, setWordIndex] = useState(0)
    const [showReplay, setShowReplay] = useState(true)
    const [words, setWords] = useState([])
    const [timer, setTimer] = useState(null)

    const [newMesage, setNewMessage] = useState(false)


    //fetching current data from rtfirebase.database() -- text/video
    const keyPressFunction = (ref) => {
        let url;
        let totalCost = 0
        ref.on("value", async function (snapshot) {
            const date = Date.now()

            if (snapshot.val()) {

                if (snapshot.val() === null) {
                    return null;
                } else {
                    const current = snapshot.val();
                    console.log(current);
                    // firebase.database().ref(`/${spaceId}/turn`).on("value", function (snapshot) {
                    //   writer = snapshot.val()
                    // })
                    obj["name"] = spaceId
                    obj.data[Date.now()] = current
                    setFirestore(obj)
                    setWords(wrd => [...wrd, current])
                    var val = Object.values(obj)[0]
                    var valCount = Object.values(val)
                    console.log(obj, valCount);

                    if (valCount.length === 15) {
                        await firebase.firestore().collection("Users").doc(spaceId).collection("pages").doc(date).set({
                            message: JSON.stringify(obj)
                        })
                        obj = { data: {} }
                    }


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
        let docRef = firebase.database().ref(`/${spaceId}/data/currentLetter`);
        keyPressFunction(docRef);
    };


    const subscription = () => {
        let id = spaceId

        firebase.firestore().collection("actions").doc(id).set({
            subscription: user_data.joinedSpace,
            fcmtoken: user_data.token,
            //time: firebase.firestore.FieldValue.serverTimestamp()
        })

    }


    const spaceOwnerData = async () => {
        const date = Date.now().toString()

        if (turn === myName) {

            firebase.database().ref(`/${spaceId}/`).onDisconnect().update({
                online: false,
                //balance: firebase.database.ServerValue.increment(-cost)
            });
            // database.collection("Spaces").doc(spaceId).collection("words").doc(date).set({
            //   word: null,
            //   start: true,
            //   time: parseInt(date)
            // })
            firebase.database().ref(`/${spaceId}/data`).update({
                currentLetter: "",
                time: firebase.database.ServerValue.TIMESTAMP,
            })

            // await firebase.database().ref(`/${spaceId}/`).update({
            //     turn: spaceId,
            //     status: 'host',
            //     online: true,
            //     requester: ""
            //     //count: firebase.database.ServerValue.increment(-1)
            // })


        } else {
            console.log('not creator');
            // if (user_data.joinedSpace) {
            //   //fireFunc(user_data.joinedSpace, user_data.token)
            //   firebase.database().ref(`/${user_data.joinedSpace}/`).update({
            //     count: firebase.database.ServerValue.increment(-1)
            //   })
            //   firebase.database().ref(`/${user_data.joinedSpace}/`).onDisconnect().update({
            //     count: firebase.database.ServerValue.increment(1)
            //   });

            // }

        }

        listening();

    };


    const fetchUpdate = () => {
        spaceOwnerData();
    };


    useEffect(() => {
        fetchUpdate();
    }, []);


    //sending letter by letter to rtdb.
    const handleInput = async (event) => {
        const date = parseInt(Date.now());

        const current = event.nativeEvent.key;

        let docRef;

        docRef = firebase.database().ref(`/${spaceId}/data`);

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

            setWord("")
        } else if (current === "Backspace") {
            setWord(word.slice(0, -1))
        } else {
            setWord(word + current)

        }
    };



    const onSwiping = async ({ dir }) => {
        if (dir === UP) {
            console.log('up');
            //await clearTimeout(timer)
            await firebase.database().ref(`/${user_data.joinedSpace}/data/currentLetter/`).off()

            firebase.database().ref(`/${user_data.joinedSpace}`).update({
                count: firebase.database.ServerValue.increment(1)
            }).then(() => {
                firebase.database().ref("/").orderByChild("count").startAt(user_data.totalUsers + 1).limitToFirst(1).once("child_added", function (snap) {
                    console.log(snap.val(), snap.key);

                    dispatchAction(UPDATE_USER_DATA, {
                        data: {
                            totalUsers: snap.val().count,
                            joinedSpace: snap.key
                        },
                    });
                    history.push(`/${snap.key}`);

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

    return (
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
                    onClick={turn === myName ? autoFocus : null}
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
                                {turn === myName ?
                                    <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif' }}>{state.value}</Text>
                                    :
                                    <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: currentData.length === 1 ? "70vw" : (75 / (currentData.length) + 10) + "vw", textAlign: 'center', margin: 'auto' }}>{currentData}</Text>
                                }
                                <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif' }}>{word}</Text>
                                {(turn === myName) ?
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
                                    : null}
                            </View>
                        </Text>
                    </View>

                </View>

            </View>

        </Swipeable>
    )
}

