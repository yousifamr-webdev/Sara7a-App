import connectDB from "./DB/connections.js";
import { authRouter, userRouter } from "./Modules/index.js";
import {
  globalErrorHandler,
  NotFoundException,
} from "./Utils/response/error.response.js";
import { successResponse } from "./Utils/response/success.response.js";
import cors from "cors";

const bootstrap = async (app, express) => {
  app.use(express.json(), cors());

  await connectDB();


  app.use("/auth", authRouter);

  app.use("/user", userRouter);

  app.all("/*dummy", (req, res) => {
    return NotFoundException({ message: "Handler not found." });
  });

  app.use(globalErrorHandler);
};

export default bootstrap;
