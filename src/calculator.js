const [amount1, setAmount] = useState(0)
const [amount2, setAmount2] = useState(0)
const [totalAmount, setTotal] = useState(0)
const [operator, setOperator] = useState(undefined)
let operators = ["+", "-", "/", "*", "%", "C", "="]


const addFunction = (operateVal) => {
    //let result;
    setOperator(operateVal)
    // if (operateVal === "+") {
    //     result = parseInt(amount1) + parseInt(amount2)
    // } else if (operateVal === "-") {
    //     result = parseInt(amount1) - parseInt(amount2)
    // } else if (operateVal === "*") {
    //     result = parseInt(amount1) * parseInt(amount2)
    // } else if (operateVal === "C") {
    //     setTotal(0)
    //     setAmount2(0)
    //     setAmount(0)
    // } else {
    //     result = parseInt(amount1) / parseInt(amount2)
    // }

    const val = `${parseInt(amount1)} ${operateVal} ${parseInt(amount2)}`

    setTotal(val)
    console.log(eval(val));
    // setAdditionValue(add)
}

<View>
    <TextField
        variant="outlined"
        name="amount1"
        placeholder="Enter amount1"
        size="small"
        value={amount1}
        onChange={(e) => setAmount(e.target.value)}
    //onClick={visitCreator}
    />
    <TextField
        variant="outlined"
        placeholder="Enter amount2"
        name="amount2"
        size="small"
        value={amount2}
        onChange={(e) => setAmount2(e.target.value)}
    //onClick={visitCreator}
    />
    <h3>{amount1} {operator} {amount2} = {totalAmount}</h3>
    <View style={{ width: 400, display: 'flex', flexFlow: 'row', justifyContent: 'space-between', }}>
        {operators.map((operator, index) => {
            return (

                <button style={{ width: 40 }} key={index} onClick={() => addFunction(operator)}>{operator}</button>


            )
        })}
    </View>
</View>



// messaging.onMessage((payload) => {
//   //setShowReplay(true)
//   const obj = JSON.parse(payload.data.status)
//   owner = obj.name
//   const update = obj.data
//   setNewMessage(true)
//   setReplayText(update)

//   setOwner(obj.name)

//   console.log("on message works!", payload.data);
// });

const fireFunc = async (topCreator, token) => {
    //console.log(topCreator, token);
    //await 
    database.collection("Users").doc(topCreator).collection("pages").limit(1).get().then((querySnapshot) => {
        if (querySnapshot.docs.length === 0) {
            alert("stay here! creations loaded soon.")
        } else {
            database.collection("actions").doc(user_data.active_space).set({
                subscription: topCreator,
                fcmtoken: token,
                time: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log(querySnapshot.docs[0].data());
                const conversion = JSON.parse(querySnapshot.docs[0].data().message)
                setCreationId(querySnapshot.docs[0].id)
                setCreationData(conversion.data)
                owner = conversion.name
            })

        }

    })
}


const replayMessage = (data) => {
    const keyArr = Object.keys(data)
    const valArr = Object.values(data)

    let increment = 0
    setNewMessage(false)
    setReplayFinish(false)
    let counter = 16
    var myFunction = async function () {
        //console.log(counter, valArr[increment]);
        await values.push(valArr[increment])

        increment = await increment + 1
        setCount(prev => prev + 1)
        counter = parseInt(keyArr[increment]) - parseInt(keyArr[increment - 1])
        console.log(values, newMesage);
        const time = setTimeout(myFunction, counter);
        setTimer(time)

        if (keyArr[increment] === undefined || keyArr[increment] === null) {
            clearTimeout(time)
            console.log("user: ", username, "owner: ", owner);
            if (replayFinish === true) {
                setReplayText(null)
            }
            setReplayFinish(true)

        }

    }
    setTimeout(myFunction, counter)
}


useEffect(() => {
    if (creationData !== null) {
        replayMessage(creationData)
    }

}, [creationData])

useEffect(() => {
    if (replayText !== null && replayFinish) {
        if (username === owner) {
            console.log(replayText);
            replayMessage(replayText)
        }

    }
}, [replayFinish, replayText])

// let snap = localStorage.getItem("docId")
// if (snap === null) {

// } else {

//   database.collection("actions").doc(snap).update({
//     subscription: "none",
//     fcmtoken: user_data.token,
//   }).then(() => {
//     subscription()
//   })
// }

//   .then(() => {
//   localStorage.setItem("docId", id);
//   alert('Successfully subscribed! Now you are able to receive live mesaages from creator.')
// })

//replay()
//setShowReplay(true)


const openMessage = async () => {
    //stop = true
    await clearTimeout(timer)
    replayMessage(replayText)
}

// useEffect(() => {
//   console.log(isprivate);
//   setState({
//     value: ""
//   })
//   // db.ref(`/Spaces/${props.spaceId}/`).update({
//   //   available: isprivate === true ? "public" : "private"
//   // })
// }, [isprivate])

{
    !user_data.is_creator && newMesage ?
        <Snackbar
            open={newMesage ? true : false}
            autoHideDuration={10000}
            message={`new message from ${messgOwner}!`}
            action={
                <Button color="inherit" size="small" onClick={openMessage}>
                    open
            </Button>
            }

        //className={classes.snackbar}
        />

        : null
}

<>
    {showReplay && !user_data.is_creator ?
        <View style={{ height: 490, display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}>
            {values.length > 0 && count >= 0 ?
                <View>
                    <View>
                        {visitPast ?
                            <p style={{ fontSize: values[values.length - (wordIndex + 1)].length === 1 ? "70vw" : (75 / (values[values.length - (wordIndex + 1)].length) + 10) + "vw", textAlign: 'center' }}>
                                {values[values.length - (wordIndex + 1)]}
                            </p>
                            :
                            <p style={{ fontSize: values[count].length === 1 ? "70vw" : (75 / (values[count].length) + 10) + "vw", textAlign: 'center' }}>
                                {values[count]}
                            </p>
                        }
                    </View>
                    {replayFinish ?
                        <Snackbar
                            open={replayFinish ? true : false}
                            autoHideDuration={3000}
                            message="message ended!"

                        //className={classes.snackbar}
                        />

                        : null}
                </View>

                : null}
        </View>
        : null}

</>

const joinAuctionForm = () => {
    swal({
        text: 'Enter Biding Amount',
        content: "input",
        button: {
            text: "Add",
            closeModal: true,
        },
    }).then((value) => {
        if (parseInt(value) < auctionData[0].minPrice + auctionData[0].startPrice) {
            swal({
                text: `Bid value must be higher than current value by INR ${auctionData[0].minPrice}`,
                icon: "info",
                button: {
                    text: "OK",
                    closeModal: true,
                },
            })
        } else {
            db.ref(`/auctions/0/participants/${name}`).update({
                bidingAmount: parseInt(value)
            })
            db.ref(`/auctions/0`).update({
                startPrice: firebase.database.ServerValue.increment(parseInt(value))
            })
        }
    })
}

const joiAuction = () => {
    swal({
        text: 'Donate INR 1000 to eligible for donation.',
        icon: 'info',
        button: {
            text: "Donate",
            closeModal: true,
        },
    }).then(() => {
        db.ref(`/auctions/0/participants/${name}/donation`).on("value", function (snap) {
            if (snap.val()) {
                joinAuctionForm()
            } else {
                auctionCheckout(1000)
            }
        })

    })
}

useEffect(() => {
    db.ref("/auctions/").limitToFirst(1).on("value", function (snap) {
        db.ref("/auctions/0/participants/").orderByChild("bidingAmount").limitToLast(1).on("child_added", function (child) {
            if (child.val()) {
                console.log(child.val(), child.key);
                high.name = child.key
                high.amount = child.val().bidingAmount
            } else {
                return null;
            }

        })
        console.log(snap.val());
        setAuctionData(snap.val())
    })
}, [])



useEffect(() => {
    const date = new Date()
    let hours;
    if (auctionData !== null) {
        let days = auctionData[0].duration
        let seconds = days * 24 * 60 * 60 - date.getSeconds()
        const timer = setInterval(() => {
            seconds = seconds - 1
            //hours
            hours = Math.floor(seconds / 60 / 60)
            if (hours === 0) {
                db.ref(`/auctions/0/`).update({
                    status: 'closed'
                })
                clearInterval(timer)
            }
            //console.log(hours);
        }, 1000);

    }
}, [auctionData])
