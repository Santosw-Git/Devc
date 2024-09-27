import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async (userId)=>{
    try {

        const user = await User.findById(userId)
        console.log(user);
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        console.log(refreshToken);
        
        //adding refresh token to database
        user.refreshToken = refreshToken
        
        await user.save({validateBeforeSave : false})
        
        

        return {accessToken , refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
        
    }
}

const registerUser = asyncHandler( async (req , res)=>{


    const {fullName , userName , email , password} =req.body
    // console.log(email);

    if(
        [fullName , userName , email , password].some((field)=>(
            field?.trim()==="")
        )){
            throw new ApiError("All fields are required" , 400)
        }
    // console.log(userName);
    
    
    const existedUser= await User.findOne({
        $or :[{userName} , {email}]
    })
    // console.log(userName);
    2

    if(existedUser){
        throw new ApiError(409,"User already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // console.log(req.files.avatar[0]);
    const coverImageLocalPath=req.files?.coverImage?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400,"LocalPath is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName : userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )    
})

const loginUser = asyncHandler( async (req , res)=>{
    const {userName,email,password} = req.body;

    if(!(userName || email)){
        throw new ApiError("Username or email is required" , 400)
    }

    const user = await User.findOne({
        $or :[{userName} , {email}]
    })

    if(!user){
        throw new ApiError("User not found" , 404)
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError("Incorrect password" , 400)
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly :true,
        secure : true,
    }

    return res.status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully")
    )
})

const logoutUser = asyncHandler(async(req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set :
            {
                refreshToken : undefined,
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly :true,
        secure : true,
    }

    return res.status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(new ApiResponse (200 , {} , "User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unathorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id)
        
        if(!user) {
            throw new ApiError(401,"Invalid RefreshToken ")
        }
    
        if(incomingRefreshToken!==user.refreshToken) {
            throw new ApiError(401,"Invalid RefreshToken ")
        }
    
        const options = {
            httpOnly: true,
            secure : true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res.status(200).
        cookie("accessToken",accessToken,options).
        cookie("refreshToken",newRefreshToken,options).
        json(new ApiResponse(200 , {accessToken,newRefreshToken} ,
             "Access token refreshed successfully"))
    
    
    
    
    
    } catch (error) {
        throw new ApiError(401,error.message||"unathorized request")
        
    }


})

const changeCurrentPassword = asyncHandler(async(req,res) => {

    const {currentPassword , newPassword,changeCurrentPassword} = req.body

    if(newPassword !== changeCurrentPassword){
        throw new ApiError(400,"Password doesn't match")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Current password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200).
    json(new ApiResponse(200 , {} , "Password changed successfully"))


})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200)
    .json(new ApiResponse(
        200 ,
        req.user , 
        "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async(req,res) => {

    const {email,fullName} = req.body

    if(!(email || fullName)){
        throw new ApiError(400, "Email or Full name is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                email:email,
                fullName:fullName,
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200 , user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    
    const avatarLocalPath =req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400 , "AvatarLocalPath is not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400 , "Error While uploading avatar in cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200 , user , "Avatar updated successfully"))


})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    
    const coverImageLocalPath =req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400 , "coverImageLocalPath is not found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400 , "Error While uploading coverImage in cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200 , user , "coverImage updated successfully"))


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
}