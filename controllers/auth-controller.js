import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import gravatar from "gravatar";
import { nanoid } from "nanoid";
import Jimp from "jimp";
import User from "../models/user.js";
import sendEmail from "../helpers/sendEmail.js";
import createVerifyEmail from "../helpers/createVerifyEmail.js";

dotenv.config();
const { SECRET_KEY } = process.env;

const register = async (req, res) => {
    const { email, password } = req.body;
    const avatarURL = gravatar.url(email, { s: '200' });
    const user = await User.findOne({ email });
  
    if (user) {
        res.status(409).json({ message: 'Email in use' });
        return;
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = nanoid();
    const newUser = await User.create({...req.body, password:hashPassword, avatarURL, verificationToken});

    const verifyEmail = createVerifyEmail({email, verificationToken});

    await sendEmail(verifyEmail);

    res.status(201).json({
        user: {
            email: newUser.email,
            subscription: newUser.subscription,
            avatarURL: avatarURL,
            }
    })
};

const verify = async (req, res) => {
    const { verificationToken } = req.params;
  
    const user = await User.findOne({ verificationToken });
  
    if (!user) {
        res.status(404).json({ message: 'User not found' }); 
        return;
    }

    await User.findByIdAndUpdate(user.id, { verify: true, verificationToken: " " });
    
    res.status(200).json({ message: 'Verification successful' });
};

const resendVerifyEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) { 
        res.status(404).json({ message: 'Not found' }); 
        return
    }
    if (user.verify) {
        res.status(400).json({ message: 'Verification has already been passed' }); 
        return
    }

    const verifyEmail = createVerifyEmail({email, verificationToken:user.verificationToken});

    await sendEmail(verifyEmail);
      res.status(200).json({ message: 'Verification email sent' });

}

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        res.status(401).json({ message: 'Email or password wrong' });
        return;
    }
    if (!user.verify) {
        res.status(401).json({ message: 'Email not verify' });
        return;
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
        res.status(401).json({ message: 'Email or password wrong' });
        return;
    }
    const payload = {
        id: user._id,
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, { token })
    
    res.status(200).json({
        token,
        user: {
            email,
            subscription: user.subscription
        }
    })
};

const current = (req, res) => {
    const { email, subscription } = req.user;
    res.json({
        email,
        subscription
    })
};

const logout = async (req, res) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: "" });
    res.status(204).json({ message: "No content" })
};

const updateSubscription = async (req, res) => {
    const { _id } = req.user;
    const { subscription } = req.body;
    const updatingSubscription = await User.findByIdAndUpdate(_id, { subscription: subscription }, { new: true });
    res.json(updatingSubscription);
};

const updateAvatar = async (req, res) => {
    const { file } = req;
    if (!file) {
        res.status(400).json({ message: "Missing files" });
        return
    }
    const { path: oldPath, filename } = req.file;
       
    const tmpPath = path.join("tmp", filename)
    const image = await Jimp.read(tmpPath);
    image.resize(250, 250);
    image.write(tmpPath)
   
    const avatarPath = path.resolve("public", "avatars");
    const newPath = path.join(avatarPath, filename);
       
    await fs.rename(oldPath, newPath);
    const avatarURL = path.join("avatars", filename);
    
    
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { avatarURL: avatarURL }, { new: true });
    
    res.json({ avatarURL: avatarURL })
    
};


export default {
    register,
    verify,
    resendVerifyEmail,
    login,
    current,
    logout,
    updateSubscription,
    updateAvatar
}