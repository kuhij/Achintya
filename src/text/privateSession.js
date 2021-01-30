import * as firebase from "firebase";
import React, { useEffect, useState, useRef } from "react";
import { Dimensions, Text, View } from "react-native";
import { useHistory, useParams } from "react-router-dom";

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@material-ui/core";
import { TextField, Button, setRef } from "@material-ui/core";
import Slide from '@material-ui/core/Slide';

import { UPDATE_USER_DATA } from "../../../Store/actions";
import Groups from "./groups";
import useActionDispatcher from "../../../Hooks/useActionDispatcher";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function PrivateSession(params) {
    const { username } = useParams();
    const [anotherCreatorId, setAnotherCreatorId] = useState("");
    const dispatchAction = useActionDispatcher();

    const [join, setJoin] = useState(false)

    const joinStream = () => {
        console.log(anotherCreatorId);
        firebase.database().ref(`/Spaces/${anotherCreatorId}/available`).on("value", function (snapshot) {
            if (snapshot.val() && snapshot.val() === 'private') {
                firebase.database().ref(`/Spaces/${anotherCreatorId}/`).update({
                    call_request: username,
                    status: "waiting"
                }).then(() => {
                    alert("call sent!")
                })
                setJoin(true)
                dispatchAction(UPDATE_USER_DATA, {
                    data: {
                        joinedSpace: anotherCreatorId,
                        joinedOther: true,
                        is_creator: false
                    },
                });
            } else {
                alert('creator is not private at the moment.')
            }
        })
    }

    return (
        <View>
            {join === false ?
                <Dialog
                    open={params.open}
                    TransitionComponent={Transition}
                    keepMounted
                    //onClose={open === false}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description"
                >
                    <DialogTitle id="alert-dialog-slide-title">
                        {"Enter Creator's Id to Join their Stream."}
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
                :
                <Groups spaceId={username} />
            }
        </View>
    )
}