require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

// Define the user schema
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  status: String,
  lastActive: { type: Date, default: Date.now }, // Add lastActive field with default value
});

// Create the User model from the schema
const User = mongoose.model("User", userSchema);

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

// Endpoint to check if user exists with provided name and password
app.get("/user", async (req, res) => {
  const { name, password } = req.query;

  try {
    const user = await User.findOne({ name, password }).exec();
    if (user) {
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
    // Find a user with the provided name
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
    // Create a new user object
    const newUser = new User({ name, password, status });

    // Save the new user to the database
    await newUser.save();

    // Respond with success message
    res.json({ success: true, message: "User added successfully" });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/heartbeat", async (req, res) => {
  const { name } = req.body;

  try {
    // Find the user by name and update lastActive timestamp
    const user = await User.findOneAndUpdate(
      { name },
      { $set: { lastActive: new Date() } },
      { new: true }
    );

    if (user) {
      console.log(`Last active updated for user ${name}`);
      res.status(200).send("Last active updated");
    } else {
      console.log(`User ${name} not found`);
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating lastActive:", error);
    res.status(500).send("Internal server error");
  }
});

const checkAndUpdateStatus = async () => {
  try {
    console.log("Updating online status for all users...");
    // Find users whose status is "Online" or "In-game"
    const users = await User.find({ status: { $in: ["Online", "In-game"] } });

    // Iterate over each user
    users.forEach(async (user) => {
      // Check if lastActive is more than 15 seconds old
      if (user.lastActive.getTime() < Date.now() - 15000) {
        // Update user status to "Offline"
        await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { status: "Offline" } }
        );
        console.log(`User ${user.name} status updated to "Offline"`);
      }
    });
  } catch (error) {
    console.error("Error checking and updating status:", error);
  }
};

// Run the checkAndUpdateStatus function every 16 seconds
setInterval(checkAndUpdateStatus, 16000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
