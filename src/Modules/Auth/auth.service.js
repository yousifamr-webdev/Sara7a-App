import jwt from "jsonwebtoken";
import {
  ENCRYPTION_KEY,
  GOOGLE_CLIENT_ID,
  TOKEN_SIGNATURE_Admin_ACCESS,
  TOKEN_SIGNATURE_Admin_REFRESH,
  TOKEN_SIGNATURE_User_ACCESS,
  TOKEN_SIGNATURE_User_REFRESH,
} from "../../../config/config.service.js";
import { HashEnum, TokenType } from "../../Utils/enums/security.enum.js";
import {
  compareHash,
  generateHash,
} from "../../Utils/security/hash.security.js";
import UserModel from "./../../DB/Models/user.model.js";
import {
  create,
  findOne,
  deleteMany,
  updateOne,
  deleteOne,
} from "./../../DB/database.repository.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "./../../Utils/response/error.response.js";
import { successResponse } from "./../../Utils/response/success.response.js";
import CryptoJS from "crypto-js";
import { ProviderEnum, RoleEnum } from "../../Utils/enums/user.enum.js";
import {
  generateAccessAndRefreshTokens,
  generateToken,
  getSignature,
} from "../../Utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import OtpModel from "../../DB/Models/otp.model.js";
import { sendEmail } from "../../Utils/security/sendEmail.security.js";

export const signup = async (req, res) => {
  const { firstName, lastName, email, password, phone, DOB, gender } = req.vbody;

  if (await findOne({ model: UserModel, filter: { email } }))
    throw ConflictException({ message: "User already exists." });

  const hashedPassword = await generateHash({
    plaintext: password,
    algo: HashEnum.Argon,
  });

  const encryptedPhone = CryptoJS.AES.encrypt(phone, ENCRYPTION_KEY).toString();

  const user = await create({
    model: UserModel,
    data: [
      {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: encryptedPhone,
        DOB,
        gender,
      },
    ],
  });

  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOTP = await generateHash({
      plaintext: otp,
      algo: HashEnum.Argon,
    });

    await deleteMany({ model: OtpModel, filter: { email: user.email } });

    const createOTP = await OtpModel.create({
      email: user.email,
      otp: hashedOTP,
    });

    if (createOTP) {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<h2>Your verification code is ${otp}</h2>
         <p>This code expires in 5 minutes.</p>`,
      });
    }
  }

  return successResponse({
    res,
    statusCode: 201,
    message:
      "User created successfully. Verification code was sent to your email.",
    data: { user },
  });
};

async function verifyGoogleToken(idToken) {
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  return payload;
}

export const login = async (req, res) => {
  const { email, password } = req.vbody;

  const user = await findOne({ model: UserModel, filter: { email } });

  if (!user) throw NotFoundException({ message: "User not found" });

  const isPasswordValid = await compareHash({
    plaintext: password,
    ciphertext: user.password,
    algo: HashEnum.Argon,
  });

  if (!isPasswordValid)
    throw BadRequestException({ message: "Invalid password." });

  const bytes = CryptoJS.AES.decrypt(user.phone, ENCRYPTION_KEY);

  const originalPhone = bytes.toString(CryptoJS.enc.Utf8);

  user.phone = originalPhone;

  const { access_token, refresh_token } = generateAccessAndRefreshTokens({
    role: user.role,
    sub: user._id,
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Login successful",
    data: { access_token, refresh_token },
  });
};

export async function loginWithGoogle(idToken) {
  const payload = await verifyGoogleToken(idToken);

  if (!payload.email_verified) {
    return BadRequestException({ message: "Email must be verified." });
  }

  const user = await findOne({
    model: UserModel,
    filter: { email: payload.email },
  });

  if (!user) {
    return signupWithGmail(idToken);
  }

  const { access_token, refresh_token } = generateAccessAndRefreshTokens({
    role: user.role,
    sub: user._id,
  });

  return {
    statusCode: 200,
    message: "Login successful",
    data: { access_token, refresh_token },
  };
}

export async function signupWithGmail(idToken) {
  const payload = await verifyGoogleToken(idToken);

  if (!payload.email_verified) {
    return BadRequestException({ message: "Email must be verified." });
  }

  const user = await findOne({
    model: UserModel,
    filter: { email: payload.email },
  });

  if (user) {
    if (user.provider === ProviderEnum.System) {
      return BadRequestException({
        message:
          "Account already exists. Please login with your email and password.",
      });
    }
    return loginWithGoogle(idToken);
  }

  const [firstName, lastName] = payload.name.split(" ");

  const newUser = await create({
    model: UserModel,
    data: {
      email: payload.email,
      firstName: payload.given_name || firstName,
      lastName: payload.family_name || lastName,
      profilePic: payload.picture,
      confirmEmail: true,
      provider: ProviderEnum.Google,
    },
  });

  if (newUser) {
    const login = await loginWithGoogle(idToken);
    return login;
  }

  return {
    statusCode: 201,
    message: "User created successfully.",
    data: { newUser },
  };
}

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  const otpDoc = await findOne({ model: OtpModel, filter: { email } });

  if (!otpDoc) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }

  const isOTPValid = await compareHash({
    plaintext: otp,
    ciphertext: otpDoc.otp,
    algo: HashEnum.Argon,
  });

  if (!isOTPValid) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }

  await updateOne({
    model: UserModel,
    filter: { email },
    update: { confirmEmail: true },
  });

  await deleteOne({ model: OtpModel, filter: { _id: otpDoc._id } });

  return successResponse({
    res,
    statusCode: 200,
    message: "Email verified successfully",
  });
};

