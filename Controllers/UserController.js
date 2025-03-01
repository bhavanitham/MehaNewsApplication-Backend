const cron = require("node-cron");
const axios = require("axios");
const mailer = require("../config/mailer");
const User = require("../Models/UserModel");
const bcrypt = require("bcryptjs");
const { token } = require("../config/JwtToken");
const generateToken = token;

// account creation function
const userRegister = async (req, res) => {
    const {
      email,
      password
    } = req.body;
    try {
      if ( email && password) {
        //Checking user already registered in DB
        const user = await User.findOne({ email });
        //if already registered
        if (user) {
          res
            .status(200)
            .json({ message: "User already registered Please try login" });
        } else {
          //if not found in db proceed to create account
          const newUser = User({ email, password });
          await newUser.save();
          res
            .status(201)
            .json({ message: "Account Created Successfully", newUser });
        }
      } else {
        res
          .status(406)
          .json({ message: "Please Provide all the Necessary Info to Proceed" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };

//user login validation with DB and create JWT token
const userLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    if (email && password) {
      // Checking if the user is already registered in DB
      const user = await User.findOne({ email });

      // If user is not found
      if (!user) {
        return res.status(404).json({ message: "User not found, register before login" });
      } else {
        // Validating password for the found user
        const passwordValidation = await bcrypt.compare(password, user.password);
        
        if (passwordValidation) {
          const token = await generateToken(user);
          user.token = token;
          await user.save();
          
          // After sending the response, handle cron jobs asynchronously
          const notificationInterval = user.notificationInterval;
          const userid = user._id.toString();
          console.log(userid, "LOGIN");

          if (notificationInterval === "Hourly") {
            cron.schedule("0 * * * *", () => userNotification(userid));
          } else if (notificationInterval === "Weekly") {
            cron.schedule("0 0 * * 1", () => userNotification(userid));
          } else if (notificationInterval === "Monthly") {
            cron.schedule("0 0 1 * *", () => userNotification(userid));
          } else {
            cron.schedule("0 0 * * *", () => userNotification(userid));
          }
           // Send the successful response first
           return res.status(200).json({
            message: "Login Successfully",
            token: token,
            userid: user._id,
            email: user.email,
          });
        } else {
          return res.status(401).json({ message: "Unauthorized. Check login credentials" });
        }
      }
    } else {
      return res.status(406).json({ message: "Please provide all the necessary info to proceed" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
 

  //updating user data
  const UserdataUpdate = async (req, res) => {
     const {
      name,
      email,
      password,
      preferences,
      notificationInterval,
    } = req.body;
    console.log(req.body);
    try {
        const user = await User.findOne({ email });
        //if user already registered
        if (!user) {
          res
            .status(404)
            .json({ message: "User not found register before login" });
        } else {
            user.name = name || user.name;
            user.preferences = preferences || user.preferences;
            user.notificationInterval = notificationInterval || user.notificationInterval;
            await user.save();
            res
              .status(200)
              .json({
                message: "User data updated successfully",
                userid: user._id,
                email: user.email,
              });
          } 
        }
       catch (error) {
      console.log(error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };
   
  const getUserData = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

const sendNotification = async (email, message) => {
    try {
      let pageSize = 80;
      let page = 1;
      let title;
      let description;
      let category = "general";
    
      const response = await axios.get(`https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${process.env.API_KEY}`);
      // console.log(response.data);
      title = response.data.articles[0].title;
      description = response.data.articles[0].description;
    
      // Send mail
      console.log(email,"Email");
      await mailer.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `Breaking News Update`,
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <div style="background-color: #1a237e; color: #ffffff; padding: 20px; text-align: center;">
                  <h1 style="margin: 0;">Latest News Update</h1>
              </div>
              <div style="padding: 20px;">
                  <p style="color: #333333; line-height: 1.6;">Dear Reader,</p>
                  <p style="color: #333333; line-height: 1.6;">We have important news updates for you.</p>
                  <h1 style="color: #333333; line-height: 1.6;">${title}</h1>
                  <p style="color: #333333; line-height: 1.6;">${description}</p> 
                  <div style="text-align: center; margin: 20px 0;">
                      <a href="https://bhava-mehalivenewsapplicationfrontend.netlify.app/" style="background-color: #283593; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 500;">
                          Read More
                      </a>
                  </div>
                  <p style="color: #333333; line-height: 1.6;">Stay informed with our latest updates.</p>
                  <p style="color: #333333; line-height: 1.6;">Best regards,</p>
                  <p style="color: #333333; font-weight: 600;">News Team</p>
              </div>
              <div style="background-color: #f8f9fa; text-align: center; padding: 15px; font-size: 12px; color: #666666;">
                  <p style="margin: 0;">This is an automated news update. Please do not reply to this email.</p>
              </div>
          </div>
      </div>`
    });
      console.log("Notification sent successfully");
      return title;
    } 
    
    catch (error) {
      console.error("Error sending notification:", error);
    }
};  

const userNotification = async (userid) => {
  console.log(userid);
  console.log("Task is Running");
    try {
      const user = await User.findById(userid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { email, notificationInterval } = user;
      const currentTime = new Date();
      let notificationTitle = await sendNotification(email, "Notification message");
      console.log(notificationTitle);
      user.notification.push({ title: notificationTitle, time: currentTime });
      await user.save();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
}  

 const fetchNotificationById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { notification } = user;
      res.status(200).json(notification);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  const task =() => {

    console.log("Task is running");
  } 
 

module.exports = {
  userRegister,
  userLogin,
  UserdataUpdate,
  getUserData,
  sendNotification,
  userNotification,
  fetchNotificationById
}