import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
import { sendWelcomeEmail } from "../emails/emailHanlers.js";


export const signup = async (req, res) => {
try {
    const {name, username, email, password} = req.body;

    if(!name || !username || !email || !password ){
        return res.status(400).json({ message: "All fields are required"});
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail){
        return res.status(400).json({ message: "Email already exists"});
    }

    if (password.length < 6){
        return res.status(400).json({message: " Password must be atleast 6 characters"})
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: hashedPassword,
        username
    })

    await user.save();

    const token = jwt.sign( {userId:user._id}, process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("jwt-linkedin", token, {
        httpOnly: true, //prevent XSS atacks
        maxAge: 3 * 24 * 60 * 60 * 1000,
        sameSite: "strict",  // prevent CSRF attacks
        secure: process.env.NODE_ENV === "production", //prevents man-in-the-middle attacks
    })

    res.status(201).json({ message: "User registered successfully" })

    // todo 01: send welcome email
    const profileURL = process.env.CLIENT_URL + "/profile/" + user.username

    try {
        await sendWelcomeEmail(user.email, user.name, profileURL)
    } catch (emailError) {
        console.error("Error sending welcome Email", emailError)
    }



    
} catch (error) {
    console.log("Error in Signup: ", error.message);
    res.status(500).json({ message: "Internal server error" });
    
}}

export const login = (req, res) => {
    res.send("login");
}

export const logout = (req, res) => {
    res.send("logout");
}