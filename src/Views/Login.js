import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { useHistory } from "react-router-dom";
import { AccountCircleOutlined, AccountCircle } from "@material-ui/icons";
import Loading from "../Components/Loading";

import { useSelector } from "react-redux";
import useActionDispatcher from "../Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";

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

export default function Login() {
  const history = useHistory();
  const dispatchAction = useActionDispatcher();
  const [creator, setCreator] = useState({});
  const [videoId, setVideoId] = useState("");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);


  const handleClickOpen = (modalType) => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  useEffect(() => {
    console.log('login component loaded')

  }, []);


  const googleLogin = async () => {
    if (!firebase.auth().currentUser) {

      var provider = new firebase.auth.GoogleAuthProvider();
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(function (result) {
          const token = result.credential.accessToken;
          const user = result.user;

          console.log(user);
          firebase
            .database()
            .ref(`${user['uid']}`)
            .once("value", async (snap) => {

              await dispatchAction(UPDATE_USER_DATA, {
                data: {
                  user_id: user['uid'],
                  is_creator: true,
                  email_id: user["email"]
                },
              });
              history.push(`/:${user['uid']}`)
              if (!snap.val()) {
                firebase.database().ref(`/${user['uid']}`).update({
                  name: user["displayName"],
                  email: user["email"],
                  online: 'false'
                });
              }
              else {
                firebase.database().ref(`/${user['uid']}`).update({
                  online: 'false'
                });
              }
            })
            .catch(function (error) {
              const errorcode = error.code;
              const errorMessage = error.message;
              const email = error.email;
              const credential = error.credential;
              console.log(errorMessage, errorcode);
            });
        })
    } else {
      var loggedInUser = firebase.auth().currentUser;
      await dispatchAction(UPDATE_USER_DATA, {
        data: {
          user_id: loggedInUser.uid,
          is_creator: true,
          email_id: loggedInUser.email
        },
      });
    }
  };




  return (
    <View
      style={{
        height: height,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        variant="outlined"
        startIcon={<AccountCircle style={{ color: "black" }} />}
        color="primary"
        onClick={googleLogin}
        style={{ fontSize: 13, marginTop: 10 }}
        size="small"
      >
        Proceed With Google
       </Button>
    </View>
  );

}
