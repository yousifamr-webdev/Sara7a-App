import { HashEnum } from "../../Utils/enums/security.enum.js";
import {
  compareHash,
  generateHash,
} from "../../Utils/security/hash.security.js";
import UserModel from "./../../DB/Models/user.model.js";
import { create, findOne } from "./../../DB/database.repository.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "./../../Utils/response/error.response.js";
import { successResponse } from "./../../Utils/response/success.response.js";

export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (await findOne({ model: UserModel, filter: { email } }))
    throw ConflictException({ message: "User already exists." });

  const hashedPassword = await generateHash({
    plaintext: password,
    algo: HashEnum.Argon,
  });

  const user = await create({
    model: UserModel,
    data: [{ firstName, lastName, email, password: hashedPassword }],
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "User created successfully.",
    data: { user },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await findOne({ model: UserModel, filter: { email } });

  if (!user) throw NotFoundException({ message: "User not found" });

  const isPasswordValid = await compareHash({
    plaintext: password,
    ciphertext: user.password,
    algo: HashEnum.Argon,
  });

  if (!isPasswordValid)
    throw BadRequestException({ message: "Invalid password." });

  return successResponse({
    res,
    statusCode: 200,
    message: "Login successful",
    data: { user },
  });
};
