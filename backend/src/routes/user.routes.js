import { Router } from "express";
import { registerUser } from "../controllers/user.conroller.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router