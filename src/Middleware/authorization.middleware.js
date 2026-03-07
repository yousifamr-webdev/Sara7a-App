import { RoleEnum } from "../Utils/enums/user.enum.js";
import { ForbiddenException } from "../Utils/response/error.response.js";

export const authorization = (roles = [RoleEnum.User]) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ForbiddenException({ message: "Access forbidden." });
    }

    next();
  };
};
