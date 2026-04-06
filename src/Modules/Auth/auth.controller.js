import { Router } from "express";
import * as authService from "./auth.service.js";
import { successResponse } from "../../Utils/response/success.response.js";
import { validation } from "../../Middleware/validation.middleware.js";
import {
  confirmEmailResendOtpSchema,
  confirmEmailSchema,
  confirmTwoStepLoginSchema,
  confirmTwoStepVerificationSchema,
  forgetPasswordOtpSchema,
  loginSchema,
  resetPasswordOtpSchema,
  signupSchema,
  updatePasswordSchema,
  verifyForgetPasswordOtpSchema,
} from "./auth.validation.js";
import { authentication } from "./../../Middleware/authentication.middleware.js";

const router = Router();

router.post("/signup", validation(signupSchema), authService.signup);

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

router.post(
  "/login-confirmTwoStep",
  validation(confirmTwoStepLoginSchema),
  authService.confirmTwoStepLogin,
);

router.post(
  "/verify-email",
  validation(confirmEmailSchema),
  authService.verifyEmail,
);

router.post(
  "/verify-email-resendOtp",
  validation(confirmEmailResendOtpSchema),
  authService.resendEmailVerificationOTP,
);

router.post(
  "/forget-password",
  validation(forgetPasswordOtpSchema),
  authService.forgetPasswordOTP,
);

router.post(
  "/forget-password-resend",
  validation(verifyForgetPasswordOtpSchema),
  authService.resendForgetPasswordVerificationOTP,
);

router.post(
  "/verify-forget-password",
  validation(verifyForgetPasswordOtpSchema),
  async (req, res) => {
    const result = await authService.verifyForgetPasswordOTP(req.body);
    return successResponse({
      res,
      statusCode: 201,
      message: "Verified successfully.",
    });
  },
);

router.post(
  "/reset-password",
  validation(resetPasswordOtpSchema),
  authService.resetPasswordOTP,
);

router.post("/logout", authentication(), authService.logout);

router.patch(
  "/update-password",
  authentication(),
  validation(updatePasswordSchema),
  authService.updatePassword,
);

router.post(
  "/enable-twoStepVerification",
  authentication(),
  authService.enableTwoStepVerification,
);

router.post(
  "/verify-twoStepVerification",
  authentication(),
  validation(confirmTwoStepVerificationSchema),
  authService.verifyTwoStepOTP,
);

export default router;
