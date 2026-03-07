import { Router } from "express";
import * as userService from "./user.service.js";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { TokenType } from "../../Utils/enums/security.enum.js";
import { authorization } from "../../Middleware/authorization.middleware.js";
import { RoleEnum } from "../../Utils/enums/user.enum.js";
import { upload } from "../../Middleware/multer.middleware.js";

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
  "/upload-profile",
  authentication(),
  upload.single("image"),
  userService.uploadProfileImage,
);

export default router;
