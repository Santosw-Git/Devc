import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token);
        
    
        if(!token){
            throw new Error("User is not authorized", 401)
    
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken);
        
    
        const user = await User.findById(decodedToken?._id).select(
            "-password,-refreshToken")
        
        if(!user){
            throw new Error("Invalid Access Token", 404)
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invaild Access Token")
            
    }
})
