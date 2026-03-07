import { Router } from "express";
import * as authService from "./auth.service.js";
import { successResponse } from "../../Utils/response/success.response.js";


const router = Router();

router.post("/signup", authService.signup);

router.post("/signup/gmail", async (req, res) => {
  const result = await authService.signupWithGmail(req.body.idToken);
  return successResponse({
    res,
    statusCode: result.statusCode,
    message: result.message,
    data: result.data,
  });
});

router.post("/login", authService.login);

router.post("/verify-email", authService.verifyEmail);



export default router;
