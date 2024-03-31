import axios from "axios";
import { useEffect } from "react";

const HEARTBEAT_INTERVAL = 8000; // Interval in milliseconds

const sendHeartbeat = async (username) => {
  try {
    // Send heartbeat request to the server to update lastActive
    await axios({
      method: "post",
      url: "http://192.168.1.37:${PORT}/api/heartbeat",
      data: {
        name: username,
      },
    });
    console.log("Heartbeat sent ", username);
  } catch (error) {
    console.error("Error sending heartbeat:", error);
  }
};

const Heartbeat = () => {
  useEffect(() => {
    // Send heartbeat immediately when component mounts
    sendHeartbeat();

    // Schedule heartbeat requests at regular intervals
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return null; // Heartbeat component doesn't render anything
};

export default Heartbeat;
