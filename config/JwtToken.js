const jwt = require('jsonwebtoken');
require("dotenv").config()

//creating user jwt token
const token = async (user)=>{
    return jwt.sign({ id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    )
}

module.exports={
    token
};