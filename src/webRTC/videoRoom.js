import React, { Component, useState, useEffect } from "react";
import { Dimensions, Image, StyleSheet, Text, View, TextInput, TouchableHighlight, Alert } from "react-native";
import * as firebase from 'firebase';
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";
import RecordRTC from 'recordrtc';
import CustomInput from "../../General/CustomInput";
const { width, height } = Dimensions.get("window");


var pc = null;

//webrtc
var servers = { 'iceServers': [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' }, { 'urls': 'turn:numb.viagenie.ca', 'credential': 'PrivatePassword', 'username': 'anothermohit@gmail.com' }] };
const yourId = Math.floor(Math.random() * 1000000000);
const senders = [];

class VideoRoom extends Component {
    constructor(props) {
        super(props);

        this.yourVideo = React.createRef();
        this.friendsVideo = React.createRef();
        this.textRTC = React.createRef();
        console.log('constructor')


        this.state = {
            isLawyer: false,
            myVideo: true,
            callFriend: false,
            callUserValue: '',
            callUser: '',
            callRequest: false,
            callStatus: false,
            recordVideo: null,
            completion: false,
            username: this.props.username,
            docRef2: null,
            closeCircle: false,
            callRequest: "",
            creatorMessage: {},
        };
    }
    async componentDidMount() {
        const self = this

        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                console.log(stream)
                console.log('step 1/2')
                self.setState({ videoStream: stream, username: self.props.username })
                self.yourVideo.current.srcObject = stream
            }).then(() => {
                if (!self.props.creator) {
                    self.findCreator()
                }
                else {
                    self.setCreator()
                }
            })
        console.log(this.friendsVideo, this.yourVideo);

        firebase.database().ref(`/Users/${self.props.username}/webRTC/message/callRequest`).on("value", async function (snapshot) {
            console.log(snapshot.val());
            if (snapshot.val()) {
                if (snapshot.val() === 'none' && self.props.creator) {
                    self.state.recordVideo.stopRecording(function () {
                        let blob = self.state.recordVideo.getBlob();
                        firebase.storage().ref().child(`/liveSession/${self.props.username}/${self.props.username}`).put(blob).then(function (snapshot) {
                            console.log('recording uploaded');
                            self.setCreator()
                        })
                    })


                } else if (!self.props.creator && snapshot.val().callRequest === 'none') {
                    self.closeStream()
                }
            } else {
                return null
            }
        })
    }
    handleChatMessage = (event, arrayToStoreChunks) => {

        console.log(event)
        var data = JSON.parse(event.data);
        console.log(data)
        this.setState({ creatorMessage: data })
    };
    // To send messages on chat
    sendInputMessage = () => {
        var data = {};
        data.type = "text";
        data.message = this.state.broadcastMessage;
        this.state.dataChannel.send(JSON.stringify(data));
    };

    videoCall = () => {
        const self = this
        console.log('video call function called')
        pc = new RTCPeerConnection(servers);
        self.setState({ pc: pc })
        let dataChannel = pc.createDataChannel("MyApp Channel");
        this.setState({ dataChannel });
        dataChannel.addEventListener("open", (event) => {
            //dataChannel.send('hello');
            self.sendInputMessage()
            console.log("Data Channel is open now!");
            //   //beginTransmission(dataChannel);
        });
        pc.ondatachannel = (event) => {
            console.log("Listening data channel");
            var channelRec = event.channel;
            var arrayToStoreChunks = [];
            channelRec.onmessage = function (event) {
                self.handleChatMessage(event, arrayToStoreChunks);
            };
            console.log(channelRec);
        };

        pc.oniceconnectionstatechange = function (event) {
            console.log(pc.iceConnectionState)
            switch (pc.iceConnectionState) {

                case "connected":

                    //switch off listener

                    if (!self.props.creator) {
                        self.setState({ completion: true })
                        console.log('completion true')
                    }
                    if (self.state.docRef2)
                        self.state.docRef2.off()
                    console.log('docRef, docRef2 switched off', self.state.docRef2)

                    // The connection has become fully connected
                    break;
                case "disconnected":
                case "failed":
                    // One or more transports has terminated unexpectedly or in an error
                    break;
                case "closed":
                    // The connection has been closed
                    break;
            }
        }


        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (!this.props.creator) {
                    console.log('send ice candidate to lawyer by client, step 10.');
                    this.sendMessageToCallICE(yourId, JSON.stringify({ 'ice': event.candidate }));


                }
                else {
                    console.log('send ice candidate to client by lawyer, step 17.');
                    this.sendMessageICE(yourId, JSON.stringify({ 'ice': event.candidate }))
                }

            }
            else {
                console.log("Sent All Ice")
                console.log(pc)
            }
        }


        pc.onaddstream = (event) => {
            this.setState({
                myVideo: false
            }, () => {
                self.friendsVideo.current.srcObject = event.stream
                self.setState({ creatorStream: event.stream })
            });

            console.log("Adding other person's video to my screen. step 19/20.");
            console.log(event.stream);
        };



        if (!this.props.creator) {

            firebase.database().ref('/Users/' + this.props.username + '/webRTC/message').update({ callRequest: 'visitor' });
            const stream = this.state.videoStream;
            const tracks = stream.getTracks();

            tracks.forEach((track) => {
                senders.push(pc.addTrack(track, stream));
            });


            pc.createOffer()
                .then((offer) => {
                    console.log('offer created')
                    pc.setLocalDescription(offer).then(() => {
                        self.sendMessageToCall(yourId, JSON.stringify({ 'sdp': pc.localDescription }))
                    });
                })

            const docRef = firebase.database().ref('/Users/' + this.props.username + '/webRTC/message')
            docRef.on('value', (snapshot2) => {
                if (snapshot2.val().message) {
                    if (JSON.parse(snapshot2.val().message)) {
                        const msg = JSON.parse(snapshot2.val().message);
                        const sender = snapshot2.val().sender;
                        if (sender != yourId) {
                            if (msg.sdp.type === "answer") {

                                pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(() => {
                                    docRef.off()
                                    const docRef2 = firebase.database().ref('/Users/' + this.props.username + '/webRTC/ice/lawyerIce')
                                    self.setState({
                                        docRef2
                                    }, () => {
                                        console.log('docRef2')
                                        docRef2.on('child_added', (snapshot) => {
                                            if (JSON.parse(snapshot.val())) {
                                                const ice = JSON.parse(snapshot.val());
                                                pc.addIceCandidate(new RTCIceCandidate(ice.ice)).then(_ => {
                                                    console.log("Added ice candidate to clien's peerconnection which was sent by lawyer, step 18")
                                                }).catch(e => {
                                                    console.log("Error: Failure during addIceCandidate()");
                                                });
                                            }
                                        });
                                    })


                                }).catch(e => {
                                    console.log("Error: Failure while adding answer to remote description");
                                });
                            }

                        }
                    }
                }
            });

        }
        else {

            console.log('lawyer in videocall function')
            const stream = this.state.videoStream;
            const tracks = stream.getTracks();

            tracks.forEach((track) => {
                console.log(track);
                senders.push(pc.addTrack(track, stream));
            });
            const docRef = firebase.database().ref('/Users/' + this.props.username + '/webRTC/message')

            docRef.on('value', (snapshot) => {
                if (snapshot.val().message && (pc.connectionState != 'closed')) {
                    var msg = JSON.parse(snapshot.val().message);
                    const sender = snapshot.val().sender;
                    if (sender != yourId) {
                        if (msg.sdp.type === "offer") {
                            console.log('offer sent by client is recieved by lawyer, step 8.')

                            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(() => {
                                docRef.off()
                                const docRef2 = firebase.database().ref('/Users/' + self.props.username + '/webRTC/ice/clientIce')
                                self.setState({ docRef2 })
                                docRef2.on('child_added', (snapshot) => {
                                    if (JSON.parse(snapshot.val())) {
                                        const ice = JSON.parse(snapshot.val());
                                        pc.addIceCandidate(ice.ice).then(() => {
                                            console.log('ice candidates added at lawyer"s pc')
                                        }).catch(e => {
                                            console.log("Error: Failure during addIceCandidate()", e);
                                            console.log(ice.ice)
                                        });
                                    }
                                });

                                pc.createAnswer().then((answer) => {
                                    console.log('answer created',)
                                    pc.setLocalDescription(answer).then(() => {

                                    }).then(() => {
                                        self.sendMessage(yourId, JSON.stringify({ 'sdp': pc.localDescription }))

                                        console.log('answer sent to client')

                                    });;

                                })
                            })

                        }

                    }
                }
            })
        }
    }

    closeStream = () => {
        const self = this
        self.state.recordVideo.stopRecording(function () {
            let blob = self.state.recordVideo.getBlob();
            firebase.storage().ref().child(`/liveSession/${self.props.username}/${self.props.username}`).put(blob).then(function (snapshot) {
                console.log('recording uploaded');
                self.state.pc.close()
                self.state.videoStream.getTracks()[0].stop()
                self.state.videoStream.getTracks()[1].stop()
            })
        })

    }

    //webrtc
    sendMessageToCall(senderId, data) {
        var msg = firebase.database().ref('/Users/' + this.props.username + '/webRTC/message').update({ sender: senderId, message: data });
    }

    sendMessageToCallICE(senderId, data) {
        var msg = firebase.database().ref('/Users/' + this.props.username + '/webRTC/ice/clientIce').update({ [Date.now()]: data });
    }

    sendMessage(senderId, data) {
        var msg = firebase.database().ref('/Users/' + this.props.username + '/webRTC/message').update({ sender: senderId, message: data });
    }
    sendMessageICE(senderId, data) {
        var msg = firebase.database().ref('/Users/' + this.props.username + '/webRTC/ice/lawyerIce').update({ [Date.now()]: data });
    }


    handleTextChange = (event) => {
        this.setState({ broadcastMessage: event.target.value })
    }

    setCreator = () => {
        const self = this
        this.setState({ isLawyer: true })
        console.log('setlawyer fuction called')
        firebase.database().ref('/Users/' + this.state.username + '/webRTC').update({ currentOnline: true })
        firebase.database().ref('/Users/' + this.state.username + '/webRTC' + '/message').update({ startTime: null, callRequest: null, callStatus: false, message: null, sender: this.state.username, });
        firebase.database().ref('/Users/' + this.state.username + '/webRTC' + '/ice').update({ clientIce: null, lawyerIce: null });
        const docRef = firebase.database().ref('/Users/' + this.state.username + '/webRTC')
        docRef.on('value', async (snapshot) => {
            if (snapshot.val().message.callRequest) {
                self.setState({ callRequest: snapshot.val().message.callRequest })
                await self.videoCall()
                const recordVideo = await RecordRTC(self.state.videoStream, {
                    mimeType: 'video/webm\;codecs=vp8',
                    canvas: {
                        width: 1920,
                        height: 1080,
                        minFrameRate: 3,
                        maxFrameRate: 32
                    }
                });
                const rec = recordVideo.startRecording();
                console.log(rec);
                self.setState({ recordVideo: recordVideo });
                docRef.off()
            }
        })

    }



    findCreator = () => {
        const self = this
        console.log('find creator called')
        this.setState({ isLawyer: false })
        this.videoCall(this.props.username)

        const recordVideo = RecordRTC(self.state.videoStream, {
            mimeType: 'video/webm\;codecs=vp8',
            canvas: {
                width: 1920,
                height: 1080,
                minFrameRate: 3,
                maxFrameRate: 32
            }
        });
        const rec = recordVideo.startRecording();
        console.log(rec);
        self.setState({ recordVideo: recordVideo });
    }

    closeCircle = () => {
        this.setState({ closeCircle: true });
    };
    fullScreen = () => {
        if (this.props.creator) {
            this.yourVideo.current.requestFullscreen()
            this.yourVideo.current.style.transform = 'rotateY(180deg)'
        }
        else {
            this.friendsVideo.current.requestFullscreen()
        }
    };

    render() {

        return (
            <View style={{
                height: "100%",
                width: "100%",
                minHeight: "100%",
                minWidth: "100%",
                position: "relative",
            }}
            >
                <View>
                    <video style={{
                        transform: "rotateY(180deg)",
                        width: width,
                        height: height / 2,
                        background: "black",

                    }} loop ref={this.yourVideo} autoPlay muted playsInline></video>
                    <video style={{
                        transform: "rotateY(180deg)",
                        width: width,
                        height: height,
                        background: "black",

                    }} loop ref={this.friendsVideo} autoPlay playsInline></video>
                </View>

            </View>
        );


    }
}

export default VideoRoom