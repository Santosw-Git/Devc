import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    console.log(content);
    

    if(!content){
        throw new APError(400, "Content is required")
    }

    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(400, "User is Unathorized")
    }

    const tweet = await Tweet.create({
        content,
        owner : user._id
    })

    if(!tweet){
        throw new ApiError(400, "Something went wrong while creating tweet")
    }

    return res.status(200).
    json(new ApiResponse(200, tweet,"Tweet created successfully"))


        

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    
}