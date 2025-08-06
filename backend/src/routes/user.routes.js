import { Router } from "express";
import {  getCurrentUser, getUserChannelProfile, logInUser, logOutUser, refreshAccessToken, registerUser, updateAccountDetails, updatePassword, updateUserAvatar, updateUserCoverImage } from "../controllers/user.conroller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCapacity:1
        },
        {
            name:"coverImage",
            maxCapacity:1,
        }
]),
    registerUser
)



router.route("/login").post(logInUser)
router.route("/logout").post(verifyJwt,logOutUser)
router.route("/refresh").get(refreshAccessToken)
router.route("/updatePassword").post(verifyJwt,updatePassword)
router.route("/getCurrentUser").get(verifyJwt,getCurrentUser);
router.route("/updateAccountDetails").patch(verifyJwt,updateAccountDetails)
router.route("/updateAvatar").patch(upload.single("avatar"),
verifyJwt,
updateUserAvatar)
router.route("/updateCoverImage").patch(upload.single("coverImage"),
verifyJwt,
updateUserCoverImage)
router.route("/getUserChannelProfile/:username").get(verifyJwt,getUserChannelProfile)

export default router