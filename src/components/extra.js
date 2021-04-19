//sending letter by letter to rtdb.
const handleInput = async (event) => {
    const current = event.nativeEvent.key;

    let docRef;

    docRef = firebase.database().ref(`/Spaces/${spaceId}/data`);

    if (current === "Enter") {
        textInputRef.current.focus();
    }

    //while deleting the letters, speaker name shouldn't be deleted
    if (current === "ArrowRight" || current === "ArrowLeft" || current === "ArrowUp" || current === "ArrowDown" || current === "Escape") {
        return null;
    } else if (current === " ") {

        let wrd = word + " "
        // setSingle(wrd)

        docRef.update({ word: wrd }).then(() => {
            textInputRef.current.focus();
        })

        setWord("")
    } else if (current === "Backspace") {
        setWord(word.slice(0, -1))
    } else {
        setWord(word + current)

    }
};