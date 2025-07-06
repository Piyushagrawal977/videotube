import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import validator from "validator"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"


const options={
        httpOnly:true,
        secure:true
    }

const generateAccessAndRefreshToken=async(userId)=>{
   try {
    console.log("user",userId)
    const user= await User.findById(userId);
       console.log("User",user);
     const accessToken=user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()

  
 
     user.refreshToken=refreshToken      // saving refresh token on backend
     await user.save({validateBeforeSave:false})   
 
     return {accessToken,refreshToken}
   } catch (error) {
        throw new ApiError(500,error||"Error Generating refresh and access Token")
   }
}

const registerUser=asyncHandler(async (req,res)=>{


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

    
    const existedUser= await User.findOne(
        {
            $or: [{userName},{email}]
        }
    )
  

    if(existedUser){
        throw new ApiError(409,"User with the given email or username already exists")
       
    }

    
    // const avatarLocalPath=req.files?.avatar[0]?.path;
    // const  coverImageLocalPath=req.files?.coverImage[0]?.path;

    
    let avatarLocalPath,coverImageLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0)
    {
        avatarLocalPath=req.files.avatar[0].path
    }

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path
    }

    
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
        userName:userName.toLowerCase(),
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
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
        new ApiResponse(createdUser,200,"User Registered Successfully")
    )
    


})

const logInUser=asyncHandler(async (req,res)=>{
    // get the username or email and password from user
    // check user send username or email
    // check on db whether it is exist or not
    // check the password
    // generate the refresh and access token
    // return the access token

    const {userName,email,password}=req.body;


    if(!userName && !email)
    {
        throw new ApiError(400,"Username or Email is required")
    }

    const existedUser= await User.findOne(
        {
            $or: [{userName},{email}]
        }
    )
    if(!existedUser)
    {
        throw new ApiError(404, "User doesn't exist");
    }

    const isPasswordValid= await existedUser.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401,"Invalid user Credentials")
    }

    const {refreshToken,accessToken} = await generateAccessAndRefreshToken(existedUser._id);

    const loggedInUser=await User.findById(existedUser._id).select("-password -refreshToken");

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse({user: loggedInUser,accessToken,refreshToken},200,"User Logged In Successfully")
    )


})

const logOutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:refreshToken=undefined
        },
        {
            new:true
        }
    )

    return res
    .status(200)
    .clearCookie(accessToken,options)
    .clearCookie(refreshToken,options)
    .json(new ApiResponse({},200,"User Logout"))
})

export {
    registerUser,
    logInUser,
    logOutUser
};