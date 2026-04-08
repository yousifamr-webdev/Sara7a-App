import express from "express";
import serverless from "serverless-http";
import bootstrap from "../app.controller.js";

const app = express();

await bootstrap(app, express);

export default serverless(app);
