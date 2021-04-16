//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, } from "react-native";

import { notification } from 'antd';
import TextPage from './text';


import firebase from "firebase";

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
                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/data`).update({
                            word: ""
                        })

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/`).update({
                            online: true,
                            owner: name1,
                            writer: name1,
                            time: firebase.database.ServerValue.TIMESTAMP,
                        })

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



            } else {
                setName(guestId)
                setLoggedIn(false)
                console.log('not logged in');
            }
        });

        listening();
        writer()
    };

    useEffect(() => {
        if (spaceId) {
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

    }, [spaceId])


    useEffect(() => {
        spaceOwnerData();
    }, []);

    const handleClickOpenJoinModal = () => {
        setOpenJoinModal(true);
    };

    const handleCloseJoinModal = () => {
        setOpenJoinModal(false);
    };

    const joinStream = async () => {
        setState((e) => ({
            ...e,
            value: "",
        }));
        setCreator(false)
        firebase.database().ref(`/Users/${name}/currentSpace`).once("value", function (snap) {
            var space = snap.val()
            firebase.database().ref(`/Spaces/${space}/`).update({
                count: firebase.database.ServerValue.increment(-1),
            })
        })
        firebase.database().ref(`/Spaces/${spaceId}/`).onDisconnect().cancel()
        if (spaceId === mySpace) {
            firebase.database().ref(`/Spaces/${spaceId}/`).update({
                online: false,
                time: firebase.database.ServerValue.TIMESTAMP,
            })

        }

        if (anotherCreatorId === mySpace) {
            firebase.database().ref(`/Spaces/${spaceId}/`).update({
                online: true,
                time: firebase.database.ServerValue.TIMESTAMP,
            })
        }
        firebase.database().ref(`/Users/${name}/`).update({
            currentSpace: anotherCreatorId,
        })

        firebase.database().ref(`/Spaces/${anotherCreatorId}/`).update({
            count: firebase.database.ServerValue.increment(1)
        })

        firebase.database().ref(`/Spaces/${spaceId}/data/word`).off()
        const currentSpace = firebase.database().ref(`/Spaces/${anotherCreatorId}/data/word`)

        firebase.database().ref(`/Spaces/${spaceId}/writer`).off()
        const currentTurn = firebase.database().ref(`/Spaces/${anotherCreatorId}/writer`)

        keyPressFunction(currentSpace)
        writerFunction(currentTurn)
        handleCloseJoinModal();
        history.push(`/space/${anotherCreatorId}`);
    };

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

    const forward = () => {
        counter = counter + 1
        if (counter === 1) {

            setShowYoutube(true)

            setShowCall(true)


            setShowText(false)
        } else if (counter === 2 || counter > 2) {

            setShowVideo(true)
            setShowYoutube(false)
            setShowText(false)

        }

    }

    const back = () => {
        counter = counter - 1
        if (counter === 1) {

            setShowYoutube(true)

            setShowCall(true)


            setShowText(false)
        } else if (counter === 0 || counter < 0) {
            setShowVideo(false)
            setShowYoutube(false)
            setShowText(true)
        }

    }




    return (
        <View

            style={{ height: "100%" }}
        >


            {showText ?
                <View>
                    <TextPage currentData={state.value} turn={turn} myName={name} spaceId={spaceId} />
                </View>
                : null}


        </View>

    )
}