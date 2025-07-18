import { Router } from "express";
import {  logInUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.conroller.js";
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
export default router