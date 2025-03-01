const express = require("express");
const router = express.Router();
const {
  userRegister,
  userLogin,
  UserdataUpdate,
  getUserData,
  userNotification,
  fetchNotificationById
} = require("../Controllers/UserController");

// all the below is for residence
router.post("/register", userRegister);
router.post("/login", userLogin);
router.put("/update", UserdataUpdate);
router.get("/userdata/:id", getUserData);
router.get("/notification/:id", userNotification);
router.get("/notificationbyid/:id", fetchNotificationById);

module.exports = router; 