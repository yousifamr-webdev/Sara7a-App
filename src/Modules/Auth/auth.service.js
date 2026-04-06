import {
  ENCRYPTION_KEY,
  GOOGLE_CLIENT_ID,
} from "../../../config/config.service.js";
import { HashEnum, RequestType } from "../../Utils/enums/security.enum.js";
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
import { ProviderEnum } from "../../Utils/enums/user.enum.js";
import { generateAccessAndRefreshTokens } from "../../Utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../../Utils/email/email.config.js";
import { encryptValue } from "./../../Utils/security/encrypt.security.js";
import * as redisMethods from "../../DB/redis.service.js";
import { generateOTP } from "../../Utils/OTP/otp.service.js";
import { EmailEnum } from "../../Utils/enums/email.enum.js";

async function sendEmailOtp({ email, emailType, subject }) {
  const prevOtpTTL = await redisMethods.ttl(
    redisMethods.getOTPKey({
      email,
      otpType: emailType,
    }),
  );

  if (prevOtpTTL > 0) {
    return BadRequestException(
      `You must wait ${prevOtpTTL} seconds before sending another request.`,
    );
  }

  const isBlocked = await redisMethods.exists(
    redisMethods.getOTPBlockedStatusKey({
      email,
      otpType: emailType,
    }),
  );

  if (isBlocked) {
    return BadRequestException(
      `You reached max limit of requests please try again later.`,
    );
  }

  const otp = generateOTP();

  const hashedOTP = await generateHash({
    plaintext: otp,
    algo: HashEnum.Argon,
  });

  const createOTP = await redisMethods.set({
    key: redisMethods.getOTPKey({
      email,
      otpType: emailType,
    }),
    value: hashedOTP,
    exValue: 300,
  });

  await redisMethods.incr(
    redisMethods.getOTPReqNoKey({
      email,
      otpType: emailType,
    }),
  );

  const reqNo = await redisMethods.get(
    redisMethods.getOTPReqNoKey({
      email,
      otpType: emailType,
    }),
  );

  if (reqNo == 5) {
    await redisMethods.set({
      key: redisMethods.getOTPBlockedStatusKey({
        email,
        otpType: emailType,
      }),
      value: 1,
      exValue: 300 * 2,
    });
  }

  if (createOTP) {
    await sendEmail({
      to: email,
      subject,
      html: `<h2>Your verification code is ${otp}</h2>
         <p>This code expires in 5 minutes.</p>`,
    });
  }
}

export const signup = async (req, res) => {
  const { firstName, lastName, email, password, phone, DOB, gender } =
    req.vbody;

  if (await findOne({ model: UserModel, filter: { email } }))
    throw ConflictException({ message: "User already exists." });

  const hashedPassword = await generateHash({
    plaintext: password,
    algo: HashEnum.Argon,
  });

  const encryptedPhone = encryptValue({ value: phone });
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
    const otp = generateOTP();

    const hashedOTP = await generateHash({
      plaintext: otp,
      algo: HashEnum.Argon,
    });

    const createOTP = await redisMethods.set({
      key: redisMethods.getOTPKey({
        email: user.email,
        otpType: EmailEnum.confirmEmail,
      }),
      value: hashedOTP,
      exValue: 300,
    });

    await redisMethods.set({
      key: redisMethods.getOTPReqNoKey({
        email: user.email,
        otpType: EmailEnum.confirmEmail,
      }),
      value: 1,
      exValue: 300 * 5,
    });

    if (createOTP) {
      await sendEmail({
        to: user.email,
        subject: EmailEnum.confirmEmail,
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

  const user = await findOne({
    model: UserModel,
    filter: { email, confirmEmail: true },
  });

  if (!user)
    throw NotFoundException({
      message: "User not found or email not confirmed.",
    });

  const blockedTTL = await redisMethods.ttl(
    redisMethods.getOTPBlockedStatusKey({
      email,
      otpType: RequestType.Login,
    }),
  );

  if (blockedTTL > 0) {
    return BadRequestException(
      `You reached max limit of requests please try again in ${blockedTTL}.`,
    );
  }

  await redisMethods.incr(
    redisMethods.getOTPReqNoKey({
      email: user.email,
      otpType: RequestType.Login,
    }),
  );

  const reqNo = await redisMethods.get(
    redisMethods.getOTPReqNoKey({
      email,
      otpType: RequestType.Login,
    }),
  );

  if (reqNo == 5) {
    await redisMethods.set({
      key: redisMethods.getOTPBlockedStatusKey({
        email,
        otpType: RequestType.Login,
      }),
      value: 1,
      exValue: 300,
    });
  }

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

  if (user.twoStepVerification) {
    await sendEmailOtp({
      email: user.email,
      emailType: RequestType.Login,
      subject: "2-Step-Login",
    });

    return successResponse({
      res,
      statusCode: 200,
      message: "Check your inbox.",
    });
  }

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

export const confirmTwoStepLogin = async (req, res) => {
  const { email, otp } = req.vbody;

  const otpDoc = await redisMethods.get(
    redisMethods.getOTPKey({
      email,
      otpType: RequestType.Login,
    }),
  );

  if (!otpDoc) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }

  const isOTPValid = await compareHash({
    plaintext: otp,
    ciphertext: otpDoc,
    algo: HashEnum.Argon,
  });

  if (!isOTPValid) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }

  const user = await findOne({ model: UserModel, filter: { email } });

  const { access_token, refresh_token } = generateAccessAndRefreshTokens({
    role: user.role,
    sub: user._id,
  });

  await redisMethods.del(
    redisMethods.getOTPKey({
      email,
      otpType: RequestType.Login,
    }),
  );

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

  const otpDoc = await redisMethods.get(
    redisMethods.getOTPKey({
      email,
      otpType: EmailEnum.confirmEmail,
    }),
  );

  if (!otpDoc) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }

  const isOTPValid = await compareHash({
    plaintext: otp,
    ciphertext: otpDoc,
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
    update: { confirmEmail: true, $unset: { confirmEmailExpires: 1 } },
  });

  await redisMethods.del(
    redisMethods.getOTPKey({
      email: email,
      otpType: EmailEnum.confirmEmail,
    }),
  );

  return successResponse({
    res,
    statusCode: 200,
    message: "Email verified successfully",
  });
};

export const resendEmailVerificationOTP = async (req, res) => {
  const { email } = req.body;

  const user = await findOne({
    model: UserModel,
    filter: { email, confirmEmail: false },
  });

  if (!user) {
    return BadRequestException("Email doesn't exist or already verified.");
  }

  await sendEmailOtp({
    email,
    emailType: EmailEnum.confirmEmail,
    subject: "Confirm your Email",
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Verification code was sent to your email.",
  });
};

export const resendForgetPasswordVerificationOTP = async (req, res) => {
  const { email } = req.body;

  await sendEmailOtp({
    email,
    emailType: EmailEnum.forgetPassword,
    subject: "Reset Password",
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Verification code was sent to your email.",
  });
};

export const forgetPasswordOTP = async (req, res) => {
  const { email } = req.body;

  const user = await findOne({ model: UserModel, filters: { email } });

  if (!user) {
    return;
  }

  if (!user.confirmEmail) {
    return BadRequestException({
      message: "Please confirm your email first.",
    });
  }

  await sendEmailOtp({
    email,
    emailType: EmailEnum.forgetPassword,
    subject: "Reset your password",
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Check your email.",
  });
};

export async function verifyForgetPasswordOTP(bodyData) {
  const { email, otp } = bodyData;

  const emailOTP = await redisMethods.get(
    redisMethods.getOTPKey({ email, otpType: EmailEnum.forgetPassword }),
  );

  if (!emailOTP) {
    return BadRequestException({
      message: "OTP Expired.",
    });
  }

  const isOTPValid = await compareHash({
    plaintext: otp,
    ciphertext: emailOTP,
    algo: HashEnum.Argon,
  });

  if (!isOTPValid) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }
}

export const resetPasswordOTP = async (req, res) => {
  const { email, password, otp } = req.body;

  await verifyForgetPasswordOTP({ email, otp });

  await updateOne({
    model: UserModel,
    filter: { email },
    update: {
      password: await generateHash({
        plaintext: password,
        algo: HashEnum.Argon,
      }),
    },
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Your password was reset successfully.",
  });
};

export const logout = async (req, res) => {
  const userId = req.user._id;
  const tokenData = req.tokenPayload;
  const logoutOptions = req.body.logoutOptions;

  if (logoutOptions === "all") {
    await updateOne({
      model: UserModel,
      filter: { _id: userId },
      data: { changeCreditTime: new Date() },
    });
  } else {
    await redisMethods.set({
      key: redisMethods.blackListTokenKey({
        userId: userId,
        tokenId: tokenData.jti,
      }),
      value: tokenData.jti,
      exValue: 60 * 60 * 24 * 365 - (Date.now() / 1000 - tokenData.iat),
    });
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "Logout successful",
  });
};

export const updatePassword = async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  const user = req.user;

  const isOldPassValid = await compareHash({
    plaintext: oldPassword,
    ciphertext: user.password,
    algo: HashEnum.Argon,
  });

  if (!isOldPassValid) {
    return BadRequestException({
      message: "Your old password is incorrect.",
    });
  }

  await updateOne({
    model: UserModel,
    filter: { _id: user._id },
    update: {
      password: await generateHash({
        plaintext: newPassword,
        algo: HashEnum.Argon,
      }),
      changeCreditTime: new Date(),
    },
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Password updated succesfully. Please login.",
  });
};

export const enableTwoStepVerification = async (req, res) => {
  const user = req.user;

  if (user.twoStepVerification) {
    return BadRequestException({
      message: "2-Step-Verification is already enabled.",
    });
  }

  await sendEmailOtp({
    email: user.email,
    emailType: RequestType.EnableTwoStep,
    subject: "Enable Two Step Verification",
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Check your inbox.",
  });
};

export const verifyTwoStepOTP = async (req, res) => {
  const user = req.user;
  const { otp } = req.vbody;

  const activationOTP = await redisMethods.get(
    redisMethods.getOTPKey({
      email: user.email,
      otpType: RequestType.EnableTwoStep,
    }),
  );

  if (!activationOTP) {
    return BadRequestException({
      message: "OTP Expired.",
    });
  }

  const isOTPValid = await compareHash({
    plaintext: otp,
    ciphertext: activationOTP,
    algo: HashEnum.Argon,
  });

  if (!isOTPValid) {
    return BadRequestException({
      message: "Invalid or expired OTP",
    });
  }

  const result = await updateOne({
    model: UserModel,
    filter: { _id: user._id },
    update: { twoStepVerification: true, changeCreditTime: new Date() },
  });

  console.log(result);

  await redisMethods.del(
    redisMethods.getOTPKey({
      email: user.email,
      otpType: RequestType.EnableTwoStep,
    }),
  );

  return successResponse({
    res,
    statusCode: 201,
    message: "2-Step-Verification enabled succesfully. Please login.",
  });
};
