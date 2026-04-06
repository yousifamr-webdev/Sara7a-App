import { findById, findOne } from "../DB/database.repository.js";
import UserModel from "../DB/Models/user.model.js";
import { TokenType } from "../Utils/enums/security.enum.js";
import {
  BadRequestException,
  UnauthorizedException,
} from "../Utils/response/error.response.js";
import {
  decodeToken,
  getSignature,
  verifyToken,
} from "../Utils/security/token.security.js";
import * as redisMethods from "../DB/redis.service.js";

export const authentication = (expectedTokenType = TokenType.Access) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;

    const [BearerKey, token] = authorization.split(" ");

    if (BearerKey !== "Bearer") {
      return BadRequestException({ message: "Invalid authentication key." });
    }

    const decodedToken = decodeToken(token);

    const [userRole, tokenType] = decodedToken.aud;

    if (tokenType !== expectedTokenType) {
      return BadRequestException({ message: "Invalid token type." });
    }

    const { accessSignature, refreshSignature } = getSignature(userRole);

    const verifiedToken = verifyToken({
      token: token,
      signature:
        expectedTokenType == TokenType.Access
          ? accessSignature
          : refreshSignature,
    });

    if (
      await redisMethods.get(
        redisMethods.blackListTokenKey({
          userId: verifiedToken.sub,
          tokenId: verifiedToken.jti,
        }),
      )
    ) {
      return UnauthorizedException({ message: "You need to login again." });
    }

    const user = await findById({ model: UserModel, id: verifiedToken.sub });

    if (!user) {
      return UnauthorizedException({ message: "User not found." });
    }

    if (verifiedToken.iat * 100 < user.changeCreditTime) {
      return UnauthorizedException({ message: "You need to login." });
    }

    req.user = user;
    req.tokenPayload = verifiedToken;

    next();
  };
};
