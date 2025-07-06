import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJwt=asyncHandler(async (req,res,next)=>{
    //get the token from cookie or header
    //check u recive token or not
    // verify the token with jwt
    // return error if token is invalid
    // decode the token
    //create req.user
   try {
     const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","");
    //  console.log("token",token);
     if(!token)
     {
       
         throw new ApiError(401,"Unauthorized Request")
     }
     const decodedToken=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
     const user=await User.findById(decodedToken._id).select("-password -refreshToken");
 
     if(!user)
     {
         throw new ApiError(401,"Invalid Acess Token")
     }
     
     req.user=user
     next()
         
   } catch (error) {
        throw new ApiError(400,error.message||"Invalid token")
   }

})

