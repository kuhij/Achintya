import React, { useEffect, useState } from "react";

import {
    TextField,
    Button,
    makeStyles,
    IconButton,
} from "@material-ui/core";
import { Dimensions, View } from "react-native";
import YoutubeLiveView from "./creatorView";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import firebase from "firebase";
import { useHistory, useParams } from "react-router-dom";


const { width, height } = Dimensions.get("window");

export default function Youtube({ myName, turn, takeTurn, online }) {
    const { spaceId } = useParams();

    const [videoId, setVideoId] = useState("");

    const [ytPublishTime, setYtPublishTime] = useState(null);

    const [live, setLive] = useState(false);

    const [open, setOpen] = React.useState(false);
    const [liveModal, setLiveModal] = useState(false);


    const handleClickOpen = (modalType) => {
        setLiveModal(modalType);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };


    const fetchVidFromChannel = async () => {

        const live =
            "https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=" +
            videoId +
            "&key=AIzaSyDReEVZ4A6hTOvAK4HduYlt14Exm5iTR00";
        const response = await fetch(live);
        const data = await response.json();
        console.log(data);
        var time = new Date(data.items[0].liveStreamingDetails.actualStartTime);
        console.log("actual startTime(api):- ", data.items[0].liveStreamingDetails.actualStartTime, "converted Time:- ", time, "timestamp:- ", time.getTime(), "data: -", data);
        if (data.items.length === 0) {
            alert("NO LIVE YET !!!");
        } else {
            const id = await data.items[0].id.videoId
            var ytLiveStartTime = new Date(data.items[0].liveStreamingDetails.actualStartTime);
            const startT = ytLiveStartTime.getTime()
            setYtPublishTime(startT)

            //setHost(true);
            firebase.database().ref(`/Spaces/${spaceId}/data`).update({
                being: videoId,
            });

            handleClose();
            setLive(true);
        }
    };

    return live ?
        <YoutubeLiveView myName={myName} videoId={videoId} turn={turn} takeTurn={takeTurn} online={online} />
        : (
            <View
                style={{
                    height: height,
                    width: width,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div style={{ position: "fixed", top: 16, right: 16 }}>
                </div>
                <View
                    style={{
                        flexDirection: "row",
                        width: width,
                        justifyContent: "space-evenly",
                        alignItems: "center",
                    }}
                >
                    <Button
                        style={{ fontSize: 30 }}
                        color="primary"
                        onClick={() => handleClickOpen(true)}
                    >
                        Create Event
        </Button>
                </View>

                <Dialog
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">Create Event Now.</DialogTitle>
                    <DialogContent style={{ display: "flex", flexDirection: "column", width: 400 }}>
                        <TextField

                            label="Enter video Id"
                            variant="standard"
                            placeholder="video Id"
                            value={videoId}
                            onChange={(e) => setVideoId(e.target.value)}
                        />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={fetchVidFromChannel} color="primary" autoFocus>
                            Start Now
          </Button>
                    </DialogActions>
                </Dialog>
            </View>
        );
}
