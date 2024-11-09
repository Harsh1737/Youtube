import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    const ownerId = req.user._id
    const playlist = new Playlist({
        name,
        description,
        owner: ownerId
    })
    await playlist.save({validateBeforeSave: true})
    res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", playlist))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const {userId} = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID")
    const playlists = await Playlist.find({owner: userId})
    if (!playlists) throw new ApiError(404, "No playlists found")
    res.json(new ApiResponse(200, "User playlists retrieved successfully", playlists))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")
    res.json(new ApiResponse(200, "Playlist retrieved successfully", playlist))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    const videoIndex = playlist.videos.indexOf(videoId)
    if (videoIndex !== -1) throw new ApiError(400, "Video already in playlist")

    playlist.videos.push(videoId)
    await playlist.save({validateBeforeSave: true})
    res.json(new ApiResponse(200, "Video added to playlist successfully", playlist))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    const videoIndex = playlist.videos.indexOf(videoId)
    if (videoIndex === -1) throw new ApiError(400, "Video not in playlist")

    playlist.videos.splice(videoIndex, 1)
    await playlist.save({validateBeforeSave: true})
    res.json(new ApiResponse(200, "Video removed from playlist successfully", playlist))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")
    
    await playlist.deleteOne()
    res.json(new ApiResponse(200, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    playlist.name = name
    playlist.description = description
    await playlist.save({validateBeforeSave: true})
    res.json(new ApiResponse(200, "Playlist updated successfully", playlist))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
