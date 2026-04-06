import { resolve } from "node:path";
import dotenv from "dotenv";

const envPath = {
  development: `.env.dev`,
  production: `.env.prod`,
};

dotenv.config({ path: resolve(`./config/${envPath.development}`) });

export const PORT = process.env.PORT || 5000;
export const DB_URI = process.env.DB_URI;
export const SALT = parseInt(process.env.SALT);
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
export const TOKEN_SIGNATURE_User_ACCESS =
  process.env.TOKEN_SIGNATURE_User_ACCESS;
export const TOKEN_SIGNATURE_Admin_ACCESS =
  process.env.TOKEN_SIGNATURE_Admin_ACCESS;
export const TOKEN_SIGNATURE_User_REFRESH =
  process.env.TOKEN_SIGNATURE_User_REFRESH;
export const TOKEN_SIGNATURE_Admin_REFRESH =
  process.env.TOKEN_SIGNATURE_Admin_REFRESH;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;

export const REDIS_URL = process.env.REDIS_URL;