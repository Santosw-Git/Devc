
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
       
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body
    console.log(title, description);
    
    
    if(!(title)){
        throw new ApiError(400, "Title is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    // console.log(videoLocalPath);
    

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is not found")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    // console.log(thumbnailLocalPath);
    

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is not found")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    // console.log("Cloudinary: ", videoFile, thumbnail);
    

    if(!videoFile){
        throw new ApiError(500, "Something went wrong while uploading video in cloudinary")
    }

    if(!thumbnail){
        throw new ApiError(500, "Something went wrong while uploading thumbnail in cloudinary")
    }

    const user = await User.findById(req.user?._id)
    console.log(user);
    

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const video = await Video.create({
        title,
        description,
        videoFile : videoFile?.url,
        thumbnail : thumbnail?.url,
        owner : user._id,

    })

    if(!video){
        throw new ApiError(500, "Something went wrong while creating video in Database")
    }

    return res.status(200).
    json(new ApiResponse(200, video,"Video created successfully"))





    









})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
