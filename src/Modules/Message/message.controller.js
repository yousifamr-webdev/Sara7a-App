import { Router } from "express";
import * as messageService from "./message.service.js";
import localUpload, {
  allowedFileFormats,
} from "./../../Utils/multer/multer.config.js";
import { authentication } from "./../../Middleware/authentication.middleware.js";
import { validation } from "./../../Middleware/validation.middleware.js";
import {
  getMessageByIdSchema,
  sendMessageSchema,
} from "./message.validation.js";

const router = Router();

router.post(
  "/send/:receiverId",
  (req, res, next) => {
    const { authorization } = req.headers;
    if (authorization) {
      const authMiddleware = authentication();

      return authMiddleware(req, res, next);
    }

    next();
  },
  localUpload({
    folderName: "Messages",
    allowedFormat: [...allowedFileFormats.img, ...allowedFileFormats.video],
  }).array("msgAttachments", 5),
  validation(sendMessageSchema),
  messageService.sendMessage,
);

router.get("/all-messages", authentication(), messageService.getAllMessages);

router.get(
  "/:messageId",
  authentication(),
  validation(getMessageByIdSchema),
  messageService.getMsgById,
);

router.delete(
  "/:messageId",
  authentication(),
  validation(getMessageByIdSchema),
  messageService.removeMsg,
);

export default router;
