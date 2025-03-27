import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import asyncHandler from 'express-async-handler'; // For cleaner error handling

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token. Check to make sure it exists
            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                console.error("User not found in the database for ID:", decoded.id);
                res.status(401).json({ message: "Not authorized, invalid user ID" });
                return;
            }

            // Attach user object
            req.user = user;

            console.log("User after authentication middleware:", req.user); // Debugging
            next();
        } catch (error) {
            console.error("JWT verification error:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
});

// Admin role check
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user" }); // Require user
    }

    if (req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};

// Designer role check
const designer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user" }); // Require user
    }

    if (req.user.role === "designer" || req.user.role === "admin") {  //Admin can also access
        next();
    } else {
        res.status(403).json({ message: "Not authorized as a designer" });
    }
};

// Seller role check
const seller = (req, res, next) => {
     if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user" }); // Require user
    }

    if (req.user.role === "seller" || req.user.role === "admin") {  //Admin can also access
        next();
    } else {
        res.status(403).json({ message: "Not authorized as a seller" });
    }
}

export { protect, admin, designer, seller };