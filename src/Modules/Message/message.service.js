import {
  create,
  deleteOne,
  find,
  findById,
  findOne,
} from "../../DB/database.repository.js";
import UserModel from "../../DB/Models/user.model.js";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../Utils/response/error.response.js";
import { successResponse } from "../../Utils/response/success.response.js";
import MessageModel from "./../../DB/Models/message.model.js";

export const sendMessage = async (req, res) => {
  const { receiverId } = req.params;
  const { content } = req.body;
  const filesData = req.files;
  const senderId = req.user?._id;

  if (!content && !filesData) {
    return BadRequestException({ message: "Message can't be empty." });
  }

  const reciever = findById({ model: UserModel, id: receiverId });

  if (!reciever) {
    return BadRequestException({ message: "Receiver not found." });
  }

  await create({
    model: MessageModel,
    data: {
      content,
      attachments: filesData.map((file) => file.finalPath),
      receiverId,
      senderId,
    },
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Msg was sent successfully.",
  });
};

export const getMsgById = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?._id;

  const msg = await findOne({
    model: MessageModel,
    filter: { _id: messageId, receiverId: userId },
    select: "-senderId",
  });

  if (!msg) {
    return NotFoundException({ message: "Couldn't find message." });
  }

  return successResponse({
    res,
    statusCode: 201,
    message: "Msg was retrieved successfully.",
    data: msg,
  });
};

export const getAllMessages = async (req, res) => {
  const userId = req.user?._id;

  const allMessages = await find({
    model: MessageModel,
    filter: { $or: [{ receiverId: userId }, { senderId: userId }] },
    select: "-senderId",
  });

  if (!allMessages) {
    return NotFoundException({ message: "Couldn't find any messages." });
  }

  return successResponse({
    res,
    statusCode: 201,
    message: "All messages were retrieved successfully.",
    data: allMessages,
  });
};

export const removeMsg = async (req, res) => {
   const { messageId } = req.params;
  const userId = req.user?._id;

  const isDeleted = await deleteOne({
    model: MessageModel,
    filter: {_id:messageId,receiverId:userId},
  });



  if (!isDeleted.deletedCount) {
    return BadRequestException({ message: "Failed to delete message." });
  }

  return successResponse({
    res,
    statusCode: 201,
    message: "Message was deleted successfully.",
  });
};