import express from "express";
import userValidator from "../../middlewars/userValidator.js";
import isEmptyBody from "../../middlewars/isEmptyBody.js"
import authController from "../../controllers/auth-controller.js";
import authenticate from "../../middlewars/authenticate.js";
import isSubscription from "../../middlewars/isSubscription.js";
import upload from "../../middlewars/upload.js";

const authRouter = express.Router();

authRouter.post('/users/register', isEmptyBody, userValidator.userRegisterValidator, authController.register);

authRouter.get('/users/verify/:verificationToken', authController.verify);

authRouter.post('/users/verify', userValidator.userEmailValidator, authController.resendVerifyEmail);

authRouter.post('/users/login', isEmptyBody, userValidator.userLoginValidator, authController.login);

authRouter.get('/users/current', authenticate, authController.current);

authRouter.post('/users/logout', authenticate, authController.logout);

authRouter.patch('/users', authenticate, isSubscription, authController.updateSubscription);

authRouter.patch('/users/avatars', authenticate, upload.single("avatarURL"), authController.updateAvatar);

export default authRouter;