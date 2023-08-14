import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();
const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
    const { authorization = ""} = req.headers;
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer") {
        res.status(401).json({ message: `Not authorized` });
        return;
    }
    try {
        const { id } = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(id);
       
        if (!user || !user.token) {
            res.status(401).json({ message: `Not authorized` });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: `Not authorized` });
        return;
    }
}

export default authenticate;