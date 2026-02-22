import connectDB from "./DB/connections.js";
import { authRouter, userRouter } from "./Modules/index.js";
import {
  globalErrorHandler,
  NotFoundException,
} from "./Utils/response/error.response.js";
import { successResponse } from "./Utils/response/success.response.js";

const bootstrap = async (app, express) => {
  app.use(express.json());

  await connectDB();

  app.get("/", (req, res) => {
    return successResponse({
      res,
      statusCode: 201,
      message: "Hello from app controller.",
    });
  });

  app.use("/auth", authRouter);

  app.use("/user", userRouter);

  app.all("/*dummy", (req, res) => {
    return NotFoundException({ message: "Handler not found." });
  });

  app.use(globalErrorHandler);
};

export default bootstrap;
