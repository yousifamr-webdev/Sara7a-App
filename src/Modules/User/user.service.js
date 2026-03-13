import {
  TOKEN_SIGNATURE_Admin_ACCESS,
  TOKEN_SIGNATURE_Admin_REFRESH,
  TOKEN_SIGNATURE_User_ACCESS,
  TOKEN_SIGNATURE_User_REFRESH,
} from "../../../config/config.service.js";
import { TokenType } from "../../Utils/enums/security.enum.js";
import { RoleEnum } from "../../Utils/enums/user.enum.js";
import {
  BadRequestException,
  UnauthorizedException,
} from "../../Utils/response/error.response.js";
import { successResponse } from "../../Utils/response/success.response.js";
import {
  decodeToken,
  generateToken,
  getSignature,
  verifyToken,
} from "../../Utils/security/token.security.js";
import { findById, findByIdAndUpdate } from "./../../DB/database.repository.js";
import UserModel from "./../../DB/Models/user.model.js";
import jwt from "jsonwebtoken";

export const getUserProfile = async (req, res) => {
  const user = req.user;

  return successResponse({
    res,
    statusCode: 200,
    message: "User profile retrieved succesfully.",
    data: { user },
  });
};

export const renewToken = async (req, res) => {
  const user = req.user;

  const { accessSignature } = getSignature(user.role);

  const newAccessToken = generateToken({
    signature: accessSignature,
    options: {
      subject: user._id.toString(),
      audience: [user.role, TokenType.Access],
      expiresIn: 60 * 15,
    },
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Done.",
    data: { newAccessToken },
  });
};

export const uploadProfileImage = async (req, res) => {
  if (!req.file) {
    return BadRequestException({ message: "No file uploaded" });
  }

  const imagePath = req.file.finalPath;

  await findByIdAndUpdate({
    model: UserModel,
    id: req.user._id,
    update: { profilePic: imagePath },
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Image uploaded successfully",
    data: { file: req.file.filename },
  });
};

export const uploadCoverPics = async (req, res) => {
  if (!req.files?.length) {
    return BadRequestException({ message: "No files uploaded" });
  }

  const coverPicsPaths = req.files.map((file) => file.finalPath);

  await findByIdAndUpdate({
    model: UserModel,
    id: req.user._id,
    update: { coverPics: coverPicsPaths },
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Images uploaded successfully",
    data: { files: coverPicsPaths },
  });
};
