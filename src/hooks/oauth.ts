import { websocket } from "../lib";
import { useCallback, useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "../lib/reconnecting-websocket";

export type LoginSocketMessage = {
  event: string;
  deviceId: string;
  payload: {
    user: any;
  };
};

function useOAuthClient({ WSS_URL }: { WSS_URL: string }) {
  const client = useRef<ReconnectingWebSocket | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!client.current) {
      console.log("Initializing WebSocket...");
      client.current = new websocket(WSS_URL);
    }

    return () => {
      if (client.current) {
        client.current.close();
        client.current = null;
        console.log("WebSocket connection cleaned up.");
      }
    };
  }, [WSS_URL]);

  const handleLogin = useCallback(
    (
      googleOAuthClientId: string,
      deviceId: string,
      callbackFunc: (userData: unknown) => void
    ) => {
      console.log("client", client);
      if (!client.current) {
        throw new Error("WebSocket client is not initialized");
      }
      if (isPending) {
        throw new Error("Login is already pending");
      }
      const redirect_uri = "https://figr.design";
      const authURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleOAuthClientId}&redirect_uri=${redirect_uri}&response_type=token&scope=openid+email+profile&state=${deviceId}`;

      setIsPending(true);
      const authWindow = window.open(authURL, "_blank");
      if (!authWindow) {
        throw new Error("Failed to open login window");
      }

      client.current.addEventListener(
        "message",
        async ({ data }: MessageEvent<string>) => {
          console.log("data received is ", data);
          const parsedMessage = JSON.parse(data) as LoginSocketMessage;
          console.log("parsedMessage", parsedMessage);

          if (parsedMessage.event !== "auth_success") {
            throw new Error(
              `Incorrect event type ${parsedMessage.event} received from login socket connection`
            );
          }

          if (parsedMessage.deviceId !== deviceId) {
            console.log("parsedMessage.deviceId", parsedMessage.deviceId);
            throw new Error(
              `Incorrect deviceId ${parsedMessage.deviceId} received from login socket connection`
            );
          }

          if (!parsedMessage.payload.user) {
            console.log("parsedMessage.payload", parsedMessage.payload);
            throw new Error(
              `Incorrect payload ${parsedMessage.payload} received from login socket connection`
            );
          }

          setIsPending(false);
          callbackFunc(parsedMessage.payload.user);

          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
        }
      );

      client.current.addEventListener("error", (event) => {
        setIsPending(false);
        setError(event.message);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
      });
    },
    [WSS_URL, isPending]
  );

  return {
    handleLogin,
    isPending,
    error,
  };
}

export default useOAuthClient;
