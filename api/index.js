import express from "express";
import serverless from "serverless-http";
import bootstrap from "../src/app.controller.js";

const app = express();
let isInitialized = false;

async function initApp() {
  if (!isInitialized) {
    try {
      await bootstrap(app, express, { serverless: true });
      isInitialized = true;
    } catch (err) {
      console.error("Bootstrap failed:", err);
    }
  }
}

export default async function handler(req, res) {
  await initApp();
  return serverless(app)(req, res);
}
