import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "path";
import { existsSync, mkdirSync } from "node:fs";

export const allowedFileFormats = {
  img: ["image/png", "image/jpg"],
  video: ["video/mp4"],
  pdf: ["application/pdf"],
};

export function localUpload({
  folderName = "GeneralFiles",
  allowedFormat = allowedFileFormats.img,
  fileSize = 10,
}) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const fullPath = `./uploads/${folderName}`;
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
      cb(null, path.resolve(fullPath));
    },
    filename: function (req, file, cb) {
      const fileName = randomUUID() + "_" + file.originalname;

      file.finalPath = `uploads/${folderName}/${fileName}`;

      cb(null, fileName);
    },
  });

  function fileFilter(req, file, cb) {
    if (!allowedFormat.includes(file.mimetype)) {
      return cb(
        new Error("invalid format", { cause: { statusCode: 400 } }),
        false,
      );
    }
    return cb(null, true);
  }

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSize * 1024 * 1024 },
  });
}

export default localUpload;
