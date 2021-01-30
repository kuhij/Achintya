import React, { useEffect, useState, useRef, Component } from "react";
import RecordRTC from "recordrtc";
import { storageRef } from "../App";
import * as firebase from "firebase";
import {
  Dimensions,
  Text,
  View,
} from "react-native";

import { useSelector } from "react-redux";

import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";
import useActionDispatcher from "../Hooks/useActionDispatcher";
const { width, height } = Dimensions.get("window");

export default function RecordPage(props) {
  const [videoSrc, setVideoSrc] = useState("")
  const [recordVideo, setRecordVideo] = useState(null)

  const [live, setLive] = useState("")

  const video = useRef()
  const live2 = useRef()

  const dispatchAction = useActionDispatcher();
  const user_data = useSelector((state) => state.globalUserData);

  useEffect(() => {
    recordRTC()
  }, [])

  //Recording WebRTC
  const recordRTC = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
        minWidth: 1280,
        minHeight: 720,
        maxWidth: 1920,
        maxHeight: 1080,
        minAspectRatio: 1.77,
      })
      .then(async function (stream) {
        setLive(stream)
        video.current.srcObject = stream
        //self.live2.current.srcObject = stream
        let recorder = new RecordRTC(stream, {
          mimeType: "video/webm;codecs=vp8",
          canvas: {
            width: 1920,
            height: 1080,
            minFrameRate: 3,
            maxFrameRate: 32,
          },
        });
        setRecordVideo(recorder)
        const rec = recorder.startRecording();
        console.log(recorder);
      });
  };

  const sendMessage = () => {
    let blobList = [];
    const date = Date.now()
    live.getTracks()[0].stop()
    live.getTracks()[1].stop()
    recordVideo.stopRecording(function () {
      let blob = recordVideo.getBlob();
      console.log(blob);
      storageRef.child('/AVO/messages/' + date).put(blob).then(function (snapshot) {
        console.log('recording uploaded ');
        const callerUrl = storageRef.child("/AVO/messages/" + date).getDownloadURL().then(async function (url) {
          var xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.open("GET", url,);
          xhr.onload = async function (e) {
            var blob = xhr.response;
            blobList.push(blob)
            var blobURL = new Blob(blobList, { 'type': "video/webm;codecs=h264" });
            var vid = window.URL.createObjectURL(blobURL);
            setVideoSrc(url)

            firebase.database().ref(`/Users/${props.spaceId}/data`).update({
              currentLetter: url
            }).then(() => {
              alert('uploaded')
              dispatchAction(UPDATE_USER_DATA, {
                data: {
                  revert: true,
                },
              });
            })
          };

          xhr.send();
          console.log(url);
        })
      })
    });
  }

  return (
    <View style={{ height: height, width: width }}>
      <video style={{ width: '100vw', height: height, margin: 0 }} src={live} ref={video} autoPlay playsInline></video>
      <View style={{ position: 'absolute', marginTop: height / 1.2, display: 'block', marginLeft: (width / 2) - 45, width: '100%' }}>
        <img src="./send-button.png" alt="send" style={{ height: 45, width: 45, cursor: 'pointer', padding: 15, background: 'white', borderRadius: '50%' }} className="video-overlay" onClick={sendMessage} />
      </View>
    </View>
  )

}
