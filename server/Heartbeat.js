import axios from "axios";

const HEARTBEAT_INTERVAL = 8000; // Interval in milliseconds

export const sendHeartbeat = async (username) => {
  const PORT = process.env.PORT || 3000;

  try {
    // Send heartbeat request to the server to update lastActive
    await axios({
      method: "post",
      url: `http://192.168.1.37:${PORT}/api/heartbeat`,
      data: {
        name: username,
      },
    });
  } catch (error) {
    console.error("Error sending heartbeat:", error);
  }
};

export const startHeartbeat = (username) => {
  // Send heartbeat immediately
  sendHeartbeat(username);

  // Schedule heartbeat requests at regular intervals
  return setInterval(() => sendHeartbeat(username), HEARTBEAT_INTERVAL);
};

export const stopHeartbeat = (intervalId) => {
  clearInterval(intervalId);
};
