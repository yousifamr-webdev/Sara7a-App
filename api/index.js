import express from "express";
import serverless from "serverless-http";
import bootstrap from "../src/app.controller.js";

const app = express();
let isInitialized = false;

async function initApp() {
  if (!isInitialized) {
    await bootstrap(app, express);
    isInitialized = true;
  }
}

export default async function handler(req, res) {
  await initApp();
  return serverless(app)(req, res);
}
