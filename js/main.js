'use strict';

const mediaStreamConstrains = {
  video: true,
  audio: true
};

const localVideo = document.querySelector('video');

let localStream;

// Handles success by adding the MediaStream to the video element.
const gotLocalMeditaStream = mediaStream => {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
};

// Handles error by logging a message to the console with the error message.
const handleLocalMesiaStreamError = error => {
  console.log('navigator.getUserMedia error: ', error);
};

// Initializes media stream.
navigator.mediaDevices.getUserMedia(mediaStreamConstrains)
  .then(gotLocalMeditaStream)
  .catch(handleLocalMesiaStreamError);