
import React, { useEffect, useState, useRef } from "react";

import firebase from "firebase";
import swal from 'sweetalert';
import { Dimensions, View, Text } from "react-native";
import { notification, Button, Input, Tooltip } from 'antd';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';

const height = window.innerHeight
const width = window.innerWidth

var pc = null;
let message = {}
const arr = []

var pc1 = null;
let message1 = {}
const arr1 = []
//webrtc
var servers = { 'iceServers': [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' }, { 'urls': 'turn:numb.viagenie.ca', 'credential': 'PrivatePassword', 'username': 'anothermohit@gmail.com' }] };
const yourId = Math.floor(Math.random() * 1000000000);
const senders = [];

pc = new RTCPeerConnection(servers);
pc1 = new RTCPeerConnection(servers);

let dataChannel

let dataChannel1;
var mssgs = {}
export default function ServerLessTextPage({ spaceName, myName }) {

    const [ofer1, setOfer] = useState(false)

    const [friends, setFriendVideo] = useState(false)
    const [mssg, setMssg] = useState("")
    const [response, setResponse] = useState("")
    const [timeline, setTimeline] = useState(null)
    const [turn, setTurn] = useState("")
    const [showScreen, setShowScreen] = useState(false)
    const [generate, setGenerate] = useState(false)

    const myVideo = useRef()
    const friendsVideo = useRef()
    const textInputRef = useRef();

    const ice = []
    const ice1 = []

    useEffect(() => {
        dataChannel = pc.createDataChannel(myName);
    }, [])

    pc.onicecandidate = (event) => {
        if (event.candidate) {

            ice.push(event.candidate)

            console.log(event.candidate, ice);
            arr.push(JSON.stringify(event.candidate))
        }
        else {
            console.log("Sent All Ice")
            console.log(pc)
            message.ice = JSON.stringify(ice)
            console.log(JSON.stringify(message));
        }

    }

    pc1.onicecandidate = (event) => {
        console.log('called for user2');
        if (event.candidate) {

            ice1.push(event.candidate)

            console.log(event.candidate, ice1);
            arr1.push(JSON.stringify(event.candidate))
        }
        else {
            console.log("Sent All Ice")
            console.log(pc1)
            message1.ice = JSON.stringify(ice1)
            console.log(JSON.stringify(message1));
        }

    }

    pc.onaddstream = function (event) {
        setFriendVideo(true)
        //friendsVideo.current.srcObject = event.stream;
        console.log(event.stream);
    };

    pc1.onaddstream = function (event) {
        //setFriendVideo(true)
        //friendsVideo.current.srcObject = event.stream;
        console.log(event.stream);
    };

    pc1.ondatachannel = (event) => {
        console.log("Listening data channel from pc1");
        var channelRec = event.channel;
        var arrayToStoreChunks = [];
        channelRec.onmessage = function (event) {
            if (JSON.parse(event.data).message) {
                setResponse(JSON.parse(event.data).message)
            }

            console.log(JSON.parse(event.data).sender)
            setTurn(JSON.parse(event.data).sender)
            if (JSON.parse(event.data).sender === myName) {
                console.log('don\'t send');

            } else {
                dataChannel.send(event.data);
                //mssgs[Date.now()] = JSON.parse(event.data).message;
            }


            //self.handleChatMessage(event);
        };
        console.log(channelRec);
    };

    pc.ondatachannel = (event) => {
        console.log("Listening data channel from pc");
        var channelRec = event.channel;
        channelRec.onmessage = function (event) {
            const d = JSON.parse(event.data)

            if (d.message) {
                setResponse(d.message)
            }

            console.log(d.message, d.sender, d, event.data)
            setTurn(JSON.parse(event.data).sender)
            if (JSON.parse(event.data).sender === myName) {
                console.log('don\'t send');

            }
            else {
                console.log('mssg passed');
                dataChannel.send(event.data);
            }
            //setTimeline(mssgs)

        };
        console.log(channelRec);
    };


    useEffect(() => {
        console.log('login component loaded')
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                console.log(stream)
                const tracks = stream.getTracks();

                tracks.forEach((track) => {
                    console.log(track);
                    track.enabled = false

                    senders.push(pc.addTrack(track, stream));
                });

            })
            .then(() => {
                console.log('function called');
            })
    }, []);

    //1st step/ creator generating offer
    const videoCall = () => {
        //setOfer(true)
        console.log('video call function called')

        console.log(pc);
        pc.createOffer()
            .then(offer => {
                console.log(offer)

                pc.setLocalDescription(offer).then(() => {
                    message.offer = JSON.stringify(pc.localDescription)

                    console.log('local des. updated ', pc, "1st step taken by creator.");
                    setOfer(true)
                });
            });

    }

    const passStream = () => {
        dataChannel = pc1.createDataChannel(myName);
        pc1.createOffer()
            .then(offer => {
                //console.log(offer1)

                pc1.setLocalDescription(offer).then(() => {
                    message1.offer = JSON.stringify(pc1.localDescription)

                    console.log('local des. for user2 updated ', pc1);
                    // setOfer(true)
                });
            });
    }

    const join = () => {
        swal({
            text: 'Paste Code.',
            content: "input",
            button: {
                text: "Join",
                closeModal: true,
            },
        })
            .then(value => {
                if (value) {
                    //called when user enter answer/offer
                    submit(value)
                }

            })
    }

    const submit = (value) => {
        var convert = JSON.parse(value)
        var offer = JSON.parse(convert.offer)
        var ice = JSON.parse(convert.ice)

        console.log(convert, ice, offer);
        console.log(pc.signalingState);


        if (offer.type === "answer") {
            //3rd step taken by - who created offer //answer added by offer creator.
            console.log(pc, "if condition ", offer);
            pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {

                console.log('answer added');
                for (let i = 0; i < ice.length; i++) {
                    const element = ice[i];
                    console.log(element);
                    pc.addIceCandidate(new RTCIceCandidate(element)).then(_ => {
                        console.log("Added ice candidate to clien's peerconnection, // answer added")
                    }).catch(e => {
                        console.log("Error: Failure during addIceCandidate() ", e);
                    });
                }
            }).catch(e => {
                console.log("Error: Failure during set remote desc ", e);
            });
        } else {
            //2nd step taken by receiver who enter offer & generate answer
            console.log('else part ', offer);
            pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
                console.log('offer added');
                for (let i = 0; i < ice.length; i++) {
                    const element = ice[i];
                    console.log(element);
                    pc.addIceCandidate(new RTCIceCandidate(element)).then(_ => {
                        console.log("Added ice candidate to clien's peerconnection, offer added")
                    }).catch(e => {
                        console.log("Error: Failure during addIceCandidate() ", e);
                    });
                }
                pc.createAnswer()
                    .then(answer => {
                        console.log('answer ', answer);
                        setGenerate(true)
                        //passVideo()

                        pc.setLocalDescription(answer)
                            .then(() => {
                                message.offer = JSON.stringify(pc.localDescription)
                            })
                    }).then(() => {
                        console.log(pc, 'else condition ', "answer generated by offer enter user.");
                    })
            })
        }

    }

    const joinSecondUser = () => {
        swal({
            text: 'Paste Code.',
            content: "input",
            Button: {
                text: "Join",
                closeModal: true,
            },
        })
            .then(value => {
                if (value) {
                    answerFromnNext(value)
                }

            })
    }

    const closeCircle = () => {
        swal({
            text: 'Paste Code.',
            content: "input",
            Button: {
                text: "Join",
                closeModal: true,
            },
        })
            .then(value => {
                if (value) {

                    var convert = JSON.parse(value)
                    var offer = JSON.parse(convert.offer)
                    var ice = JSON.parse(convert.ice)

                    pc1.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
                        console.log('offer added');
                        for (let i = 0; i < ice.length; i++) {
                            const element = ice[i];
                            console.log(element);

                            pc1.addIceCandidate(new RTCIceCandidate(element)).then(_ => {
                                console.log("Added ice candidate to clien's peerconnection which was sent by lawyer, step 18")
                            }).catch(e => {
                                console.log("Error: Failure during addIceCandidate() ", e);
                            });

                        }

                        pc1.createAnswer()
                            .then(answer => {
                                console.log('answer ', answer);

                                pc1.setLocalDescription(answer)
                                    .then(() => {
                                        message1.offer = JSON.stringify(pc1.localDescription)

                                    })
                            }).then(() => {
                                console.log(pc, 'else condition');

                            })
                    })
                }
            })

    }

    const answerFromnNext = (value) => {
        var convert = JSON.parse(value)
        var offer = JSON.parse(convert.offer)
        var ice = JSON.parse(convert.ice)

        pc1.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
            setFriendVideo(true)
            console.log('answer added');
            for (let i = 0; i < ice.length; i++) {
                const element = ice[i];
                console.log(element);

                pc1.addIceCandidate(new RTCIceCandidate(element)).then(_ => {

                    console.log("Added ice candidate to clien's peerconnection which was sent by lawyer, step 18")
                }).catch(e => {
                    console.log("Error: Failure during addIceCandidate() ", e);
                });

            }
        }).catch(e => {
            console.log("Error: Failure during set remote desc ", e);
        });
    }

    const sendInputMessage = () => {
        var data = {};
        data.type = "text";
        data.message = mssg;
        data.sender = myName
        mssgs[Date.now()] = mssg;

        dataChannel.send(JSON.stringify(data));
        setMssg("")
        console.log(JSON.stringify(mssgs));
    };

    const handleInput = (e) => {
        setMssg(e.target.value)
        var space = e.target.value.charAt(e.target.value.length - 1)

        // console.log(e.target.value, space);
        if (space == " ") {
            sendInputMessage()

            console.log('spacebar detected');
        }
    }

    //taking turn on KEY ENTER
    useEffect(() => {

        const listener = (event) => {
            var data = {};

            data.sender = myName
            if (event.code === "Enter") {
                dataChannel.send(JSON.stringify(data));

            }
        };

        // register listener
        document.addEventListener("keydown", listener);

        // clean up function, un register listener on component unmount
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [myName, turn])

    const autoFocus = () => {
        textInputRef.current.focus()

    }

    return (
        <>
            {!showScreen ?
                <View>
                    <View
                        style={{
                            shadowOpacity: 4,
                            width: width,
                            overflow: 'hidden',
                            height: height * 0.91,
                            marginTop: '18px',
                            zIndex: 99999,

                        }}
                        onClick={turn === myName ? autoFocus : null}
                    >
                        <View>
                            <Text style={{ textAlign: 'center', fontFamily: 'cursive' }}><b>{spaceName}: </b>{turn}</Text>

                            <View style={{ height: 1, background: 'black', marginTop: 28, position: 'absolute', width: width }}></View>
                            <Text
                                style={{
                                    marginLeft: '10px',
                                    margin: 20,
                                    fontSize: 15.5,
                                    paddingRight: '18px',
                                    overscrollBehaviorY: "contain",
                                    scrollSnapType: "y proximity",
                                    scrollSnapAlign: "end",
                                }}
                            >

                                <View style={{ display: 'flex', flexFlow: 'row' }}>

                                    {response !== "" ?
                                        <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: width < 600 ? (width / response.length + response.length) : (response.length === 2 ? height / 1.8 : (response.length) + height / (response.length / 2)), textAlign: 'center', width: width, marginTop: width <= 600 ? height / 4 : height / 10 }}>{response}</Text>
                                        : null}
                                </View>

                            </Text>

                        </View>
                        <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'flex-end', marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 1.3, position: 'absolute', marginLeft: width - 45 }}>

                            <>
                                <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={() => setShowScreen(true)}>
                                    <KeyboardArrowRightIcon style={{ margin: 'auto' }} />
                                </View>
                                <br />
                            </>

                        </View>

                    </View>
                    {turn === myName ?

                        <View style={{ marginTop: height - 40, position: 'absolute', }}>
                            <Input onChange={handleInput} placeholder="Type message.." value={mssg} type="text" id="standard-multiline-flexible" style={{ width: width, height: width < 600 ? 40 : 37 }} ref={textInputRef} />

                        </View>
                        : null}

                </View>
                :
                <View
                    style={{
                        height: height,
                        width: width,
                        position: "relative",
                        overflow: 'hidden'
                    }}
                >
                    <View>
                        <View
                            style={{
                                position: "absolute",
                                background: "transparent",
                                zIndex: 1000,
                                width: width,

                            }}
                        >
                            <Button onClick={videoCall} style={{ width: width * 0.1, marginTop: height * 0.1, height: '10%', marginRight: width * 0.85 }}>Generate</Button>

                            <Button onClick={join} style={{ width: width * 0.1, marginTop: 25, height: '10%', marginRight: width * 0.85 }}>Join</Button>

                            <Button onClick={joinSecondUser} style={{ width: width * 0.1, marginTop: 25, height: '10%', marginRight: width * 0.85 }}>Join 2nd User</Button>

                            {generate ?
                                <Button onClick={passStream} style={{ width: width * 0.1, marginTop: 25, height: '10%', marginRight: width * 0.85 }}>Call 2nd User</Button>
                                : null}

                            <Button onClick={closeCircle} style={{ width: width * 0.1, marginTop: 25, height: '10%', marginRight: width * 0.85 }}>close circle</Button>

                        </View>

                    </View>
                    <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'flex-end', marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 1.3, position: 'absolute', marginLeft: width - 45 }}>
                        <>
                            <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={() => setShowScreen(false)}>
                                <KeyboardArrowLeftIcon style={{ margin: 'auto' }} />
                            </View>
                            <br />
                        </>
                    </View>

                </View>
            }
        </>
    )
}