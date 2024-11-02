import { Router } from 'express';
import { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUserProfile,
    updateUserProfile,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory, } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
// console.log(Router);
// console.log(router);
router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser);
router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken); // verifyJWT is not required here
router.route("/change-password").post(verifyJWT,changePassword);
router.route("/profile").get(verifyJWT,getUserProfile);
router.route("/update-profile").patch(verifyJWT,updateUserProfile);
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
router.route("/channel/:username").get(getUserChannelProfile);  // username should be same bcs, we are using it in the controller
router.route("/watch-history").get(verifyJWT,getWatchHistory);


export default router;