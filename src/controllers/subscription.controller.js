import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if ( !isValidObjectId(channelId) ) {
        throw new ApiError(400, "Invalid channel id")
    }
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel not found")

    const subscriberId = req.user._id
    const subscription = await Subscription.findOne({subscriber: subscriberId, channel: channelId})
    if (subscription) {
        await subscription.deleteOne()
    } else {
        await Subscription.create({subscriber: subscriberId, channel: channelId})
    }

    return res
    .status(200)
    .json(new ApiResponse(200, `Subscription to ${channel.username} toggled`))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(subscriberId);
    if ( !isValidObjectId(subscriberId) ) throw new ApiError(400, "Invalid subscriber id")
    
    const subscriber = await User.findById(subscriberId)
    if (!subscriber) throw new ApiError(404, "subscriber not found")
    
    const subscribers = await Subscription.find({channel: subscriberId}).populate("subscriber","-password -refreshToken")//.select("subscriber")
    return res
    .status(200)
    .json(new ApiResponse(200, subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if ( !isValidObjectId(channelId) ) throw new ApiError(400, "Invalid channel id")
    
    const channel = await User.findById(channelId)
    if (!channel) throw new ApiError(404, "Channel not found")

    const channels = await Subscription.find({subscriber: channelId}).populate("channel","-password -refreshToken")
    return res
    .status(200)
    .json(new ApiResponse(200, channels))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}