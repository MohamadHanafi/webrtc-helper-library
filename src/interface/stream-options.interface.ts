export interface StreamOptions {
  audio?: boolean;
  video?: boolean;
  onError?: (error?: Error) => void;
}
