import {
  TOKEN_SIGNATURE_Admin_ACCESS,
  TOKEN_SIGNATURE_Admin_REFRESH,
  TOKEN_SIGNATURE_User_ACCESS,
  TOKEN_SIGNATURE_User_REFRESH,
} from "../../../config/config.service.js";
import { TokenType } from "../enums/security.enum.js";
import { RoleEnum } from "../enums/user.enum.js";
import jwt from "jsonwebtoken";

export const getSignature = (role = RoleEnum.User) => {
  let accessSignature = "";
  let refreshSignature = "";
  switch (role) {
    case RoleEnum.User:
      accessSignature = TOKEN_SIGNATURE_User_ACCESS;
      refreshSignature = TOKEN_SIGNATURE_User_REFRESH;
      break;
    case RoleEnum.Admin:
      accessSignature = TOKEN_SIGNATURE_Admin_ACCESS;
      refreshSignature = TOKEN_SIGNATURE_Admin_REFRESH;
      break;
  }

  return { accessSignature, refreshSignature };
};

export const generateToken = ({ payload = {}, signature, options = {} }) => {
  return jwt.sign(payload, signature, options);
};
export const verifyToken = ({ token, signature }) => {
  return jwt.verify(token, signature);
};
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export const generateAccessAndRefreshTokens = ({ role, sub }) => {
  const { accessSignature, refreshSignature } = getSignature(role);

  const access_token = generateToken({
    signature: accessSignature,
    options: {
      subject: sub.toString(),
      audience: [role, TokenType.Access],
      expiresIn: 60 * 15,
    },
  });

  const refresh_token = generateToken({
    signature: refreshSignature,
    options: {
      subject: sub.toString(),
      audience: [role, TokenType.Refresh],
      expiresIn: "1y",
    },
  });

  return { access_token, refresh_token };
};
