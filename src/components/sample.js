import { MessageOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Drawer, message, Select, Spin, Steps, Upload } from "antd";
import "antd/dist/antd.css";
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { LEFT, RIGHT, Swipeable } from "react-swipeable";
import { GiftedChat } from "react-gifted-chat";
import { ChatFeed, Message } from "react-chat-ui";
import RecordRTC from "recordrtc";
import RenderCenteredUserProfilePic from "./RenderCenteredUserProfilePic";
import AppointmentModalButton from "../RenderClientHome/AppointmentModalButton";
import firebase from "firebase";
import {
    CallEndRounded,
    MicOffRounded,
    MicRounded,
    ScreenShareRounded,
    Send,
    StopScreenShareRounded,
    VideocamOffRounded,
    VideocamRounded,
} from "@material-ui/icons";
import { IconButton, Button as MButton } from "@material-ui/core";
import Timer from "react-compound-timer";

const { Option } = Select;
const { Step } = Steps;

var pc = null;

//File sharing variables
var chunkLength = 10000; // To divide file into chunks
var loaded = 0; // To calculate percentage of downloaded file on receiver side

//webrtc
var servers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: "turn:numb.viagenie.ca",
            credential: "PrivatePassword",
            username: "anothermohit@gmail.com",
        },
    ],
};
const yourId = Math.floor(Math.random() * 1000000000);
let senders = [];

class VideoCall extends Component {
    constructor(props) {
        super(props);

        this.yourVideo = React.createRef();
        this.friendsVideo = React.createRef();
        this.textRTC = React.createRef();
        this.timer = React.createRef();
        console.log("constructor");

        this.state = {
            myVideo: false,
            landingPage: true,
            spin: true,
            callFriend: false,
            callUserValue: "",
            callUser: "",
            recordVideo: null,
            callRequest: false,
            callStatus: false,
            otherVideo: false,
            otherScreenshare: false,
            username: this.props.username,
            clue: "",
            drawerVisible: false,
            screenShare: false,
            messages: [],
            profilePic: this.props.profilePic,
            displayName: this.props.displayName,
            fileList: null, // File sharing - list of files
            fileURL: null, // File sharing - download url
            fileName: "",
            creator: this.props.creator,
            videoOn: true,
            audioOn: true,
            showSelfVid: false,
            text: "",
            startTime: "",
            fileRec: false,
            fileRecName: "",
            allMessages: {},
            lawyerTier: "",
            // File sharing - name
        };

        this.baseState = this.state;
    }

    timerRef = {};



    componentDidMount() {
        const self = this;
        navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then((stream) => (this.yourVideo.current.srcObject = stream))
            .then((stream) => {
                console.log(stream.getTracks());
                //stream.getTracks()[1].enabled = false;
                console.log(
                    "1 & 2. Show my face using user media stream. at time: ",
                    Date.now()
                );
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.username + "/webRTC")
                    .update({ [Date.now()]: "step 1/2" });
                self.setState({ videoStream: stream, videoOn: false, audioOn: true });

                console.log("this.state.creator", this.state.creator);
                if (!this.state.creator) {
                    this.setState({
                        myVideo: false,
                        clue: "Self video streaming successfully",
                    });
                    this.findLawyer();
                } else {
                    const docRef = firebase
                        .database()
                        .ref("/Accounts/" + this.state.username + "/message");

                    docRef.on("value", (snapshot) => {
                        console.log(snapshot.val());
                        self.setState({
                            otherVideo: snapshot.val().clientVideo,
                            otherScreenshare: snapshot.val().clientScreenshare,
                            selfVideo: snapshot.val().lawyerVideo,
                            selfScreenshare: snapshot.val().lawyerScreenshare,
                            isLawyer: true,
                        });
                    });
                    this.setlawyer();
                    this.setState({
                        myVideo: false,
                        clue: "Self video streaming successfully",
                    });
                }
                // alert(this.state.videoOn);
            });

        document.addEventListener("keydown", this.handleGlobalKeyPress);
        var presenceRef = firebase
            .database()
            .ref("Accounts/" + this.state.username);
        presenceRef.onDisconnect().update({ currentOnline: false });
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleGlobalKeyPress);
        this.setState(this.baseState);
    }

    handleGlobalKeyPress = (event) => {
        if (event.key === "ArrowRight") {
            if (!this.state.myVideo) {
                this.setState({ myVideo: true });
            }
        }
        if (event.key === "ArrowLeft") {
            if (this.state.myVideo) {
                this.setState({ myVideo: false });
            }
        }
    };

    stopVideo = () => {
        if (this.state.videoOn) {
            const videoTrack = senders.find(
                (sender) => sender.track.kind === "video"
            );
            if (!this.state.creator) {
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.callUserValue + "/message/clientVideo")
                    .once("value", (snap) => {
                        if (!snap.val()) {
                            firebase
                                .database()
                                .ref("/Accounts/" + this.state.callUserValue + "/message")
                                .update({ clientVideo: true });
                        } else {
                            this.setState({ videoOn: false, showSelfVid: false });

                            videoTrack.track.stop();
                            firebase
                                .database()
                                .ref("/Accounts/" + this.state.callUserValue + "/message")
                                .update({ clientVideo: false });
                        }
                    });
            } else {
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.username + "/message/lawyerVideo")
                    .once("value", (snap) => {
                        if (!snap.val()) {
                            firebase
                                .database()
                                .ref("/Accounts/" + this.state.username + "/message")
                                .update({ lawyerVideo: true });
                        } else {
                            this.setState({ videoOn: false, showSelfVid: false });

                            videoTrack.track.stop();
                            firebase
                                .database()
                                .ref("/Accounts/" + this.state.username + "/message")
                                .update({ lawyerVideo: false });
                        }
                    });
            }

            // if (!this.state.creator) {
            //   firebase
            //     .database()
            //     .ref("/Accounts/" + this.state.callUserValue + "/message")
            //     .update({ clientVideo: false });
            // } else {
            //   firebase
            //     .database()
            //     .ref("/Accounts/" + this.state.username + "/message")
            //     .update({ lawyerVideo: false });
            // }

            console.log("Video off");
            // this.setState({ videoOn: false });
        } else {
            if (!this.state.creator) {
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.callUserValue + "/message")
                    .update({ clientVideo: true });
            } else {
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.username + "/message")
                    .update({ lawyerVideo: true });
            }
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then((stream) => {
                    console.log(stream.getTracks());
                    // console.log(senders);
                    senders
                        .find((sender) => sender.track.kind === "video")
                        .replaceTrack(stream.getTracks()[1]);
                    // console.log(senders);
                    // console.log(stream.getTracks());
                    this.yourVideo.current.srcObject = stream;
                });
            console.log(senders.find((sender) => sender.track.kind === "video"));
            this.setState({ videoOn: true }); // Video button toggle
        }
    };
    stopAudio = () => {
        if (this.state.audioOn) {
            const audioTrack = senders.find(
                (sender) => sender.track.kind === "audio"
            );
            audioTrack.track.enabled = false;
            console.log("Audio off");
            this.setState({ audioOn: false });
        } else {
            const audioTrack = senders.find(
                (sender) => sender.track.kind === "audio"
            );
            audioTrack.track.enabled = true;
            console.log("Audio on");
            this.setState({ audioOn: true });
        }
    };
    // Share screen
    shareScreen = () => {
        // if (!displayMediaStream) {
        //   displayMediaStream = navigator.mediaDevices.getDisplayMedia();
        // }
        if (!this.state.screenShare) {
            navigator.mediaDevices.getDisplayMedia().then((stream) => {
                console.log(stream.getTracks());
                if (!this.state.creator) {
                    firebase
                        .database()
                        .ref("/Accounts/" + this.state.callUserValue + "/message")
                        .update({ clientVideo: true });
                } else {
                    firebase
                        .database()
                        .ref("/Accounts/" + this.state.username + "/message")
                        .update({ lawyerVideo: true });
                }
                // console.log(senders);
                if (senders.find((sender) => sender.track.kind === "video")) {
                    senders
                        .find((sender) => sender.track.kind === "video")
                        .replaceTrack(stream.getTracks()[0]);
                    console.log(senders);
                } else {
                    senders.push(pc.addTrack(stream.getTracks()[0]));
                }
                console.log(stream.getTracks());
                this.yourVideo.current.srcObject = stream;
                this.setState({ screenShare: true });
                //browser stopshare button callback

                stream.getVideoTracks()[0].addEventListener("ended", () => {
                    this.handleStopScreenShare();
                });
            });
        } else {
            this.handleStopScreenShare();
        }
    };

    handleStopScreenShare = () => {
        console.log("Stop share");
        if (!this.state.creator) {
            firebase
                .database()
                .ref("/Accounts/" + this.state.callUserValue + "/message")
                .update({ clientVideo: false });
        } else {
            firebase
                .database()
                .ref("/Accounts/" + this.state.username + "/message")
                .update({ lawyerVideo: false });
        }
        if (!this.state.videoOn) {
            const screenTrack = senders.find(
                (sender) => sender.track.kind === "video"
            );
            screenTrack.track.stop();
            this.setState({ screenShare: false });
        } else {
            const shareTrack = senders.find(
                (sender) => sender.track.kind === "video"
            );
            shareTrack.track.stop();
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then((stream) => {
                    // console.log(stream.getTracks());
                    // console.log(senders);
                    senders
                        .find((sender) => sender.track.kind === "video")
                        .replaceTrack(stream.getTracks()[1]);
                    // console.log(senders);
                    // console.log(stream.getTracks());
                    this.yourVideo.current.srcObject = stream;
                    this.setState({ screenShare: false });
                });
        }
    };
    // To handle received message on chat/file transfer
    handleChatMessage = (event, arrayToStoreChunks) => {
        var data = JSON.parse(event.data);

        console.log(data.type);
        if (data.type === "file") {
            console.log("file recieved");

            this.setState({
                progressBar: true,
                drawerOpen: true,
                drawerVisible: true,
                fileRec: true,
                fileRecName: data.fileName,
            });
            var fileName = data.fileName;
            var fileType = data.fileType;
            var fileSize = data.fileSize;
            var totalLength = data.totalLength;

            console.log(fileName + fileType + fileSize);
            arrayToStoreChunks.push(data.message); // pushing chunks in array
            //console.log(data.message.length);
            loaded += data.message.length;
            console.log(loaded);

            if (data.last) {
                // this.saveToDisk(arrayToStoreChunks.join(''), fileName);
                this.setState({
                    fileURL: arrayToStoreChunks.join(""),
                    fileName: fileName,
                    downloadButton: true,
                });
                arrayToStoreChunks = []; // resetting array
            }
        } else if (data.type === "text") {
            console.log(data.message);
            console.log("Friend : " + data.message, data.id);
            if (this.state.creator) {
                this.setState((previousState) => ({
                    drawerVisible: true,
                    allMessages: {
                        ...previousState.allMessages,
                        [`${Date.now()}_client`]: data.message,
                    },
                    messages: [
                        ...previousState.messages,
                        new Message({ id: data.id, message: data.message }),
                    ],
                }));
            } else {
                this.setState((previousState) => ({
                    drawerVisible: true,
                    messages: [
                        ...previousState.messages,
                        new Message({ id: data.id, message: data.message }),
                    ],
                }));
            }

            // console.log(event.data.size);
            // document.getElementById('messageReceived').append('Friend :' + data.message);
            // document.getElementById('messageReceived').innerHTML += '<br></br>'
        }
    };

    // To send messages on chat
    sendInputMessage = () => {
        const input = "hey";
        var data = {};
        console.log(this.textRTC.current.state.value);
        data.type = "text";
        data.message = this.textRTC.current.state.value;
        this.state.dataChannel.send(JSON.stringify(data));
        this.setState({
            messageReceived: [
                ...this.state.messageReceived,
                { name: "you", message: this.textRTC.current.state.value },
            ],
        });
    };

    // To select and load the file
    fileSelect = (e) => {
        this.setState({ progressBar: true }); // Show progress bar
        var fileList = e.target.files;
        var file = fileList[0];
        this.setState({ fileList: file });
        console.log(fileList);
        console.log(
            "File name: " +
            file.name +
            "  File type: " +
            file.type +
            " File size: " +
            file.size
        );

        const reader = new FileReader();
        reader.readAsDataURL(file);
        // const img = document.getElementById('preview')     // To show preview

        reader.onload = this.onReadAsDataURL;
    };

    // To SEND the file after clicking 'SEND' button  - - - NOT IMPLEMENTED YET - - -
    sendFileButton = (e) => {
        var input = document.getElementById("inputFile").value;
        // var files = this.files[0];
        // console.log(files);
        //document.getElementById('downloadSection').innerHTML= '<a href="input" download="inputfile">'
        console.log(input);
    };

    // To SEND the file once loaded
    onReadAsDataURL = (event, text) => {
        const that = this;
        var dataChannel = this.state.dataChannel;
        var file = that.state.fileList;
        //var fileDetailsArray = Object.keys(file).map((key)=>[key,file[key]])
        var data = {}; // data object to transmit over data channel
        data.fileName = file.name;
        data.fileType = file.type;
        data.fileSize = file.size;

        if (event) {
            text = event.target.result;
            data.totalLength = text.length;
        } // on first invocation

        if (text.length > chunkLength) {
            data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
            data.type = "file";
        } else {
            data.message = text;
            data.type = "file";
            data.last = true;
        }

        dataChannel.send(JSON.stringify(data));

        var remainingDataURL = text.slice(data.message.length);
        if (remainingDataURL.length) {
            that.onReadAsDataURL(null, remainingDataURL); // continue transmitting
        }
    };

    // To save the file received during call //
    saveToDisk = async () => {
        const fileUrl = this.state.fileURL;
        const fileName = this.state.fileName;
        var save = document.createElement("a");
        save.href = fileUrl;
        save.target = "_blank";
        save.download = fileName || fileUrl;

        var evt = document.createEvent("MouseEvents");
        await evt.initMouseEvent(
            "click",
            true,
            true,
            window,
            1,
            0,
            0,
            0,
            0,
            false,
            false,
            false,
            false,
            0,
            null
        );

        await save.dispatchEvent(evt);
        await (window.URL || window.webkitURL).revokeObjectURL(save.href);
        await this.deleteReceivedfile();
        await this.setState({ fileRec: false });
    };
    // Delete received file //
    deleteReceivedfile = () => {
        this.setState({ fileRec: false, fileURL: null, fileName: "" });
    };

    videoCall = () => {
        pc = new RTCPeerConnection(servers);
        let dataChannel = pc.createDataChannel("MyApp Channel");
        dataChannel.addEventListener("open", (event) => {
            //dataChannel.send('hello');
            console.log("Data Channel is open now!" + Date.now());
            //   //beginTransmission(dataChannel);
        });
        dataChannel.onmessage = function (event) {
            console.log(event.data);
        };
        pc.ondatachannel = (event) => {
            console.log("Listening data channel");
            var channelRec = event.channel;
            var arrayToStoreChunks = [];
            channelRec.onmessage = function (event) {
                self.handleChatMessage(event, arrayToStoreChunks);
            };
            console.log(channelRec);
        };
        this.setState({ dataChannel });
        console.log(" peer connection created.");
        if (this.state.callFriend) {
            console.log(this.state.callFriend, this.state.callUserValue);
            firebase
                .database()
                .ref("/Accounts/" + this.state.callUserValue + "/webRTC")
                .update({ [Date.now()]: "step: 3" });
        } else {
            firebase
                .database()
                .ref("/Accounts/" + this.state.username + "/webRTC")
                .update({ [Date.now()]: "step: 4" });
        }

        this.setState({ pc: pc });
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (this.state.callFriend) {
                    console.log("send ice candidate to lawyer by client, step 10.");
                    this.sendMessageToCallICE(
                        this.state.username,
                        JSON.stringify({ ice: event.candidate })
                    );
                    firebase
                        .database()
                        .ref("/Accounts/" + this.state.callUserValue + "/webRTC")
                        .update({ [Date.now()]: "step: 10" });
                } else {
                    console.log("send ice candidate to client by lawyer, step 17.");
                    firebase
                        .database()
                        .ref("/Accounts/" + this.state.username + "/webRTC")
                        .update({ [Date.now()]: "step: 17" });
                    this.sendMessageICE(
                        this.state.username,
                        JSON.stringify({ ice: event.candidate })
                    );
                }
            } else {
                console.log("Sent All Ice");
                console.log(pc);
            }
        };
        pc.onaddstream = (event) => {
            this.friendsVideo.current.srcObject = event.stream;
            const recordVideo = RecordRTC(event.stream, {
                mimeType: "video/webm;codecs=vp8",
                canvas: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    minFrameRate: 3,
                    maxFrameRate: 50,
                },
            });
            self.setState({ recordVideo: recordVideo });
            if (this.state.creator) {
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.username)
                    .on("value", (snap) => {
                        if (snap.val().lawyerFirm === "self") {
                            this.setState({ lawyerFirm: "self" });
                        } else {
                            firebase
                                .database()
                                .ref("Firms")
                                .orderByChild("name")
                                .equalTo(snap.val().lawyerFirm)
                                .on("value", (snap) => {
                                    snap.forEach((child) =>
                                        this.setState({ lawyerFirm: child.key })
                                    );
                                });
                        }
                    });
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.username)
                    .on("value", (snap) => {
                        this.setState({
                            lawyerTier:
                                snap.val().tier === "EXEC"
                                    ? 9
                                    : snap.val().tier === "XL"
                                        ? 6
                                        : snap.val().tier === "X"
                                            ? 3
                                            : 0,
                        });
                    });
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.username + "/message")
                    .update({ startTimer: true })
                    .then(() => {
                        message.success("RECORDING NOW.");
                        this.timerRef.start();
                        recordVideo.startRecording();
                    });
            } else {
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.callUserValue)
                    .on("value", (snap) => {
                        this.setState({
                            lawyerTier:
                                snap.val().tier === "EXEC"
                                    ? 9
                                    : snap.val().tier === "XL"
                                        ? 6
                                        : snap.val().tier === "X"
                                            ? 3
                                            : 0,
                        });
                    });
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.username + "/name")
                    .on("value", (snapName) => {
                        firebase
                            .database()
                            .ref("/Accounts/" + this.state.callUserValue)
                            .update({ clientName: snapName.val() });
                    });
                firebase
                    .database()
                    .ref("/Accounts/" + this.state.callUserValue + "/message/startTimer")
                    .on("value", (snap) => {
                        if (snap.val()) {
                            message.success("RECORDING NOW.");
                            this.timerRef.start();
                            recordVideo.startRecording();
                        }
                    });
            }
            console.log("Adding other person's video to my screen. step 19/20.");
            console.log(event.stream);
            this.setState({ clue: "Other video recieved" });
            this.setState({ spin: false });
        };

        // pc.onaddtrack = function (event) {
        //   alert("ADDING TRACK");
        //   console.log(event.track.kind + ": " + event.track.label);
        //   this.friendsVideo.current.srcObject = event.track;
        //   this.setState({ spin: false });
        // };
        const self = this;
        if (this.state.callFriend) {
            const stream = this.state.videoStream;
            const tracks = stream.getTracks();

            tracks.forEach((track) => {
                senders.push(pc.addTrack(track, stream));
            });

            /* pc.createOffer()
                  .then((offer) => {
                      pc.setLocalDescription(offer)
                      console.log('first offer made')
                  })
                  .then(() => {*/

            pc.createOffer().then((offer) => {
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.callUserValue + "/webRTC")
                    .update({ [Date.now()]: "step: 5" });
                console.log("offer created");
                pc.setLocalDescription(offer)
                    .then(() => {
                        firebase
                            .database()
                            .ref("/Accounts/" + self.state.callUserValue + "/webRTC")
                            .update({ [Date.now()]: "step: 6" });
                    })
                    .then(() => {
                        self.sendMessageToCall(
                            this.state.username,
                            JSON.stringify({ sdp: pc.localDescription })
                        );
                        firebase
                            .database()
                            .ref("/Accounts/" + self.state.callUserValue + "/webRTC")
                            .update({ [Date.now()]: "step: 7" });
                    });
            });

            const docRef = firebase
                .database()
                .ref("/Accounts/" + self.state.callUserValue + "/message");
            docRef.on("value", (snapshot2) => {
                self.setState({ startTime: snapshot2.val().startTime });
                if (snapshot2.val().message) {
                    if (JSON.parse(snapshot2.val().message)) {
                        console.log(snapshot2.val().message);
                        const msg = JSON.parse(snapshot2.val().message);
                        console.log("inside answer reading function");

                        console.log(msg);
                        const sender = snapshot2.val().sender;
                        if (sender != this.state.username && !pc.remoteDescription) {
                            if (self.state.callStatus) {
                                if (msg.sdp.type === "answer") {
                                    console.log("setting remote description");
                                    pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                                        .then(() => {
                                            const docRef2 = firebase
                                                .database()
                                                .ref(
                                                    "/Accounts/" +
                                                    self.state.callUserValue +
                                                    "/ice/lawyerIce"
                                                );
                                            docRef2.on("child_added", (snapshot) => {
                                                if (JSON.parse(snapshot.val())) {
                                                    const ice = JSON.parse(snapshot.val());

                                                    if (self.state.callStatus) {
                                                        pc.addIceCandidate(new RTCIceCandidate(ice.ice))
                                                            .then((_) => {
                                                                firebase
                                                                    .database()
                                                                    .ref(
                                                                        "/Accounts/" +
                                                                        self.state.callUserValue +
                                                                        "/webRTC"
                                                                    )
                                                                    .update({ [Date.now()]: "step: 18" });
                                                                console.log(
                                                                    "Added ice candidate to clien's peerconnection which was sent by lawyer, step 18"
                                                                );
                                                                self.setState({
                                                                    clue:
                                                                        "Added ice candidate to client's peerconnection",
                                                                });
                                                                console.log(ice.ice);
                                                            })
                                                            .catch((e) => {
                                                                console.log(
                                                                    "Error: Failure during addIceCandidate()"
                                                                );
                                                            });
                                                    }
                                                }
                                            });
                                            firebase
                                                .database()
                                                .ref(
                                                    "/Accounts/" + self.state.callUserValue + "/webRTC"
                                                )
                                                .update({ [Date.now()]: "step: 15" });
                                        })
                                        .catch((e) => {
                                            console.log(
                                                "Error: Failure while adding answer to remote description"
                                            );
                                        });
                                    if (snapshot2.val().callStatus) {
                                        message.success("Call connected.");
                                    }
                                }
                            }
                        }
                    }
                }
            });
            //});
        } else {
            /* pc.createOffer()
                  .then((offer) => {
                      pc.setLocalDescription(offer)
                      console.log('first offer made')
                  })
                  .then(() => {*/
            console.log("lawyer in videocall function");
            const stream = this.state.videoStream;
            const tracks = stream.getTracks();

            tracks.forEach((track) => {
                console.log(track);
                senders.push(pc.addTrack(track, stream));
            });

            const docRef = firebase
                .database()
                .ref("/Accounts/" + this.state.username + "/message");

            docRef.on("value", (snapshot) => {
                self.setState({
                    callerId: snapshot.val().callerId,
                    startTime: snapshot.val().startTime,
                });
                if (snapshot.val().message && pc.connectionState != "closed") {
                    var msg = JSON.parse(snapshot.val().message);
                    const sender = snapshot.val().sender;
                    if (sender != this.state.username && !pc.remoteDescription) {
                        if (msg.sdp.type === "offer") {
                            console.log(
                                "offer sent by client is recieved by lawyer, step 8."
                            );
                            self.setState({ clue: "offer recieved from the client" });

                            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(
                                () => {
                                    firebase
                                        .database()
                                        .ref("/Accounts/" + self.state.username + "/webRTC")
                                        .update({ [Date.now()]: "step: 8" });
                                    const docRef2 = firebase
                                        .database()
                                        .ref("/Accounts/" + self.state.username + "/ice/clientIce");
                                    docRef2.on("child_added", (snapshot) => {
                                        if (JSON.parse(snapshot.val())) {
                                            const ice = JSON.parse(snapshot.val());
                                            pc.addIceCandidate(ice.ice)
                                                .then(() => {
                                                    console.log(
                                                        "Added ice candidate at lawyer peer connection sent by client, step:11 "
                                                    );
                                                    firebase
                                                        .database()
                                                        .ref("/Accounts/" + self.state.username + "/webRTC")
                                                        .update({ [Date.now()]: "step:11" });
                                                    self.setState({
                                                        clue:
                                                            'Added ice candidate to lawyer"s peerconnection',
                                                    });
                                                    console.log(ice.ice);
                                                })
                                                .catch((e) => {
                                                    console.log(
                                                        "Error: Failure during addIceCandidate()",
                                                        e
                                                    );
                                                    console.log(ice.ice);
                                                });
                                        }
                                    });
                                    pc.createAnswer().then((answer) => {
                                        firebase
                                            .database()
                                            .ref("/Accounts/" + self.state.username + "/webRTC")
                                            .update({ [Date.now()]: "step: 12" });
                                        pc.setLocalDescription(answer)
                                            .then(() => {
                                                firebase
                                                    .database()
                                                    .ref("/Accounts/" + self.state.username + "/webRTC")
                                                    .update({ [Date.now()]: "step: 13" });
                                            })
                                            .then(() => {
                                                self.sendMessage(
                                                    this.state.username,
                                                    JSON.stringify({ sdp: pc.localDescription })
                                                );
                                                firebase
                                                    .database()
                                                    .ref("/Accounts/" + self.state.username + "/webRTC")
                                                    .update({ [Date.now()]: "step: 14" });
                                                self.setState({ clue: "answer sent to the client" });
                                            });
                                    });
                                }
                            );
                        }
                    }
                }
            });
            //});
        }
    };

    callUser = (callUserValue) => {
        const self = this;
        self.setState({ callFriend: true });
        console.log("inside callUser fuction");

        //const sleep = m => new Promise(r => setTimeout(r, m));
        firebase
            .database()
            .ref("/Accounts/" + callUserValue + "/message")
            .update({
                callRequest: true,
                callerId: self.state.username,
                callerProfilePic: this.state.profilePic,
                callerName: this.state.displayName,
            });
        const lawyer = firebase.database().ref("/Accounts/" + callUserValue);
        lawyer.on("value", (snapshot) => {
            if (snapshot.val()) {
                this.setState({
                    callerProfilePic: snapshot.val().profilePic || "",
                });
            }
        });
        const docRef2 = firebase
            .database()
            .ref("/Accounts/" + callUserValue + "/message/reject");
        docRef2.on("value", (snapshot2) => {
            console.log(snapshot2.val());
            if (snapshot2.val()) {
                message.success("Call rejected");
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.callUserValue + "/message/")
                    .update({
                        reject: false,
                    });
                self.endClientCall();
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.callUserValue + "/message/callStatus")
                    .off();
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.callUserValue + "/message/reject")
                    .off();
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.callUserValue + "/message")
                    .off();
                firebase
                    .database()
                    .ref("/Accounts/" + self.state.callUserValue + "/ice")
                    .off();

                self.setState({ callUserValue: "", callFriend: false });
                senders.forEach((track) => {
                    console.log(track);
                    track.track.stop();
                });
            }
        });
        const docRef3 = firebase
            .database()
            .ref("/Accounts/" + this.state.callUserValue + "/message");

        docRef3.on("value", (snapshot) => {
            console.log(snapshot.val());
            self.setState({
                otherVideo: snapshot.val().lawyerVideo,
                otherScreenshare: snapshot.val().lawyerScreenshare,
                selfVideo: snapshot.val().clientVideo,
                selfScreenshare: snapshot.val().clientScreenshare,
            });
        });
        const docRef = firebase
            .database()
            .ref("/Accounts/" + this.state.callUserValue + "/message/callStatus");
        docRef.on("value", (snapshot) => {
            if (snapshot.val()) {
                if (!self.state.callStatus) {
                    console.log("Got a notification that lawyer accepted the call");
                    message.success("lawyer accepted. connecting...", 1.5);
                    self.setState({
                        callStatus: snapshot.val(),
                        spin: false,
                        myVideo: false,
                    });
                    //self.state.recordVideo.startRecording();
                    self.videoCall();
                }
            } else {
                if (self.state.callStatus) {
                    self.timerRef.pause();
                    self.state.recordVideo.stopRecording(function () {
                        let blob = self.state.recordVideo.getBlob();

                        firebase
                            .storage()
                            .ref()
                            .child(
                                self.state.callUserValue +
                                "/" +
                                self.state.startTime +
                                "/client"
                            )
                            .put(blob)
                            .then(function (snapshot) {
                                console.log("recording uploaded, process completed");
                                message.success("Recording uploaded");
                            });
                    });
                    firebase
                        .database()
                        .ref(
                            "/Accounts/" + self.state.callUserValue + "/message/callStatus"
                        )
                        .off();
                    firebase
                        .database()
                        .ref("/Accounts/" + self.state.callUserValue + "/message")
                        .off();
                    firebase
                        .database()
                        .ref("/Accounts/" + self.state.callUserValue + "/ice")
                        .off();
                    self.setState({
                        callStatus: snapshot.val(),
                        callUser: "",
                        callFriend: false,
                        landingPage: true,
                    });
                    self.state.videoStream.getTracks().forEach(function (track) {
                        console.log(track);
                        track.stop();
                    });

                    //self.state.pc.close()
                    self.state.pc = null;
                    message.success("Call ended");
                    console.log("call ended by either of the participants");
                    self.endClientCall();
                }
            }
        });
    };
    //webrtc
    sendMessageToCall(senderId, data) {
        var msg = firebase
            .database()
            .ref("/Accounts/" + this.state.callUserValue + "/message")
            .update({ sender: senderId, message: data });
    }

    sendMessageToCallICE(senderId, data) {
        var msg = firebase
            .database()
            .ref("/Accounts/" + this.state.callUserValue + "/ice/clientIce")
            .update({ [Date.now()]: data });
    }

    sendMessage(senderId, data) {
        var msg = firebase
            .database()
            .ref("/Accounts/" + this.state.username + "/message")
            .update({ sender: senderId, message: data });
    }
    sendMessageICE(senderId, data) {
        console.log(Date.now(), data);
        var msg = firebase
            .database()
            .ref("/Accounts/" + this.state.username + "/ice/lawyerIce")
            .update({ [Date.now()]: data });
    }

    endCall = () => {
        const endTime = Date.now();

        if (!this.state.callFriend)
            firebase
                .database()
                .ref("/Accounts/" + this.state.username + "/message")
                .update({ callStatus: false, endTime: endTime });
        else {
            firebase
                .database()
                .ref("/Accounts/" + this.state.callUserValue + "/message")
                .update({ callStatus: false, endTime: endTime });
        }
    };
    onDrawerClose = () => {
        this.setState({
            drawerVisible: false,
        });
    };
    showDrawer = () => {
        this.setState({
            drawerVisible: true,
        });
    };

    onSwiping = (event) => {
        console.log(event);

        if (event.dir === LEFT) {
            if (!this.state.myVideo) {
                this.setState({ myVideo: true });
            }
        }
        if (event.dir === RIGHT) {
            if (this.state.myVideo) {
                this.setState({ myVideo: false });
            }
        }
    };

    clientIncomingCallRequest = (clientData) => {
        console.log("hoolaaa", clientData);
        //global state of current client details for lawyer
    };

    setlawyer = () => {
        const self = this;
        this.setState({ isLawyer: true, landingPage: false });
        console.log("setlawyer fuction called");
        const callerPicRef = firebase
            .database()
            .ref("/Accounts/" + this.state.username + "/message");
        callerPicRef.on("value", (snapshot) => {
            this.clientIncomingCallRequest(snapshot.val());
            this.setState({
                callerProfilePic: snapshot.val().callerProfilePic,
            });
        });
        const docRef2 = firebase
            .database()
            .ref("/Accounts/" + this.state.username + "/message/callStatus");
        docRef2.on("value", (snapshot2) => {
            if (snapshot2.val()) {
                if (!self.state.callStatus) {
                    console.log(
                        "Lawyer accept the call and webrtc process is about to start"
                    );
                    //self.state.recordVideo.startRecording();
                    self.videoCall();
                    self.setState({ callStatus: snapshot2.val() });
                }
            } else {
                if (self.state.callStatus) {
                    self.state.recordVideo.stopRecording(function () {
                        let blob = self.state.recordVideo.getBlob();
                        firebase
                            .storage()
                            .ref()
                            .child(self.state.username + "/" + self.state.startTime)
                            .put(blob)
                            .then(function (snapshot) {
                                console.log("recording uploaded, processes finished");

                                const startTime = self.state.startTime;
                                firebase
                                    .database()
                                    .ref("/Accounts/" + self.state.username + "/timeline")
                                    .update({ [startTime]: self.state.callerId });
                                firebase
                                    .database()
                                    .ref("/Accounts/" + self.state.username + "/message")
                                    .update({
                                        startTime: null,
                                        callRequest: false,
                                        message: null,
                                        sender: self.state.username,
                                    });

                                firebase
                                    .database()
                                    .ref("/Accounts/" + self.state.username + "/ice")
                                    .off();
                                firebase
                                    .database()
                                    .ref(
                                        "/Accounts/" + self.state.username + "/message/callStatus"
                                    )
                                    .off();

                                self.state.pc.close();
                                self.state.pc = null;
                                self.state.recordVideo.reset();
                                message.success("Recording uploaded");
                            });
                    });
                    self.state.videoStream.getTracks().forEach(function (track) {
                        console.log(track);
                        track.stop();
                    });
                    self.setState({
                        callStatus: snapshot2.val(),
                        isLawyer: false,
                        landingPage: true,
                    });
                    self.endLawyerCall();
                    message.success("Call ended by one of the participants");
                }
            }
        });
    };

    resetAfterCall = () => {
        firebase
            .database()
            .ref("/Accounts/" + this.props.username)
            .update({
                currentOnline: false,
                webRTC: {},
            });
        firebase
            .database()
            .ref("/Accounts/" + this.props.username + "/message")
            .update({
                startTime: null,
                callRequest: false,
                callStatus: false,
                reject: false,
                message: null,
                lawyerVideo: false,
                clientVideo: false,
                lawyerScreenshare: false,
                clientScreenshare: false,
                sender: this.props.username,
            });
        firebase
            .database()
            .ref("/Accounts/" + this.props.username + "/ice")
            .update({
                clientIce: null,
                lawyerIce: null,
            });
    };

    endLawyerCall = () => {
        let self = this;
        const videoTrackLawyer = senders.find(
            (sender) => sender.track.kind === "video"
        );
        videoTrackLawyer.track.stop();
        const audioTrackLawyer = senders.find(
            (sender) => sender.track.kind === "audio"
        );
        audioTrackLawyer.track.stop();
        self.timerRef.pause();
        self.state.recordVideo.stopRecording(function () {
            let blob = self.state.recordVideo.getBlob();
            firebase
                .storage()
                .ref()
                .child(self.state.username + "/" + self.state.startTime + "/lawyer")
                .put(blob)
                .then(function (snapshot) {
                    console.log("recording uploaded, process completed");
                    message.success("Recording uploaded");
                });
        });
        firebase
            .database()
            .ref("/Accounts/" + self.state.username + "/message/callStatus")
            .off();
        firebase
            .database()
            .ref("/Accounts/" + self.state.username + "/message")
            .off();
        firebase
            .database()
            .ref("/Accounts/" + self.state.username + "/ice")
            .off();
        firebase
            .database()
            .ref("/Accounts/" + self.state.username + "/clientName")
            .off();
        self.setState({
            callStatus: false,
        });
        firebase
            .database()
            .ref("/Accounts/" + self.state.username + "/clientName")
            .on("value", (snap) => {
                firebase
                    .database()
                    .ref(
                        `Accounts/${this.state.username}/PastCalls/${this.state.startTime}`
                    )
                    .update({
                        clientName: snap.val(),
                        messages: this.state.allMessages,
                        videoIdNode: this.state.startTime,
                    });
            });

        senders = [];
        this.resetAfterCall();
        this.props.endCallDispatch("lawyer");
    };

    //end client call function
    endClientCall = () => {
        const videoTrackClient = senders.find(
            (sender) => sender.track.kind === "video"
        );
        videoTrackClient.track.stop();
        const audioTrackClient = senders.find(
            (sender) => sender.track.kind === "audio"
        );

        audioTrackClient.track.stop();
        senders = [];
        firebase
            .database()
            .ref("/Accounts/" + this.props.username)
            .update({
                webRTC: {},
            });
        this.props.endCallDispatch("client");
    };

    onSpecialityChange = (value) => {
        this.setState({ lawyerSpeciality: value });
        console.log(value);
    };

    onTierChange = (value) => {
        this.setState({ lawyerTier: value });
        console.log(value);
    };

    stopTimer = () => {
        const duration = this.timerRef.getTime();
        let meetingCost = (duration / 60000) * this.state.lawyerTier;

        firebase
            .database()
            .ref(
                "Accounts/" + this.state.username + "/PastCalls/" + this.state.startTime
            )
            .update({ callDuration: parseInt(duration) })
            .then(() => {
                if (this.state.creator) {
                    if (this.state.lawyerFarm === "self") {
                        console.log(meetingCost);
                        firebase
                            .database()
                            .ref("Accounts/" + this.state.username)
                            .update({
                                balance: firebase.database.ServerValue.increment(meetingCost),
                            });
                    } else {
                        console.log(meetingCost);

                        console.log(this.state.lawyerFirm);
                        firebase
                            .database()
                            .ref("/Firms/" + this.state.lawyerFirm)
                            .update({
                                balance: firebase.database.ServerValue.increment(meetingCost),
                            });
                    }
                } else {
                    firebase
                        .database()
                        .ref("Accounts/" + this.state.username)
                        .update({
                            balance: firebase.database.ServerValue.increment(-meetingCost),
                        });
                }
            });
    };

    findLawyer = () => {
        const self = this;
        this.setState({ isLawyer: false, landingPage: false });
        const docRef = firebase.database().ref("/Accounts/");
        docRef.on("child_added", function (snapshot) {
            const lawyer = snapshot.val();
            if (
                lawyer.currentOnline &&
                !lawyer.message.callRequest &&
                !lawyer.message.callStatus
            ) {
                docRef.off();
                console.log("found a lawyer who is online");
                console.log(snapshot.key);
                self.setState({ callUserValue: snapshot.key }, () => {
                    self.callUser(snapshot.key);
                });
            }
        });
    };

    // onSend(messages = []) {
    //   var data = {};

    //   data.type = "text";
    //   data.message = messages[0].text;
    //   console.log(messages[0].text);
    //   this.state.dataChannel.send(JSON.stringify(data));
    //   this.setState((previousState) => ({
    //     messages: GiftedChat.append(previousState.messages, messages),
    //   }));
    // }

    onSend = async () => {
        var data = {};

        data.type = "text";
        data.message = this.state.text;
        data.id = 1;
        if (this.state.text.length > 0) {
            await this.state.dataChannel.send(JSON.stringify(data));
            if (this.state.creator) {
                await this.setState((prevState) => ({
                    allMessages: {
                        ...prevState.allMessages,
                        [`${Date.now()}_lawyer`]: this.state.text,
                    },
                    messages: [
                        ...prevState.messages,
                        new Message({ id: 0, message: this.state.text }),
                    ],
                }));
            } else {
                await this.setState((prevState) => ({
                    messages: [
                        ...prevState.messages,
                        new Message({ id: 0, message: this.state.text }),
                    ],
                }));
            }
        }
        await this.setState({ text: "" });
    };

    render() {
        const height = window.innerHeight;
        const videoMargin = (window.innerHeight - (window.innerWidth * 3) / 4) / 16;
        let width = window.innerWidth;

        return (
            <div
                style={{
                    backgroundColor: "#212121",
                    zIndex: "inherit",
                }}
            >
                <div
                    style={{
                        position: "fixed",
                        top: 20,
                        right: 20,
                        backgroundColor: "#fff3",
                        padding: 5,
                        borderRadius: 5,
                        zIndex: 2,
                    }}
                >
                    <Timer
                        startImmediately={false}
                        ref={(node) => {
                            this.timerRef = node;
                        }}
                        onPause={this.stopTimer}
                    >
                        <>
                            <Timer.Minutes />:<Timer.Seconds /> mins
            </>
                    </Timer>
                </div>
                <div
                    style={{ position: "absolute", top: 20, left: 20, zIndex: 2 }}
                    className="steps-overlay"
                >
                    <Button
                        onClick={this.showDrawer}
                        icon={<MessageOutlined />}
                        shape="circle"
                    />

                    {this.state.creator ? (
                        <AppointmentModalButton
                            username={this.state.username}
                            callerId={this.state.callerId}
                        />
                    ) : null}
                </div>

                <Spin
                    style={{
                        position: "absolute",
                        marginTop: height / 2,
                        marginLeft: "50%",
                    }}
                    spinning={this.state.spin}
                />

                <div>
                    <div className="inner-container" style={{ height: height }}>
                        <div className="video-on-video-overlay">
                            <video
                                style={{
                                    height: height / 4,
                                    position: "absolute",
                                    bottom: 10,
                                    right: 10,
                                    zIndex: 1,

                                    transform: this.state.screenShare ? null : "scaleX(-1)",
                                }}
                                loop
                                ref={this.yourVideo}
                                autoPlay
                                muted
                                playsInline
                            ></video>
                        </div>
                        <div className="textCall-overlay" danger="true"></div>
                        <div className="video-overlay">
                            <IconButton
                                disabled={this.state.screenShare ? true : false}
                                aria-label="Mute Video"
                                onClick={this.stopVideo}
                                style={{
                                    backgroundColor: this.state.screenShare
                                        ? "#79a3b1"
                                        : !this.state.videoOn
                                            ? "#ff5e78"
                                            : null,
                                }}
                            >
                                {this.state.videoOn ? (
                                    <VideocamRounded style={{ fontSize: 35, color: "#fff" }} />
                                ) : (
                                        <VideocamOffRounded style={{ fontSize: 35, color: "#fff" }} />
                                    )}
                            </IconButton>

                            <IconButton
                                onClick={this.endCall}
                                style={{ backgroundColor: "#ff5e78" }}
                            >
                                <CallEndRounded style={{ fontSize: 35, color: "#fff" }} />
                            </IconButton>

                            <IconButton
                                aria-label="Mute Audio"
                                onClick={this.stopAudio}
                                style={{
                                    backgroundColor: !this.state.audioOn ? "#ff5e78" : null,
                                }}
                            >
                                {this.state.audioOn ? (
                                    <MicRounded style={{ fontSize: 35, color: "#fff" }} />
                                ) : (
                                        <MicOffRounded style={{ fontSize: 35, color: "#fff" }} />
                                    )}
                            </IconButton>

                            <IconButton
                                aria-label="Mute Screen"
                                onClick={this.shareScreen}
                                style={{
                                    backgroundColor: !this.state.screenShare ? "#ff5e78" : null,
                                }}
                            >
                                {this.state.screenShare ? (
                                    <ScreenShareRounded style={{ fontSize: 35, color: "#fff" }} />
                                ) : (
                                        <StopScreenShareRounded
                                            style={{ fontSize: 35, color: "#fff" }}
                                        />
                                    )}
                            </IconButton>

                            <Drawer
                                title={`Live Chat ${this.state.creator
                                    ? this.state.displayName
                                    : this.state.displayName
                                    }`}
                                placement="left"
                                closable={true}
                                width={width * 0.33}
                                onClose={this.onDrawerClose}
                                visible={this.state.drawerVisible}
                                footer={
                                    <div
                                        style={{
                                            textAlign: "centre",
                                            display: "flex",
                                            justifyContent: "space-evenly",
                                        }}
                                    >
                                        {/* <input
                      id="inputFile"
                      className="inputFile"
                      type="file"
                      onChange={(e) => {
                        this.fileSelect(e);
                        console.log(e);
                      }}
                      size="60"
                      style={{
                        display: "block",
                        float: "left",
                        padding: "22px 15px 0 15px",
                      }}
                    ></input> */}
                                        <input
                                            style={{ display: "none" }}
                                            id="contained-button-file"
                                            className="inputFile"
                                            type="file"
                                            onChange={(e) => {
                                                this.fileSelect(e);
                                            }}
                                        />
                                        <label htmlFor="contained-button-file">
                                            <MButton
                                                variant="contained"
                                                color="primary"
                                                component="span"
                                            >
                                                Upload File
                      </MButton>
                                        </label>
                                        {/* <Button
                      className="Save-button"
                      size="small"
                      onClick={this.saveToDisk}
                      variant="contained"
                      color="default"
                      style={{
                        marginLeft: "15px",
                        padding: "5px",
                        borderRadius: "10px",
                      }}
                    >
                      Save
                    </Button> */}
                                        <h5
                                            style={{ display: this.state.fileRec ? "flex" : "none" }}
                                        >
                                            {this.state.fileRecName}
                                        </h5>
                                        <div
                                            style={{
                                                display: this.state.fileRec ? "flex" : "none",
                                                justifyContent: "space-around",
                                                width: width * 0.15,
                                                alignItems: "center",
                                            }}
                                        >
                                            <MButton
                                                onClick={this.saveToDisk}
                                                variant="contained"
                                                color="secondary"
                                                component="span"
                                            >
                                                Save File
                      </MButton>
                                            {/* <Button
                      aria-label="delete"
                      onClick={this.deleteReceivedfile}
                    >
                      Delete
                    </Button> */}
                                            <MButton
                                                onClick={this.deleteReceivedfile}
                                                variant="outlined"
                                                color="primary"
                                                component="span"
                                            >
                                                Delete File
                      </MButton>
                                        </div>
                                    </div>
                                }
                            >
                                {/* <GiftedChat
                  messages={this.state.messages}
                  onSend={(messages) => this.onSend(messages)}
                  user={{
                    id: this.state.username,
                  }}
                /> */}

                                <ChatFeed
                                    messages={this.state.messages} // Array: list of message objects
                                    bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
                                    bubbleStyles={{
                                        text: {
                                            fontSize: 10,
                                        },
                                        chatbubble: {
                                            borderRadius: 70,
                                            padding: 8,
                                        },
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 70,
                                        left: 0,
                                        display: "flex",
                                        flexDirection: "row",
                                    }}
                                >
                                    <input
                                        value={this.state.text}
                                        placeholder="Enter text here"
                                        style={{ width: width * 0.3, border: "none", padding: 5 }}
                                        onChange={(e) => {
                                            this.changeTextMessage(e);
                                        }}
                                        onKeyPress={(event) => {
                                            if (event.key === "Enter") {
                                                this.onSend();
                                            }
                                        }}
                                    />
                                    <IconButton
                                        onClick={this.onSend}
                                        style={{ backgroundColor: "#fff" }}
                                    >
                                        <Send style={{ fontSize: 20, color: "#11698e" }} />
                                    </IconButton>
                                </div>
                            </Drawer>
                        </div>

                        <video
                            className="video-friend"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100vh",
                                background: "black",
                                objectFit: "cover",
                                display: this.state.otherVideo ? "block" : "none",
                            }}
                            ref={this.friendsVideo}
                            autoPlay
                            playsInline
                        ></video>
                    </div>
                </div>
                {!this.state.otherVideo ? (
                    <RenderCenteredUserProfilePic
                        src={this.state.callerProfilePic || this.state.profilePic}
                    />
                ) : null}
            </div>
        );
    }
}

export default VideoCall;

const styles = StyleSheet.create({
    logo: {
        height: 80,
    },
    button: {
        textAlign: "center",
    },
    header: {
        padding: 20,
    },
    image: {
        marginHorizontal: "auto",
        marginVertical: 20,
        textAlign: "center",
        maxWidth: "100%",
        cursor: "pointer",
    },
    title: {
        fontWeight: "bold",
        fontSize: "1.5rem",
        marginVertical: "1em",
        textAlign: "center",
    },
    text: {
        lineHeight: "1.5em",
        fontSize: "1.125rem",
        marginVertical: "1em",
        textAlign: "center",
    },
    link: {
        color: "#1B95E0",
    },
    code: {
        fontFamily: "monospace, monospace",
    },
});