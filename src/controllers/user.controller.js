import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req , res)=>{

    const {fullName , userName , email , password} =req.body
    console.log(email);

    if(
        [fullName , userName , email , password].some((field)=>(
            field?.trim()==="")
        )){
            throw new ApiError("All fields are required" , 400)
        }
    console.log(userName);
    
    
    const existedUser= await User.findOne({
        $or :[{userName} , {email}]
    })
    console.log(userName);
    

    if(existedUser){
        throw new ApiError(409,"User already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    console.log(req.files.avatar[0]);
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

export {registerUser}