interface WebSocketUrlOptions {
  mode?: "host";
  room?: string | null;
}

export const getWebSocketUrl = (path = "/api/ws", options: WebSocketUrlOptions = {}) => {
  if (typeof window === "undefined") {
    return `ws://localhost${path}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const baseUrl = configuredUrl || `${protocol}://${window.location.host}`;
  const url = new URL(path, baseUrl);

  if (options.mode) {
    url.searchParams.set("mode", options.mode);
  }

  if (options.room) {
    url.searchParams.set("room", options.room.toUpperCase());
  }

  return url.toString();
};
