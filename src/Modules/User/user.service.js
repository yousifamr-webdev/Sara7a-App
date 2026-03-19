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
import { decryptValue } from "../../Utils/security/encrypt.security.js";
import {
  decodeToken,
  generateToken,
  getSignature,
  verifyToken,
} from "../../Utils/security/token.security.js";
import {
  findById,
  findByIdAndUpdate,
  findOne,
} from "./../../DB/database.repository.js";
import UserModel from "./../../DB/Models/user.model.js";
import { unlinkSync, existsSync } from "node:fs";
import path from "node:path";

export const getUserProfile = async (req, res) => {
  const { userId } = req.params;

  const user = await findById({ model: UserModel, id: userId });

  if (user.phone) {
    user.phone = decryptValue({ cipherText: user.phone });
  }

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

  const user = await findById({ model: UserModel, id: req.user._id });

  const imagePath = req.file.finalPath;

  await findByIdAndUpdate({
    model: UserModel,
    id: req.user._id,
    update: { profilePic: imagePath, $push: { gallery: user.profilePic } },
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
  const user = await findById({ model: UserModel, id: req.user._id });
  const existingPicCount = user.coverPics.length;
  const newPicCount = req.files.length;

  if (existingPicCount + newPicCount > 2) {
    req.files.forEach((file) => {
      unlinkSync(file.finalPath);
    });

    return BadRequestException({ message: "Max 2 cover pics allowed." });
  }

  const coverPicsPaths = req.files.map((file) => file.finalPath);

  await findByIdAndUpdate({
    model: UserModel,
    id: req.user._id,
    update: { $push: { coverPics: coverPicsPaths } },
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Images uploaded successfully",
    data: { files: coverPicsPaths },
  });
};

export const getPublicProfile = async (req, res) => {
  const { profileId } = req.params;
  const user = await findById({
    model: UserModel,
    id: profileId,
    select:
      "-password -role -confirmEmail -provider -createdAt -updatedAt -__v",
  });

  if (user.phone) {
    user.phone = decryptValue({ cipherText: user.phone });
  }

  await findByIdAndUpdate({
    model: UserModel,
    id: profileId,
    update: { visitCount: user.visitCount + 1 },
  });

  const { visitCount, ...publicUserData } = user.toObject();

  return successResponse({
    res,
    statusCode: 200,
    message: "User profile retrieved succesfully.",
    data: { publicUserData },
  });
};

export const deleteProfilePic = async (req, res) => {
  const filePath = path.join(process.cwd(), req.user.profilePic);

  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "Your profile pic was removed successfully",
  });
};
