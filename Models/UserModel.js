const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({ 
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  preferences: [{
    type: String,
    trim: true
  }],
  notificationInterval: {
    type: String,
    default: "Daily", // Default interval in hours
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
  },
  notification: [{
  
  }]
});

// Hash password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;