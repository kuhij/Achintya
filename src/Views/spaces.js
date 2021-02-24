import React, { useEffect, useState, useRef, Component } from "react";
import firebase from "firebase";
import { View, Image, Text, Dimensions } from "react-native";
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";
import { TextField, IconButton, Button, FormControlLabel, Dialog, DialogActions, DialogContent, DialogTitle, Slide } from "@material-ui/core";
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import Views from './views'
import useActionDispatcher from "../Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

export default function Spaces(params) {
    const { creatorId } = useParams();
    const history = useHistory();

    const userData = useSelector((state) => state.globalUserData);
    const dispatchAction = useActionDispatcher();

    const [openJoinModal, setOpenJoinModal] = useState(false);
    const [anotherCreatorId, setAnotherCreatorId] = useState("");

    const handleClickOpenJoinModal = () => {
        setOpenJoinModal(true);
    };

    const handleCloseJoinModal = () => {
        setOpenJoinModal(false);
    };

    const joinStream = async () => {
        const ref = firebase.database().ref(`/${anotherCreatorId}/data/watching`)

        ref.on("value", (snap) => {
            console.log(snap.val());

            firebase.database().ref(`/${creatorId}/`).update({
                space: anotherCreatorId,

            });
            firebase.database().ref(`/${creatorId}/data`).update({
                watching: snap.val(),
            })

            //ref.off()

            firebase.firestore().collection("actions").doc(`${creatorId}`).set({
                subscription: anotherCreatorId,
                fcmtoken: userData.token,
            })
        });

        handleCloseJoinModal();
        history.push(`/${anotherCreatorId}`);
    };

    function onSwiping({ dir }) {
        if (dir === DOWN) {
            handleClickOpenJoinModal();
        }
    }

    return (
        <Swipeable
            onSwiped={(eventData) => onSwiping(eventData)}
            preventDefaultTouchmoveEvent={true}
            trackMouse={true}
            className="swiping"
            style={{ height: "100%", overflow: "hidden" }}
        >
            <View>
                <Views creatorId={creatorId} />
                <Dialog
                    open={openJoinModal}
                    TransitionComponent={Transition}
                    keepMounted
                    onClose={handleCloseJoinModal}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description"
                >
                    <DialogTitle id="alert-dialog-slide-title">
                        {"Enter Another Creator's Id to Join their Stream."}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Enter Creator User Id"
                            size="small"
                            style={{ width: "100%" }}
                            value={anotherCreatorId}
                            onChange={(e) => setAnotherCreatorId(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button variant="text" onClick={joinStream}>
                            Join Stream
          </Button>
                    </DialogActions>
                </Dialog>
            </View>
        </Swipeable>
    )
}