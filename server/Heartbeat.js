import axios from "axios";

const HEARTBEAT_INTERVAL = 8000; // Interval in milliseconds

export const sendHeartbeat = async (username) => {
  const PORT = process.env.PORT || 3000;

  try {
    await axios({
      method: "post",
      url: `http://192.168.174.64:${PORT}/api/heartbeat`,
      data: {
        name: username,
      },
    });
  } catch (error) {
    console.error("Error sending heartbeat:", error);
  }
};

export const startHeartbeat = (username) => {
  sendHeartbeat(username);
  return setInterval(() => sendHeartbeat(username), HEARTBEAT_INTERVAL);
};

export const stopHeartbeat = (intervalId) => {
  clearInterval(intervalId);
};
