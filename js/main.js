'use strict';

var localConnection;
var remoteConnection;
var sendChannel;
var receiveChannel;
var pcConstraint;
var dataConstraint;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

const createConnection = () => {
  dataChannelSend.placeholder = '';
  var servers = null;
  pcConstraint = null;
  dataConstraint = null;
  console.log('Using SCTP based data channels');
  window.localConnection = localConnection = new RTCPeerConnection(servers, pcConstraint);
  console.log('Created local peer connection object localConnection');

  sendChannel = localConnection.createDataChannel('sendDataChannel', dataConstraint);
  console.log('Created send data channel');

  localConnection.onicecandidate = iceCallback1;
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  window.remoteConnection = remoteConnection = new RTCPeerConnection(servers, pcConstraint);
  console.log('Created remote peer connection object remoteConnection');

  remoteConnection.onicecandidate = iceCallback2;
  remoteConnection.ondatachannel = receiveChannelCallback;

  localConnection.createOffer().then(
    gotDescription1,
    onCreateSessionDescriptionError
  );
  startButton.disabled = true;
  closeButton.disabled = false;
}

const enableStartButton = () => {
  startButton.disabled = false;
}

const disableSendButton = () => {
  sendButton.disabled = true;
}

const onCreateSessionDescriptionError = error => {
  console.log('Failed to create session description: ' + error.toString());
}

const sendData = () => {
  var data = dataChannelSend.value;
  sendChannel.send(data);
  console.log('Sent Data: ' + data);
}

const closeDataChannels = () => {
  console.log('Closing data channels');
  sendChannel.close();
  console.log('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  console.log('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  console.log('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

const gotDescription1 = desc => {
  localConnection.setLocalDescription(desc);
  console.log('Offer from localConnection \n' + desc.sdp);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
    gotDescription2,
    onCreateSessionDescriptionError
  );
}

const gotDescription2 = desc => {
  remoteConnection.setLocalDescription(desc);
  console.log('Answer from remoteConnection \n' + desc.sdp);
  localConnection.setRemoteDescription(desc);
}

const iceCallback1 = event => {
  console.log('local ice callback');
  if (event.candidate) {
    remoteConnection.addIceCandidate(event.candidate).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    console.log('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

const iceCallback2 = event => {
  console.log('remote ice callback');
  if (event.candidate) {
    localConnection.addIceCandidate(event.candidate).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    console.log('Remote ICE candidate: \n' + event.candidate.candidate);
  }
}

const onAddIceCandidateSuccess = () => {
  console.log('AddIceCandidate success.');
}

const onAddIceCandidateError = error => {
  console.log('Failed to add Ice Candidate: ' + error.toString());
}

const receiveChannelCallback = event => {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

const onReceiveMessageCallback = event => {
  console.log('Received Message');
  dataChannelReceive.value = event.data;
}

const onSendChannelStateChange = () => {
  var readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

const onReceiveChannelStateChange = () => {
  var readyState = receiveChannel.readyState;
  console.log('Receive channel state is: ' + readyState);
}

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;
