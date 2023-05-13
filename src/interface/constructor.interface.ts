export interface PeerConstructor {
  initiator: boolean;
  localStream: MediaStream;
  config: RTCConfiguration;
  onIceCandidateHandler?: (event: RTCPeerConnectionIceEvent) => void;
  onConnectionStateChangeHandler?: () => RTCIceConnectionState | void;
  enableDebugMode?: boolean;
}
