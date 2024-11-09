import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, "User not found")
    
    const tweet = new Tweet({
        content,
        owner: req.user._id
    })
    await tweet.save()
    res.status(201).json(new ApiResponse(201, tweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const user = await User.findById(userId)
    if (!user) throw new ApiError(404, "User not found");

    const tweets = await Tweet.find({owner: userId})
    res.status(200).json(new ApiResponse(200, tweets))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    if (!content) throw new ApiError(400, "Content is required");
    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {content}
    }, {new: true})
    if (!tweet) throw new ApiError(404, "Tweet not found");

    res.status(200).json(new ApiResponse(200, tweet))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet    
    const { tweetId } = req.params
    if(!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");

    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");
    return res.json(new ApiResponse(204,"Tweet deleted successfully", tweet))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}