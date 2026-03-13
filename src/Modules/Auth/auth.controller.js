import { Router } from "express";
import * as authService from "./auth.service.js";
import { successResponse } from "../../Utils/response/success.response.js";
import { validation } from "../../Middleware/validation.middleware.js";
import { loginSchema, signupSchema } from "./auth.validation.js";


const router = Router();

router.post(
  "/signup",
  validation(signupSchema),
  authService.signup,
);

router.post("/signup/gmail", async (req, res) => {
  const result = await authService.signupWithGmail(req.body.idToken);
  return successResponse({
    res,
    statusCode: result.statusCode,
    message: result.message,
    data: result.data,
  });
});

router.post("/login", validation(loginSchema), authService.login);

router.post("/verify-email", authService.verifyEmail);

export default router;
