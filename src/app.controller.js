import connectDB from "./DB/connections.js";
import { testRedisConnection } from "./DB/redis.connection.js";
import { authRouter, userRouter, messageRouter } from "./Modules/index.js";
import {
  globalErrorHandler,
  NotFoundException,
} from "./Utils/response/error.response.js";
import { successResponse } from "./Utils/response/success.response.js";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import geolite from "geoip-lite";
import * as redisMethods from "./DB/redis.service.js";

const bootstrap = async (app, express) => {
  app.set("trust proxy", true);

  app.use(
    express.json(),
    cors(),
    helmet(),
    rateLimit({
      windowMs: 5 * 60 * 1000,
      limit: (req, res) => {
        const geoInfo = geolite.lookup(req.ip) || {};
        return geoInfo.country == "EG" ? 3 : 1;
      },
      message: "Too many requests.",
      legacyHeaders: false,
      requestPropertyName: "rateLimit",
      keyGenerator: (req) => {
        const ip = ipKeyGenerator(req.ip);

        return `${ip}-${req.path}`;
      },
      store: {
        incr: async (key, cb) => {
          const hits = await redisMethods.incr(key);

          if (hits == 1) {
            await redisMethods.setExpire({ key, exValue: 60 });
          }

          cb(null, hits);
        },
        async decrement(key) {
          const isKeyExists = await redisMethods.exists(key);

          if (isKeyExists) {
            await redisMethods.decr(key);
          }
        },
        skipFailedRequests: true,
      },
    }),
  );

  app.use((req, res, next) => {
    console.log(req.headers["x-forwarded-for"]);
    console.log(req.ip);
    console.log({ "req.rateLimit": req.rateLimit });
    next();
  });

  await connectDB();
  await testRedisConnection();

  app.use("/uploads", express.static(path.resolve("./uploads")));

  app.use("/auth", authRouter);

  app.use("/user", userRouter);

  app.use("/message", messageRouter);

  app.all("/*dummy", (req, res) => {
    return NotFoundException({ message: "Handler not found." });
  });

  app.use(globalErrorHandler);
};

export default bootstrap;
