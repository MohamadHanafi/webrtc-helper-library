import { PeerConstructor, StreamOptions } from "./interface/index";

export default class Peer {
  initiator: boolean;
  peer: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream: MediaStream;
  onIceCandidateHandler: (event: RTCPeerConnectionIceEvent) => void;
  onConnectionStateChangeHandler: () => RTCIceConnectionState | void;
  enableDebugMode: boolean;

  static getLocalStream: (options: StreamOptions) => Promise<MediaStream> =
    async function ({ audio = true, video = true, onError = () => {} }) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio,
          video,
        });
        return stream;
      } catch (error) {
        onError(error);
      }
    };

  constructor({
    initiator,
    localStream,
    config,
    onConnectionStateChangeHandler,
    onIceCandidateHandler,
    enableDebugMode,
  }: PeerConstructor) {
    this.initiator = initiator;
    this.localStream = localStream;
    this.onConnectionStateChangeHandler =
      onConnectionStateChangeHandler || (() => {});
    this.onIceCandidateHandler = onIceCandidateHandler || (() => {});
    this.enableDebugMode = enableDebugMode || false;
    this.peer = new RTCPeerConnection(config);
    this.remoteStream = new MediaStream();
    this.addTracks();
    this.addListeners();
  }

  debugHandler(message: string) {
    this.enableDebugMode && console.log("[WebRTC] ", message);
  }

  addTracks() {
    this.localStream.getTracks().forEach((track) => {
      this.debugHandler(`Adding ${track.kind} track`);
      this.peer.addTrack(track, this.localStream);
    });
  }

  async handleOffer(offer?: RTCSessionDescription) {
    try {
      if (this.initiator) {
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        this.debugHandler(`Offer created and set to local description`);
        return offer;
      }
      await this.peer.setRemoteDescription(offer);
      this.debugHandler(`Offer received and set to remote description`);
    } catch (error) {
      this.debugHandler(`An Error has occurred while handling the offer`);
      console.error(error);
    }
  }

  async handleAnswer(answer?: RTCSessionDescription) {
    try {
      if (!this.initiator) {
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        this.debugHandler(`Answer created and set to local description`);
        return answer;
      }
      await this.peer.setRemoteDescription(answer);
      this.debugHandler(`Answer received and set to remote description`);
    } catch (error) {
      this.debugHandler(`An Error has occurred while handling the answer`);
      console.error(error);
    }
  }

  addIceCandidate(candidates: RTCIceCandidate[]) {
    candidates.forEach(async (candidate) => {
      try {
        await this.peer.addIceCandidate(candidate);
        this.debugHandler(`ICE candidate added ${candidate.candidate}}`);
      } catch (error) {
        this.debugHandler(`An Error has occurred while adding ICE candidate`);
        console.error(error);
      }
    });
  }

  // events handlers
  onTrack() {
    this.peer.ontrack = (event: RTCTrackEvent) => {
      this.remoteStream.addTrack(event.track);
      this.debugHandler(`Track added to remote stream ${event.track.kind}`);
    };
  }

  onIceCandidate() {
    this.debugHandler(`Running onIceCandidate`);
    this.peer.onicecandidate = this.onIceCandidateHandler;
  }

  onConnectionStateChange() {
    this.debugHandler(`Running onConnectionStateChange`);
    this.peer.onconnectionstatechange = this.onConnectionStateChangeHandler;
  }

  addListeners() {
    this.onTrack();
    this.onIceCandidate();
    this.onConnectionStateChange();
  }
}
