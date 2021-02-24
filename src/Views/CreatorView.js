import React, { useEffect, useState } from "react";

import {
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  makeStyles,
  IconButton,
} from "@material-ui/core";
import { Dimensions, View } from "react-native";
import YoutubeLiveView from "./YoutubeLiveView";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import firebase from "firebase";
import { useHistory, useParams } from "react-router-dom";
import { AccountCircleOutlined } from "@material-ui/icons";

const { width, height } = Dimensions.get("window");

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  t: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

export default function CreatorView({ turn, host, primaryPresence, creatorId }) {
  //const { creatorId } = useParams();
  const history = useHistory();

  const [creator, setCreator] = useState({});
  const [videoId, setVideoId] = useState(primaryPresence);
  const [timeNow, setTimeNow] = useState("");
  const [live, setLive] = useState(false);
  const [registeredVideoId, setRegisteredVideoId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [liveModal, setLiveModal] = useState(false);
  const [scheduledEvents, setScheduledEvents] = useState({});

  const handleClickOpen = (modalType) => {
    setLiveModal(modalType);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


  const handleStartEventNow = async () => {
    firebase.database().ref(`/${creatorId}/data`).update({
      being: videoId,
      watching: videoId
    });
    handleClose();
    setLive(true);
  };

  return live ? (host ?
    <YoutubeLiveView loggedUser={creatorId} host={true} primaryPresence={primaryPresence} turn={turn} /> : <YoutubeLiveView loggedUser={creatorId} host={false} primaryPresence={primaryPresence} turn={turn} />
  ) : !loading ? (
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
        <DialogContent style={{ display: "flex", flexDirection: "row" }}>
          <TextField
            label="Enter Video Id"
            variant="standard"
            placeholder="Video Id"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStartEventNow} color="primary" autoFocus>
            Start Now
          </Button>
        </DialogActions>
      </Dialog>
    </View>
  ) : loading ? (
    <h2>LOADING....</h2>
  ) : null;
}
