// this middleware is used to verify only if user exists or not for logging out
// bcoz at the time of logout we need some details like user id to logout the user by deleting cookies and tokens (access and refresh)

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => { // here in place of res we can use "_"(underscore) bcoz res is not used in function only req and next is used
    try {
        // here sometimes site is accessed from phone so no cookies in case of phone it sends a header
        // which is generally "Authorization" header which is of format "Authorization: Bearer <token>" here token can be accessToken
        // so to get directly the token we replace "Bearer " with "" so only token is left and we can use it
    
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // if token is not there then throw error
        if (!token) {
            throw new ApiError(401,"Unauthorized request")
        }
        // if token is there then we have to check it using jwt whether it is correct token or not and what values does this token holds
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select
            ("-password -refreshToken")
        // if user is not found then throw error
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        // if user is found then add new object with name "user"
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
        
    }

})
// middleware is always used in routes now go to routes