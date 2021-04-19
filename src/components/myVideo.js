
import React, { useEffect, useState, useRef } from "react";

import firebase from "firebase";
import { notification } from 'antd';
import RecordRTC from 'recordrtc';

const height = window.innerHeight
const width = window.innerWidth
var pc = null;
let message = {}
const arr = []
//webrtc
var servers = { 'iceServers': [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' }, { 'urls': 'turn:numb.viagenie.ca', 'credential': 'PrivatePassword', 'username': 'anothermohit@gmail.com' }] };
const myId = Math.floor(Math.random() * 1000000000);
const senders = [];

pc = new RTCPeerConnection(servers);

let recorder;
let friendStream = null
let creator = false
export default function VideoRoom({ spaceName, myName }) {

    const [open, setOpen] = useState(false);
    const [ofer1, setOfer] = useState(false)

    const [friends, setFriendVideo] = useState(false)

    const myVideo = useRef()
    const friendsVideo = useRef()

    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };

    const ice = []
    const ice1 = []
    pc.onicecandidate = (event) => {
        if (event.candidate) {

            ice.push(event.candidate)

            firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages/ice`).update({ [Date.now()]: JSON.stringify({ 'ice': event.candidate }) });
            console.log(event.candidate, ice);
            arr.push(JSON.stringify(event.candidate))
        }
        else {
            console.log("Sent All Ice")
            console.log(pc)
            message.ice = JSON.stringify(ice)
            console.log(JSON.stringify(message));
            //firebase.database().ref(`/Spaces/${spaceName}/webRTC/`).update({ sender: myName, message: JSON.stringify(message) });
        }

    }

    // pc.onaddstream = function (event) {
    //     openNotification('bottomLeft', "onaddstream stream called.")
    //     setFriendVideo(true)
    //     friendsVideo.current.srcObject = event.stream;
    //     console.log(event.stream);

    // };//setFriendVideo(true)

    pc.ontrack = e => {

        friendsVideo.current.srcObject = e.streams[0];
        openNotification('bottomLeft', "ontrack stream called.")
        setFriendVideo(true)
        friendStream = e.streams[0]
        console.log(e.streams, e.streams[0]);
        console.log("Adding other person's video to my screen. step 19/20.");
    }

    pc.oniceconnectionstatechange = function (event) {

        console.log(pc.iceConnectionState)
        switch (pc.iceConnectionState) {

            case "connected":
                if (friendStream) {
                    friendsVideo.current.srcObject = friendStream;
                    console.log(friendStream, friendsVideo.current.srcObject);
                }

                console.log(friendStream, friendsVideo.current.srcObject);
                navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
                    // console.log(stream)

                    const recordVideo = RecordRTC(stream, {
                        mimeType: 'video/webm\;codecs=vp8',
                        canvas: {
                            width: 1920,
                            height: 1080,
                            minFrameRate: 3,
                            maxFrameRate: 32
                        }
                    });
                    console.log(recordVideo);
                    recordVideo.startRecording();
                    recorder = recordVideo
                }).then(() => {
                    firebase.database().ref(`/Spaces/${spaceName}/webRTC/`).on("value", function (snap) {
                        console.log('start listening');
                        if (snap.val()) {
                            console.log(friendStream, friendsVideo.current.srcObject);
                            if (snap.val().call === 'ended') {
                                pc.close()
                                recorder.stopRecording(function () {
                                    let blob = recorder.getBlob();
                                    let blobList = [];
                                    console.log('turn of storage ', recorder.getBlob());
                                    firebase.storage().ref().child(`one-one/random/${myName}`).put(blob).then(function (snapshot) {
                                        console.log('recording uploaded');

                                        const callerUrl = firebase.storage().ref().child(`one-one/random/${myName}`).getDownloadURL().then(async function (url) {
                                            var xhr = new XMLHttpRequest();
                                            xhr.responseType = 'blob';
                                            xhr.open("GET", url,);
                                            xhr.onload = async function (e) {
                                                var blob = xhr.response;
                                                blobList.push(blob)
                                                var blobURL = new Blob(blobList, { 'type': "video/webm;codecs=h264" });
                                                var vid = window.URL.createObjectURL(blobURL);
                                                //setVideoSrc(url)

                                            };

                                            xhr.send();
                                            console.log(url);
                                        })
                                    })
                                });


                            }
                        }
                    })
                })
                //switch off listener

                // if (!self.props.creator) {
                //     self.setState({ completion: true })
                //     console.log('completion true')
                // }

                // The connection has become fully connected
                break;
            case "disconnected":

                console.log('disconnected called.');

                break;
            case "failed":
                // One or more transports has terminated unexpectedly or in an error
                break;
            case "closed":
                // The connection has been closed
                break;
        }
    }


    const videoCall = () => {
        //setOfer(true)
        console.log('video call function called')
        console.log(pc);
        pc.createOffer()
            .then(offer => {
                console.log(offer)

                pc.setLocalDescription(offer).then(() => {
                    message.offer = JSON.stringify(pc.localDescription)
                    firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages`).update({ sender: myName, message: JSON.stringify(message) });
                    console.log('local des. updated ', pc);
                    setOfer(true)
                });
            });

    }

    useEffect(() => {
        firebase.database().ref(`/Users/${myName}/mySpace/`).once("value", function (snap) {
            if (snap.val()) {
                if (snap.val() === spaceName) {
                    creator = true
                    callUserMedia()
                } else {
                    callUserMedia()
                }
            } else {
                callUserMedia()
            }

        })
    }, []);

    const callUserMedia = () => {
        console.log('login component loaded ', creator)
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                console.log(stream)

                const tracks = stream.getTracks();

                tracks.forEach((track) => {
                    console.log(track);

                    senders.push(pc.addTrack(track, stream));
                });
                senders
                    .find((sender) => sender.track.kind === "video")
                    .replaceTrack(stream.getTracks()[1]);

                myVideo.current.srcObject = stream
            })
            .then(() => {
                if (creator) {
                    videoCall()
                }

                console.log('function called');
                submit()
            })

    }


    const submit = () => {

        if (creator) {
            firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages`).on("value", function (snap) {
                if (snap.val()) {

                    var convert = JSON.parse(snap.val().message)
                    var offer = JSON.parse(convert.offer)
                    //var ice = JSON.parse(convert.ice)

                    console.log(convert, ice, offer);
                    console.log(pc.signalingState);
                    if (offer.type === "answer") {

                        console.log(pc, "if condition ", offer);
                        pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
                            // setFriendVideo(true)
                            firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages/ice`).on("child_added", function (snap) {
                                if (JSON.parse(snap.val())) {
                                    var ice = JSON.parse(snap.val())
                                    pc.addIceCandidate(new RTCIceCandidate(ice.ice)).then(_ => {
                                        console.log("Added ice candidate to clien's peerconnection, // answer added ", pc)
                                    }).catch(e => {
                                        console.log("Error: Failure during addIceCandidate() ", e);
                                    });
                                }
                            })

                            // for (let i = 0; i < ice.length; i++) {
                            //     const element = ice[i];
                            //     console.log(element);

                            // }
                        }).catch(e => {
                            console.log("Error: Failure during set answer remote desc ", e, pc);
                        });
                    }
                }
            })

        } else if (!creator) {
            firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages`).on("value", function (snap) {
                if (snap.val()) {

                    var convert = JSON.parse(snap.val().message)
                    var offer = JSON.parse(convert.offer)
                    //var ice = JSON.parse(convert.ice)

                    console.log(convert, ice, offer);
                    console.log(pc.signalingState);
                    if (offer.type === "offer") {

                        console.log('else part ', offer);
                        pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
                            console.log('offer added');
                            firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages/ice`).on("child_added", function (snap) {
                                if (JSON.parse(snap.val())) {
                                    var ice = JSON.parse(snap.val())
                                    pc.addIceCandidate(new RTCIceCandidate(ice.ice)).then(_ => {
                                        console.log("Added ice candidate to clien's peerconnection, offer added")
                                    }).catch(e => {
                                        console.log("Error: Failure during offer addIceCandidate() ", e);
                                    });
                                }
                            })

                            // for (let i = 0; i < ice.length; i++) {
                            //     const element = ice[i];
                            //     console.log(element);
                            //     pc.addIceCandidate(new RTCIceCandidate(element)).then(_ => {
                            //         console.log("Added ice candidate to clien's peerconnection which was sent by lawyer, step 18")
                            //     }).catch(e => {
                            //         console.log("Error: Failure during addIceCandidate() ", e);
                            //     });
                            // }
                            pc.createAnswer()
                                .then(answer => {
                                    console.log('answer ', answer, pc);
                                    //passVideo()

                                    pc.setLocalDescription(answer)
                                        .then(() => {
                                            message.offer = JSON.stringify(pc.localDescription)
                                            firebase.database().ref(`/Spaces/${spaceName}/webRTC/messages`).update({ sender: myName, message: JSON.stringify(message) });
                                        })
                                }).then(() => {
                                    console.log(pc, 'answer created');
                                })
                        })
                    }
                }
            })
        }

    }

    const callEnded = () => {
        firebase.database().ref(`/Spaces/${spaceName}/webRTC/`).update({
            call: "ended",
        });
    }


    return (
        <div
            style={{
                height: height,
                width: "100%",
                width: width,
                minHeight: "100%",
                minWidth: "100%",
                position: "relative",
                overflow: 'hidden'
            }}
        >
            <div>
                <button onClick={callEnded}>End</button>
                <div
                    style={{
                        position: "absolute",
                        background: "transparent",
                        zIndex: 1000,
                        width: width,

                    }}
                >

                </div>

                <video style={{
                    transform: "rotateY(180deg)",
                    width: width,
                    height: height / 2,
                    background: "black",
                }}
                    loop ref={myVideo} autoPlay muted playsInline>
                    myVideo
                    </video>

                <video style={{
                    transform: "rotateY(180deg)",
                    width: width,
                    height: height / 2,
                    background: "black",

                }}
                    loop ref={friendsVideo} autoPlay playsInline>
                    friendVideo
                    </video>

            </div>
        </div>

    )
}