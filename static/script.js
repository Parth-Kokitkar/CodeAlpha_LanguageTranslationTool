let currentAudio = null;
let typingTimer;
let isSpeaking = false;
let audioContext = null;
let analyser = null;
let silenceTimer = null;
let animationId = null;
let noiseFloor = 0;
let speechThreshold = 0;
let calibrationSamples = [];
let calibrationComplete = false;
let speechDetected = false;

let isRecording = false;

let isUserSpeaking = false;
let silenceStartTime = null;

function resetVoiceEngine() {

    speechDetected = false;

    isUserSpeaking = false;

    silenceStartTime = null;

    audioChunks = [];

    isRecording = false;
     
    mediaRecorder = null;

    analyser = null;

    if (animationId) {

        cancelAnimationFrame(animationId);

        animationId = null;

    }

}
function setWorkingStatus(text) {

    statusDot.style.display = "none";

    statusText.innerHTML =
        `${text}<span class="processing-dot"></span>`;

}

function setOnlineStatus() {

    statusDot.style.display = "inline-block";

    statusText.textContent = "ONLINE";

}
 
const SILENCE_DELAY = 2000;

const inputText =
    document.getElementById("inputText");

const translatedText =
    document.getElementById("translated_text");

const charCount =
    document.getElementById("charCount");

const wordCount =
    document.getElementById("wordCount");

const statusText =
    document.getElementById("statusText");

const statusDot =
    document.querySelector(".status-dot");

 

inputText.addEventListener("input", () => {

    updateCounters();

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {

        autoTranslate();

    }, 1000);

});


document
.getElementById("source_lang")
.addEventListener("change", () => {

  if (currentAudio) {

    currentAudio.pause();

    currentAudio.currentTime = 0;

    currentAudio = null;

    isSpeaking = false;

    document.getElementById(
    "speakBtn"
    ).innerHTML = "🔊";

    statusText.textContent =
    "ONLINE";
}

autoTranslate();

});

document
.getElementById("target_lang")
.addEventListener("change", () => {

 if (currentAudio) {

   currentAudio.pause();

   currentAudio.currentTime = 0;

   currentAudio = null;

   isSpeaking = false;

   document.getElementById(
       "speakBtn"
   ).innerHTML = "🔊";

   statusText.textContent =
       "ONLINE";
}

autoTranslate();

});


function updateCounters(){

    const text =
        inputText.value;

    charCount.textContent =
        text.length;

    const words =
        text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    wordCount.textContent =
        words;
}


async function autoTranslate(){

    const text =
        inputText.value.trim();

    if(text === ""){

        translatedText.innerHTML =
            "Translation will appear here...";

        return;
    }

    const sourceLang =
        document.getElementById(
            "source_lang"
        ).value;

    const targetLang =
        document.getElementById(
            "target_lang"
        ).value;

    setWorkingStatus("Translating");
    try{

        const response =
            await fetch("/translate",{

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    text:text,

                    source_lang:sourceLang,

                    target_lang:targetLang

                })

            });

        const data =
            await response.json();

        if(data.success){

            translatedText.innerHTML =
                data.translated_text;

            setOnlineStatus();
        }
        else{

            translatedText.innerHTML =
                "Translation Error";

            statusText.textContent =
                "ERROR";
        }

    }
    catch(error){

        translatedText.innerHTML =
            "Server Error";

        statusText.textContent =
            "OFFLINE";
    }
}


function swapLanguages(){

    if (currentAudio) {

       currentAudio.pause();

      currentAudio.currentTime = 0;

      currentAudio = null;

      isSpeaking = false;

      document.getElementById(
         "speakBtn"
      ).innerHTML = "🔊";

     statusText.textContent =
        "ONLINE";
    }

    const source =
        document.getElementById(
            "source_lang"
        );

    const target =
        document.getElementById(
            "target_lang"
        );

    let temp =
        source.value;

    source.value =
        target.value;

    target.value =
        temp;

    autoTranslate();
}


function copyTranslation(){

    const text =
        translatedText.innerText;

    navigator.clipboard
        .writeText(text);

    statusText.textContent =
        "COPIED";

    setTimeout(() => {

        statusText.textContent =
            "ONLINE";

    }, 1500);
}

async function speakTranslation() {

    console.log("isSpeaking:", isSpeaking);
    console.log("currentAudio:", currentAudio);

    if (isSpeaking) {

        currentAudio.pause();

        currentAudio.currentTime = 0;

        currentAudio = null;

        isSpeaking = false;

        document.getElementById(
            "speakBtn"
        ).innerHTML = "🔊";

        statusText.textContent =
            "ONLINE";

        return;
    }

    const text =
        document.getElementById(
            "translated_text"
        ).innerText.trim();
     
    if (
        text === "" ||
        text === "Translation will appear here..."
    ) {

        alert("No translation found.");

        return;
    }

    const targetLang =
        document.getElementById(
            "target_lang"
        ).value;

    statusText.textContent =
        "GENERATING VOICE...";

    try {

        const response =
            await fetch("/speak", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    text: text,

                    lang: targetLang

                })

            });

        const data =
            await response.json();

        if (data.success) {

            if (currentAudio) {

                currentAudio.pause();

               currentAudio.currentTime = 0;

                currentAudio = null;
            }

            currentAudio =
                new Audio(
                    data.audio +
                    "?t=" +
                    new Date().getTime()
                );

            setWorkingStatus("Speaking");

            isSpeaking = true;

            document.getElementById(
                 "speakBtn"
            ).innerHTML = "⏹";

            await currentAudio.play();

            currentAudio.onended = () => {

                  currentAudio = null;

                  isSpeaking = false;

                  document.getElementById(
                     "speakBtn"
                 ).innerHTML = "🔊";

                setOnlineStatus();
            };

        }
        else {

            alert(data.error);

            statusText.textContent =
                "ERROR";

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Voice generation failed."
        );

        statusText.textContent =
            "ERROR";

    }

}
function toggleHistory(){

    const history =
        document.getElementById(
            "historyContainer"
        );

    if(history.style.display === "block"){

        history.style.display =
            "none";
    }
    else{

        history.style.display =
            "block";
    }
}
let mediaRecorder;
let audioChunks = [];

 
async function startRecording() {

    if (isRecording) {

          console.log("Already recording.");

         return;
 
    }

     isRecording = true;

    try {
          if (currentAudio) {

            currentAudio.pause();

             currentAudio.currentTime = 0;

             currentAudio = null;

             isSpeaking = false;


             document.getElementById(
                "speakBtn"
             ).innerHTML = "🔊";

            statusText.textContent =
              "ONLINE";
            }
            calibrationComplete = false;

             calibrationSamples = [];

             noiseFloor = 0;

             speechThreshold = 0;

        const stream =
               await navigator.mediaDevices.getUserMedia({

        audio: {

            echoCancellation: true,

            noiseSuppression: true,

            autoGainControl: true,

            channelCount: 1,

            sampleRate: 48000

        }

    });
        audioContext = new AudioContext();

        const source =
           audioContext.createMediaStreamSource(
               stream
            );

        analyser =
              audioContext.createAnalyser();

        source.connect(analyser);

        analyser.fftSize = 2048;

const dataArray =
    new Uint8Array(
        analyser.frequencyBinCount
    );
        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

       setWorkingStatus("Listening");

        inputText.value = "🎤 Listening... Speak now...";

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            stream
                 .getTracks()
                .forEach(
                     track => track.stop()
                 );

    // Close AudioContext

             if (audioContext) {

                 audioContext.close();

                audioContext = null;

            }

    // Stop animation loop

             if (animationId) {

                cancelAnimationFrame(animationId);

                 animationId = null;

            }

             try {

                setWorkingStatus("Processing");

                 const audioBlob =
                        new Blob(
                            audioChunks,
                        {
                            type: "audio/webm"
                        }
                    ); 
                 console.log(
                           "Audio Chunks:",
                           audioChunks.length
                );

                 console.log(
                       "Audio Blob Size:",
                        audioBlob.size
                );

                const formData =
                      new FormData();

                formData.append(
                     "audio",
                     audioBlob,
                     "recording.webm"
                );
                 console.time("Transcription");
                 const response =
                         await fetch(
                            "/transcribe",
                            {
                              method: "POST",
                               body: formData
                            }
                        );
   
                 const data =
                       await response.json();
                       
                console.timeEnd("Transcription");

                 if (data.success) {

                     const transcript =
                      data.text.trim();

                     const ignoredTexts = [

                              "",

                             "thanks for watching",

                             "thank you",

                             "bye",

                             "goodbye",

                             "see you",

                               "thanks",

                              "you"

                    ];

                     const cleanedTranscript =
                           transcript
                               .toLowerCase()
                               .replace(/[^\w\s]/g, "")
                               .trim();

                   if (

                         transcript.length < 2 ||

                         ignoredTexts.includes(
                           cleanedTranscript
                        )
                    

                    ) {

                         console.log(
                              "Ignored silence."
                        );

                         inputText.value = "";

                         setOnlineStatus();
                         resetVoiceEngine();

 
                         return;

                    }

    inputText.value =
        transcript;

    updateCounters();

    autoTranslate();

    statusText.textContent =
        "ONLINE";
    
     resetVoiceEngine();

}
                 else {

                        alert(
                            "Whisper Error: " +
                             data.error
                         );

                         statusText.textContent =
                               "ERROR";

                         resetVoiceEngine();
 
                }

            }
             catch (error) {

                   console.error(error);

                alert(
                    "Transcription failed."
                );

                 statusText.textContent =
                       "ERROR";
                 
                 resetVoiceEngine();
            }

};
if (animationId) {

    cancelAnimationFrame(animationId);

    animationId = null;

}

mediaRecorder.start();

console.log(
    "MediaRecorder State:",
    mediaRecorder.state
);

function monitorAudio() {

    analyser.getByteTimeDomainData(dataArray);

    let sumSquares = 0;

    for (
        let i = 0;
        i < dataArray.length;
        i++
    ) {

        let sample =
            (dataArray[i] - 128) / 128;

        sumSquares += sample * sample;

    }

    const rms =
        Math.sqrt(
            sumSquares / dataArray.length
        );

    if (!calibrationComplete) {

        calibrationSamples.push(rms);

        if (calibrationSamples.length >= 120) {

            const total =
                calibrationSamples.reduce(
                    (a, b) => a + b,
                    0
                );

            noiseFloor =
                total /
                calibrationSamples.length;

            speechThreshold =
                noiseFloor * 3;

            calibrationComplete = true;

            calibrationSamples = [];

            console.log(
                "Noise Floor:",
                noiseFloor.toFixed(4)
            );


            console.log(
                "Speech Threshold:",
                speechThreshold.toFixed(4)
            );

        }

    }

   // console.log(
     //   "RMS:",
       // rms.toFixed(4)
   // );

    if (calibrationComplete) {

        if (rms > speechThreshold) {

                 if (!speechDetected) {

                     speechDetected = true;

                     console.log("🎤 Speech Started");

                }

                isUserSpeaking = true;

                silenceStartTime = null;

        } 
         else {

             if (isUserSpeaking) {
  
                  if (!silenceStartTime) {

                       silenceStartTime = Date.now();

            }

        else if (

            Date.now() - silenceStartTime >

            SILENCE_DELAY

        ) {

             console.log("🛑 Speech Ended");

             isUserSpeaking = false;

            silenceStartTime = null;

             if (

                  speechDetected &&

                  mediaRecorder &&

                  mediaRecorder.state === "recording"

            ) {

                  mediaRecorder.stop();

                 return;
            }

        }

        }

    }

}

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        animationId =
            requestAnimationFrame(
                monitorAudio
            );

    }

}

monitorAudio();

setTimeout(() => {

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();

       if (animationId) {

               cancelAnimationFrame(animationId);

               animationId = null;

        }

        stream
           .getTracks()
           .forEach(track => track.stop());

        if (audioContext) {

              audioContext.close();

              audioContext = null;

        }
    }

}, 15000);

} // End of try

catch (error) {

    console.error(error);

    alert(
        "Microphone permission denied."
    );


    isRecording = false;
}

}  