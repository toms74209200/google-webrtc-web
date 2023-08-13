'use strict';

const mediaStreamConstrains = {
  video: true,
  audio: true
};

const offerOptions = {
  offerToReceiveVideo: 1,
}

let startTime = null;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

// Handles success by adding the MediaStream to the video element.
const gotLocalMediaStream = mediaStream => {
  localVideo.srcObject = mediaStream;
  localStream = mediaStream;
  callButton.disabled = false;
}

// Handles error by logging a message to the console with the error message.
const handleLocalMesiaStreamError = error => {
  console.log('navigator.getUserMedia error: ', error);
}

const gotRemoteMediaStream = event => {
  const mediaStream = event.stream;
  remoteVideo.srcObject = mediaStream;
  remoteStream = mediaStream;
  console.log('Remote peer connetcion reveived remote stream.');
}

const logVideoLoaded = event => {
  const video = event.target;
  console.log(`${video.id} videoWidth: ${video.videoWidth}px, ` + `videoHeight: ${video.videoHeight}px.`);
}

const logResizedVideo = event => {
  logVideoLoaded(event);

  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    startTime = null;
    console.log(`Setup time: ${elapsedTime.toFixed(3)}ms.`);
  }
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresisze', logResizedVideo);

const handleConnection = event => {
  const peerConnection = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer.addIceCandidate(newIceCandidate)
      .then(() => {
        handleConnectionsSuccess(peerConnection);
      }).catch(error => {
        handleConnectionFailure(peerConnection, error);
      });

    console.log(`${getPeerName(peerConnection)} ICE candidate:\n` + `${event.candidate.candidate}.`);
  }
}

const handleConnectionsSuccess = peerConnection => {
  console.log(`${getPeerName(peerConnection)} addIceCandidate success.`);
}

const handleConnectionFailure = (peerConnection, error) => {
  console.log(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n` + `${error.toString()}.`);
}

const handleConnectionChange = event => {
  const peerConnection = event.target;
  console.log('ICE state change event: ', event);
  console.log(`${getPeerName(peerConnection)} ICE state: ` + `${peerConnection.iceConnectionState}.`);
}

const setSessionDescriptionError = error => {
  console.log(`Failed to create session description: ${error.toString()}`);
}

const setLocalDesctiptionSuccess = (peerConnection, functionName) => {
  const peerName = getPeerName(peerConnection);
  console.log(`${peerName} ${functionName} complete.`)
}

const setLocalDescriptionSuccess = peerConnection => {
  setLocalDescriptionSuccess(peerConnection, 'setLocalDescription');
}

const setRemoteDescriptionSuccess = peerConnection => {
  setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

const createdOffer = description => {
  console.log(`Offer from localPeerConnection:\n${description.sdp}`);

  console.log('localPeerConnection setLocalDescription start.');
  localPeerConnection.setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(localPeerConnection);
    }).catch(setSessionDescriptionError);

  console.log('remotePeerConnection createAnswer start.');
  remotePeerConnection.createAnswer()
    .then(createAnswer)
    .catch(setSessionDescriptionError);
}

const createAnswer = description => {
  console.log(`Answer from remotePeerConnection:\n${description.sdp}.`);

  console.log('remotePeerConnection setLocalDescription start.');
  remotePeerConnection.setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(remotePeerConnection);
    }).catch(setSessionDescriptionError);

  console.log('localPeerConnection setRemoteDescriptionStart.');
  localPeerConnection.setRemoteDescription(localPeerConnection)
    .then(() => {
      setRemoteDescriptionSuccess(localPeerConnection);
    }).catch(setSessionDescriptionError);
}

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.disabled = true;
hangupButton.disabled = true;

const startAction = () => {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia(mediaStreamConstrains)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
  console.log('Requesting local stream.');
}

const callAction = () => {
  callButton.disabled = true;
  hangupButton.disabled = false;

  console.log('Starting call.');
  startTime = window.performance.now();

  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}.`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}.`);
  }

  const servers = null;

  localPeerConnection = new RTCPeerConnection(servers);
  console.log('Created local peer connection object localPeerConnection.');

  localPeerConnection.addEventListener('icecandidate', handleConnection);
  localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);

  remotePeerConnection = new RTCPeerConnection(servers);
  console.log('Created remote peer connection object remotePeerConnection.');

  remotePeerConnection.addEventListener('icecandidate', handleConnection);
  remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
  remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

  localPeerConnection.addStream(localStream);
  console.log('Added local stream to localPeerConnection.');

  console.log('localPeerConnection createOffer start.');
  localPeerConnection.createOffer(offerOptions)
    .then(createdOffer).catch(setSessionDescriptionError);
}

const hangupAction = () => {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  console.log('Ending call.');
}

startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);


const getOtherPeer = peerConnection => {
  return (peerConnection === localPeerConnection) ?
    remotePeerConnection : localPeerConnection;
}

const getPeerName = peerConnection => {
  return (peerConnection === localPeerConnection) ?
    'localPeerConnection' : 'remotePeerConnection';
}

const trace = text => {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
}