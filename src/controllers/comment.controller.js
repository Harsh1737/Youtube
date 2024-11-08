import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const options = {
        page : parseInt(page, 10),
        limit: parseInt(limit, 10),
    }
    const query = [{ $match: { video: new mongoose.Types.ObjectId(videoId) } }]
    const comments = await Comment.aggregatePaginate(Comment.aggregate(query), options)
    return res
    .status(200)
    .json(new ApiResponse(comments));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!videoId) throw new ApiError(400, "Video ID is required");
    if (!content) throw new ApiError(400, "Comment content is required");
    
    const comment = await Comment({
        content,
        video: videoId,
        owner: req.user._id,
    })

    await comment.save({ validateBeforeSave: true });

    return res.
    status(200)
    .json(new ApiResponse(200,comment));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    if (!commentId) throw new ApiError(400, "Comment ID is required");
    if (!content) throw new ApiError(400, "Comment content is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    comment.content = content;
    await comment.save({ validateBeforeSave: true });

    return res
    .status(200)
    .json(new ApiResponse(200, comment));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if (!commentId) throw new ApiError(400, "Comment ID is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    await comment.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment,
}