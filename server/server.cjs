//! JOINROOM ENDPOINT

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  status: String,
  lastActive: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const gameSchema = new mongoose.Schema({
  user1: { type: String },
  user2: { type: String, default: null },
  user1timestamp: { type: Date, default: null },
  user2timestamp: { type: Date, default: null },
  roomtype: { type: String },
  user1word: { type: String, default: null },
  user2word: { type: String, default: null },
  user1try: { type: [String], default: null },
  user2try: { type: [String], default: null },
});

const Game = mongoose.model("Game", gameSchema);

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.post("/createroom", async (req, res) => {
  const { user1, roomtype } = req.body;

  try {
    const newRoom = new Game({
      user1: user1,
      roomtype: roomtype,
    });

    await newRoom.save();

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    // Handle any errors
    console.error("Error creating room:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.patch("/joinroom", async (req, res) => {
  try {
    // Destructure the userInRoom and joiningUser values from the request body
    const { userInRoom, joiningUser } = req.body;

    // Find the room that has userInRoom as either user1 or user2
    const room = await Game.findOne({
      $or: [{ user1: userInRoom }, { user2: userInRoom }],
    });

    // Check if the room exists
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Check if user1 or user2 in the room is null and update it with joiningUser
    if (!room.user1) {
      room.user1 = joiningUser;
    } else if (!room.user2) {
      room.user2 = joiningUser;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Room is already full" });
    }

    // Save the updated room to the database
    await room.save();

    return res
      .status(200)
      .json({ success: true, message: "User joined room successfully" });
  } catch (error) {
    console.error("Error joining room:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

app.get("/user", async (req, res) => {
  const { name, password } = req.query;

  try {
    const user = await User.findOne({ name, password }).exec();
    if (user) {
      await User.updateOne({ name }, { status: "Online" });
      res.json({ success: true, message: "User found", user });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error querying user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/user/checkname", async (req, res) => {
  const { name } = req.query;

  try {
    const user = await User.findOne({ name }).exec();
    if (user) {
      res.json({ success: true, message: "User found", user });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/user", async (req, res) => {
  const { name, password, status } = req.body;

  try {
    const newUser = new User({ name, password, status });

    await newUser.save();

    res.json({ success: true, message: "User added successfully" });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/heartbeat", async (req, res) => {
  const { name } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { name },
      { $set: { lastActive: new Date() } },
      { new: true }
    );

    if (user) {
      res.status(200).send("Last active updated");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating lastActive:", error);
    res.status(500).send("Internal server error");
  }
});

const checkAndUpdateStatus = async () => {
  try {
    const users = await User.find({ status: { $in: ["Online", "In-game"] } });

    users.forEach(async (user) => {
      if (user.lastActive.getTime() < Date.now() - 15000) {
        await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { status: "Offline" } }
        );
      }
    });
  } catch (error) {
    console.error("Error checking and updating status:", error);
  }
};

setInterval(checkAndUpdateStatus, 16000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
