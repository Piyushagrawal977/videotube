import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import validator from "validator"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser=asyncHandler(async (req,res)=>{

    // res.status(200).json({
    //     message:"ok"
    // }) 

    // get data from the frontend
    // validate the data 
    // check if the user existed or not
    // collect the image, avtar and coverImage
    // upload to cloudinary, avtar and coverImage
    // create the user 
    // make a entry on db
    // remove password and refresh token from resp
    // return response

    const {fullName,email,password,userName}=req.body;

    if(
        [fullName,email,password,userName].some((field)=>field===undefined)
    )
    {
        throw new ApiError(400,"All fields are required")
    }

    if(
        [fullName,email,password,userName].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(422,"All fields must be filed")
    }

    if(!validator.isEmail(email))
    {
        throw new ApiError(422,"Invalid Email Id")
    }

    const existedUser=User.findOne(
        {
            $or: [{userName},{email}]
        }
    )

    if(existedUser){
        throw new ApiError(409,"user With email or username already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const  coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {{
        throw new ApiError(400,"Avatar file is required")
    }
}

    const user = await User.create({
        userName:userName.tolowerCase(),
        fullName,
        avatar:avatar.url,
        coverImage:coverImage.url ?? "",
        email,
        password


    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registrating user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
    


})

export {registerUser};