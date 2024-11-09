import mongoose, { get } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user?._id;
    if (!channelId) throw new ApiError(400, "Channel ID is required");

    const totalVideos = await Video.countDocuments({owner: channelId});
    const totalSubscribers = await Subscription.countDocuments({channel: channelId});
    const totalLikes = await Like.countDocuments({owner: channelId});
    const totalViews = await Video.aggregate([
        {
            $match: {owner: new mongoose.Types.ObjectId(channelId)}
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"}
            }
        }
    ]);
    
    const resp = {
        totalVideos,
        totalSubscribers,
        totalLikes,
        totalViews: totalViews.length > 0 ? totalViews[0].totalViews : 0
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {message: "Channel stats fetched successfully"}, resp));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user?._id;
    
    if (!channelId) throw new ApiError(400, "Channel ID is required");

    const videos = await Video.find({owner: channelId}).sort
    ({createdAt: -1}).select("-__v -owner");

    return res
    .status(200)
    .json(new ApiResponse(200, {message: "Channel videos fetched successfully"},videos));
})

export {
    getChannelStats, 
    getChannelVideos
    }