import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    // if userId is provided, get all videos by that user
    // if query is provided, search for videos with that query ( title or description )
    // if sortBy is provided, sort the videos by that field
    // if sortType is provided, sort the videos in that order ( asc or desc )
    // if page and limit are provided, paginate the results

    const match = {}
    if (userId) {
        match.owner = userId;
    }
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    const sort = {}
    if (sortBy) {
        sort[sortBy] = sortType === "asc" ? 1 : -1;
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
    }
    const videos = await Video.aggregatePaginate(Video.aggregate([
        {
            $match: match
        }
    ]), options)

    return res.
    status(200).
    json(new ApiResponse(200, videos));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const videoFile = req.files?.videoFile[0].path;
    const thumbnail = req.files?.thumbnail[0].path;
    const uploadedThumbnail = await uploadOnCloudinary(thumbnail);
    const uploadedVideo = await uploadOnCloudinary(videoFile);

    if (!uploadedThumbnail || !uploadedVideo) throw new ApiError(500, "Error in uploading file on cloudinary");

    const video = await Video.create({
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        title,
        description,
        duration: uploadedVideo.duration,
        owner: req.user._id
    })
    return res.
    status(201).
    json(new ApiResponse(201, video));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) throw new ApiError(400, "Video id is required");

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found");

    return res.
    status(200).
    json(new ApiResponse(200, video));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found");

    const thumbnail = req.file?.path;
    if ( thumbnail ) {
        await deleteFromCloudinary(video.thumbnail);
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail)
        if (!uploadedThumbnail) throw new ApiError(500, "Error in uploading thumbnail on cloudinary");
        video.thumbnail = uploadedThumbnail.url;
        video.publicId = uploadedThumbnail.public_id;
    }

    if (req.body.title) video.title = req.body.title;
    if (req.body.description) video.description = req.body.description;

    await video.save({validateBeforeSave: true});
    return res.
    status(200).
    json(new ApiResponse(200, video));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found");
    console.log(video);
    
    const deletedVideoFromCloudinary = await deleteFromCloudinary(video.videoFile);
    const deletedThumbnailFromCloudinary = await deleteFromCloudinary(video.thumbnail);
    if ( !deletedThumbnailFromCloudinary) throw new ApiError(500, "Err in deleting img");
    if ( !deletedVideoFromCloudinary ) throw new ApiError(500, "Err in deleting video");
    // if (!deletedVideoFromCloudinary || !deletedThumbnailFromCloudinary ) throw new ApiError(500, "Error in deleting from cloudinary");
    const deletedVideoFromDB = await video.deleteOne( { _id : videoId } )
    if (!deletedVideoFromDB) throw new ApiError(500, "Error in deleting video from database");

    return res.
    status(200).
    json(new ApiResponse(200, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    video.isPublished = !video.isPublished;
    await video.save({validateBeforeSave: true});

    return res.
    status(200).
    json(new ApiResponse(200, `Video ${video.isPublished ? "published" : "unpublished"} successfully`)
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}