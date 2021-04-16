//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, } from "react-native";

import { notification } from 'antd';
import TextPage from './text';


import firebase from "firebase";
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import { useParams, useHistory } from "react-router-dom";
const { width, height } = Dimensions.get("window");

const initialState = {
    value: "",
};



const guestId = "guest_" + Math.random().toString(36).slice(2)
let counter = 0
export default function Spaces() {
    const { spaceId } = useParams();
    const history = useHistory();

    const [state, setState] = useState(initialState);
    const [turn, setTurn] = useState("")
    const [openJoinModal, setOpenJoinModal] = useState(false);
    const [anotherCreatorId, setAnotherCreatorId] = useState("");
    const [name, setName] = useState("")
    const [loggedIn, setLoggedIn] = useState(false)
    const [online, setOnline] = useState(false)
    const [mySpace, setMySpace] = useState("")
    const [showText, setShowText] = useState(true)
    const [showVideo, setShowVideo] = useState(false)
    const [showYoutube, setShowYoutube] = useState(false)
    const [creator, setCreator] = useState(false)
    const [haveTurn, setHaveTurn] = useState(false)
    const [showCall, setShowCall] = useState(false)
    const [videoId, setVideoId] = useState("")

    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };


    const writer = () => {
        const path = firebase.database().ref(`/Spaces/${spaceId}/writer`)
        writerFunction(path)
    }

    const writerFunction = (ref) => {
        ref.on("value", (snapshot) => {
            if (snapshot.val() === name) {
                setHaveTurn(true)
            }
            setTurn(snapshot.val())
        });
    }

    //fetching current data from rtdb -- text
    const keyPressFunction = (ref) => {
        ref.on("value", async function (snapshot) {

            if (snapshot.val()) {

                if (snapshot.val() === null) {
                    return null;
                } else {
                    const current = snapshot.val();
                    console.log(current);
                    setState((e) => ({
                        ...e,
                        value: current,
                    }));

                }
            }
        });
    };

    const listening = () => {
        let docRef = firebase.database().ref(`/Spaces/${spaceId}/data/word`);
        keyPressFunction(docRef);
        firebase.database().ref(`/Spaces/${spaceId}/youtube/`).on("value", function (snapshot) {
            if (snapshot.val()) {
                setVideoId(snapshot.val().videoId)
            }
        })
    };

    const spaceOwnerData = async () => {
        const time = Date.now()
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                setLoggedIn(true)
                //loggedIn user
                const name1 = user.email.replace('@achintya.org', '')
                setName(name1)
                console.log('current user ', user);
                firebase.database().ref(`/Users/${name1}/`).once("value", function (snap) {
                    setMySpace(snap.val().mySpace)

                    if (spaceId === snap.val().mySpace) {
                        setCreator(true)

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/`).update({
                            online: true,
                            owner: name1,
                            writer: name1,
                            time: firebase.database.ServerValue.TIMESTAMP,
                        })

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/data`).update({
                            word: ""
                        })

                        // firebase.firestore().collection("Spaces").doc(snap.val().mySpace).collection("Timeline").doc(time.toString()).set({
                        //     username: name1,
                        //     entry: time
                        // })

                        firebase.database().ref(`/Users/${name1}/`).onDisconnect().update({
                            currentSpace: snap.val().mySpace
                        })

                        firebase.database().ref(`/Users/${name1}/`).update({
                            currentSpace: snap.val().mySpace
                        })

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/`).onDisconnect().update({
                            online: false,
                            writer: name1,
                            time: firebase.database.ServerValue.TIMESTAMP,
                        });
                    }

                })

                listening();
                writer()

            } else {
                setName(guestId)
                setLoggedIn(false)
                console.log('not logged in');
            }
        });


    };

    useEffect(() => {
        const time = Date.now()
        if (spaceId && loggedIn) {
            firebase.database().ref(`/Spaces/${spaceId}/`).update({
                count: firebase.database.ServerValue.increment(1),
            })

            firebase.database().ref(`/Spaces/${spaceId}/`).onDisconnect().update({
                count: firebase.database.ServerValue.increment(-1)
            });

            firebase.database().ref(`/Spaces/${spaceId}/online`).on("value", function (snap) {
                setOnline(snap.val())
            })
        }

    }, [spaceId, loggedIn])


    useEffect(() => {
        spaceOwnerData();
    }, []);


    //taking turn on KEY ENTER
    useEffect(() => {

        const listener = (event) => {

            if (event.code === "Enter") {
                if (online) {
                    setState((e) => ({
                        ...e,
                        value: "",
                    }));
                    firebase.database().ref(`/Spaces/${spaceId}/data`).update({ word: "" })
                    firebase.database().ref(`/Spaces/${spaceId}/`).update({ writer: name })
                } else {
                    openNotification('bottomLeft', "user is offline.")
                }

            }
        };

        // register listener
        document.addEventListener("keydown", listener);

        // clean up function, un register listener on component unmount
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [name, turn])




    return (
        <View

            style={{ height: "100%" }}
        >


            {showText && loggedIn ?
                <View>
                    <TextPage currentData={state.value} turn={turn} myName={name} spaceId={spaceId} />
                    <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'flex-end', marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 1.6, position: 'absolute', marginLeft: width - 45 }}>

                        {/* <>
                            <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={forward}>
                                <KeyboardArrowRightIcon style={{ margin: 'auto' }} />
                            </View>
                            <br />
                        </>

                        <>
                            <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={backward}>
                                <KeyboardArrowLeftIcon style={{ margin: 'auto' }} />
                            </View>
                            <br />
                        </> */}

                    </View>
                </View>
                : <h3>Please login to join.</h3>}


        </View>

    )
}

// else {
                    //     firebase.firestore().collection("Spaces").doc(spaceId).collection("Timeline").doc(time.toString()).update({
                    //         username: name1,
                    //         entry: time
                    //     })
                    // }