import { Router } from "express";
import * as userService from "./user.service.js";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { TokenType } from "../../Utils/enums/security.enum.js";
import { authorization } from "../../Middleware/authorization.middleware.js";
import { RoleEnum } from "../../Utils/enums/user.enum.js";
import {
  allowedFileFormats,
  localUpload,
} from "../../Utils/multer/multer.config.js";
import { validation } from "./../../Middleware/validation.middleware.js";
import {
  coverPicSchema,
  getPublicProfileSchema,
  profilePicSchema,
} from "./user.validation.js";

const router = Router();

router.get(
  "/:userId",
  authentication(),
  authorization([RoleEnum.Admin]),
  userService.getUserProfile,
);

router.post(
  "/renew-token",
  authentication(TokenType.Refresh),
  userService.renewToken,
);

router.post(
  "/upload-mainPic",
  authentication(),
  localUpload({
    folderName: "User",
    allowedFormat: allowedFileFormats.img,
  }).single("profilePic"),
  validation(profilePicSchema),
  userService.uploadProfileImage,
);

router.post(
  "/upload-coverPics",
  authentication(),
  localUpload({
    folderName: "User",
    allowedFormat: allowedFileFormats.img,
  }).array("coverPics"),
  validation(coverPicSchema),
  userService.uploadCoverPics,
);

router.get(
  "/share-profile/:profileId",
  validation(getPublicProfileSchema),
  userService.getPublicProfile,
);

export default router;
