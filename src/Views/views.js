import React, { useEffect, useState, useRef, Component } from "react";
import firebase from "firebase";
import { View, Image, Text, Dimensions } from "react-native";
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";
import { TextField, IconButton, Button, FormControlLabel, Switch, Dialog, DialogActions, DialogContent, DialogTitle, Slide, Snackbar } from "@material-ui/core";
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import useActionDispatcher from "../Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";

import { withStyles } from "@material-ui/core/styles";
import { yellow } from "@material-ui/core/colors";
import { Carousel } from 'antd';
import 'antd/dist/antd.css';
import { GroupAdd, PersonAddDisabled } from "@material-ui/icons";
import MuiAlert from "@material-ui/lab/Alert";

import CreatorView from './CreatorView'
import Donation from './donation'
import Groups from "./groups";
import HomePage from './wallet'

//import { db, database, messaging } from './App'

const { width, height } = Dimensions.get("window");

const contentStyle = {
    height: height,
    //height: '160px',
    color: '#fff',
    lineHeight: '160px',
    //textAlign: 'center',
    background: '#364d79',
};



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

const initialState = {
    value: "",
};

export default function Views() {
    const { creatorId } = useParams();
    const history = useHistory();

    const dispatchAction = useActionDispatcher();

    const [state, setState] = useState(initialState);
    const user_data = useSelector((state) => state.globalUserData);
    const [status, setStatus] = useState("");
    const [turn, setTurn] = useState("")
    const [guest, setGuest] = useState(false);
    const [host, setHost] = useState(false);
    const [streamReq, setStreamReq] = useState(false);
    const [requester, setRequester] = useState("")
    const [turnOpen, setOpen] = useState(false)


    const [primaryPresence, setPrimaryPresence] = useState("");

    const [myName, setMyname] = useState("")

    const onChange = (a, b, c) => {
        console.log(a, b, c);
    }

    useEffect(() => {
        var authUid = firebase.auth().currentUser;
        setMyname(authUid.email.split("@")[0])
        console.log(authUid, creatorId)

        firebase.database().ref(`/${creatorId}/turnOpen`).on("value", function (snap) {
            setOpen(snap.val())
        })

        firebase.database().ref(`/${creatorId}/data/watching`)
            .on("value", (snapshot) => {
                setPrimaryPresence(snapshot.val());
            });

        firebase.database().ref(`/${creatorId}/`).on("value", (snapshot) => {

            setRequester(snapshot.val().requester);
            //setTurn(true)
            setTurn(snapshot.val().turn)
        });

        firebase.database().ref(`/${creatorId}/data/currentLetter`)
            .on("value", (snapshot) => {
                setState((e) => ({
                    ...e,
                    value: snapshot.val(),
                }));
            });

        firebase.database().ref(`/${creatorId}/turn`).on("value", (snapshot) => {
            if (snapshot.val() === creatorId) {

                firebase.database().ref(`/${creatorId}/data/being`).on("value", (snap) => {
                    firebase.database().ref(`/${creatorId}/data/`).update({
                        watching: snap.val()
                    })
                });
            } else if (snapshot.val() === myName) {
                firebase.database().ref(`/${myName}/data/being`).on("value", (snap) => {
                    firebase.database().ref(`/${creatorId}/data/`).update({
                        watching: snap.val()
                    })
                })
            }

        });


        if (creatorId !== authUid.email.split("@")[0]) {
            setHost(false);
            console.log('false');

        }
        else {
            setHost(true);
            console.log('true');
            firebase.database().ref(`/${creatorId}/`).update({
                turn: creatorId,
                space: creatorId,
            })

            firebase.database().ref(`/${creatorId}/`).onDisconnect().update({
                requester: "",
            })

        }

    }, [creatorId, host]);

    // Register event lister for "ENTER" key press to take turn for write
    useEffect(() => {
        //fetchingWriter()
        const listener = (event) => {
            if (event.code === "Right" || event.code === "LEFT") {
                onChange()
                console.log("Enter key was pressed. Run your function.");
            }
            if (event.code === "Enter") {
                sendStreamRequest()
            }
        };

        // register listener
        document.addEventListener("keydown", listener);

        // clean up function, un register listener on component unmount
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, []);


    // const fetchingWriter = () => {
    //     let writerStatus;
    //     let turnStat;

    //     if (host) {
    //         writerStatus = firebase.database().ref(`/${creatorId}/`)
    //         turnStat = firebase.database().ref(`/${creatorId}/turn`)
    //     } else {
    //         writerStatus = firebase.database().ref(`/${creatorId}/`)
    //         turnStat = firebase.database().ref(`/${creatorId}/turn`)
    //     }
    //     writerFunction(writerStatus, turnStat)
    // }

    // const writerFunction = (status, turn) => {
    //     // turn.on('value', function (snapshot) {
    //     //     setState((e) => ({
    //     //         ...e,
    //     //         value: "",
    //     //     }));
    //     // })

    //     /*----------------- Read host status from rtfirebase.database()-------------------*/
    //     status.on("value", function (snapshot) {


    //         if (snapshot.val().turn === user_data.email_id && !user_data.is_creator) {
    //             dispatchAction(UPDATE_USER_DATA, {
    //                 data: {
    //                     acceptance: true
    //                 },
    //             });
    //             //setMessage("")
    //             // setShowReplay(false)

    //         }
    //         if (snapshot.val().status === "host" && user_data.acceptance) {
    //             //setShowReplay(true)
    //             dispatchAction(UPDATE_USER_DATA, {
    //                 data: {
    //                     acceptance: false
    //                 },
    //             });

    //         }

    //         // setStatus(snapshot.val().status);
    //         // setGuest(snapshot.val().turn)
    //         if (snapshot.val().call_request) {
    //             //setRequester(snapshot.val().call_request)
    //         } else {
    //             return null;
    //         }

    //         console.log(snapshot.val().status, snapshot.val().turn, user_data.acceptance);
    //     });

    // };



    const leaveTurn = () => {
        firebase.database().ref(`/${creatorId}/`).update({
            requester: "",
            turnOpen: false,
            turn: creatorId
        });
        firebase.database().ref(`/${creatorId}/webRTC`).update({
            call: "ended",
        });
        // firebase.database().ref(`/${creatorId}/data/being`).on("value", function (snap) {
        //     firebase.database().ref(`/${creatorId}/data`).update({
        //         watching: snap.val(),
        //     });
        //     firebase.database().ref(`/${myName}/data`).update({
        //         watching: snap.val(),
        //     });

        // })

    };

    const acceptTurnRequest = () => {
        firebase
            .database()
            .ref(`/${requester}/data/being`)
            .on("value", (snap) => {
                if (snap.val()) {
                    firebase.database().ref(`/${creatorId}/data`).update({
                        watching: snap.val(),
                    });
                    firebase.database().ref(`/${creatorId}/`).update({
                        turnOpen: false,
                        turn: requester
                    });
                }
            });
    };

    const sendStreamRequest = () => {
        firebase
            .database()
            .ref(`/${creatorId}/`)
            .update({ requester: myName, status: "waiting" });
    };

    const handleCreatorTurnToggle = (event) => {
        firebase
            .database()
            .ref(`/${creatorId}/`)
            .update({ turnOpen: event.target.checked });
        //setCreatorReleaseTurn(event.target.checked);
    };

    const handleReqClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        firebase
            .database()
            .ref(`/${creatorId}/`)
            .update({ requester: "", turnOpen: false });
    };

    function onSwiping({ dir }) {
        if (dir === LEFT) {
            onChange()
        }
        if (dir === RIGHT) {
            onChange()
        }
    }

    return (
        <Swipeable
            onSwiped={(eventData) => onSwiping(eventData)}
            preventDefaultTouchmoveEvent={true}
            trackMouse={true}
            className="swiping"
            style={{ height: "100%" }}
        >
            <View>
                <Carousel afterChange={onChange}>

                    <View style={contentStyle}>
                        <HomePage name={creatorId} email={user_data.email_id} />
                    </View>

                    <View style={contentStyle}>
                        <CreatorView creatorId={creatorId} primaryPresence={primaryPresence} turn={turn} host={host} />
                    </View>
                    <View style={contentStyle}>
                        <Donation username={creatorId} />
                    </View>
                    <View style={contentStyle}>
                        <Groups
                            spaceId={creatorId}
                            myName={myName}
                            creator={user_data.is_creator}
                            status={status}
                            turn={turn}
                            currentData={state.value}
                            requester={requester}
                        />

                    </View>

                </Carousel>
                <View style={{ position: "absolute", top: 0, left: 0, top: '90%', left: '46%', zIndex: 9999 }}>

                    {host ? (
                        <FormControlLabel
                            style={{ color: "black", float: 'right' }}
                            control={
                                <YellowSwitch
                                    checked={turnOpen}
                                    onChange={handleCreatorTurnToggle}
                                    name="checkedB"
                                    color="primary"
                                />
                            }
                            label={turnOpen !== true ? "Give Turn" : "Take Turn"}
                        />
                    ) : turnOpen && requester === "" ?
                            (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<GroupAdd />}
                                    onClick={sendStreamRequest}
                                    style={{ color: "#fff", width: '100%', margin: 'auto' }}
                                >
                                    Send Turn Request
                                </Button>

                            ) : (
                                turn === myName &&
                                !host && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<PersonAddDisabled />}
                                        onClick={leaveTurn}
                                        style={{ color: "black", width: '100%', margin: 'auto' }}
                                    >
                                        Leave Turn
                                    </Button>
                                )
                            )}

                    {host && requester !== "" && (
                        <Snackbar
                            onClose={handleReqClose}
                            open={requester !== "" && host}
                            autoHideDuration={6000}
                        >
                            <Alert
                                severity="info"
                                style={{ backgroundColor: "#fff", color: "#000" }}
                            >
                                {requester} sent you a stream request.{" "}
                                <Button
                                    style={{ color: "#1eb2a6", fontWeight: "bold" }}
                                    size="small"
                                    onClick={acceptTurnRequest}
                                >
                                    Accept
            </Button>
                                <Button
                                    style={{ color: "#fe346e", fontWeight: "bold" }}
                                    size="small"
                                    onClick={handleReqClose}
                                >
                                    Decline
            </Button>
                            </Alert>
                        </Snackbar>
                    )}
                </View>

            </View>
        </Swipeable>
    )

}