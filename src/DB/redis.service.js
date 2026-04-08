import { client } from "./redis.connection.js";

export async function set({ key, value, exType = "EX", exValue = 30 }) {
  return await client.set(key, value, {
    expiration: { type: exType, value: Math.floor(exValue) },
  });
}

export async function get(key) {
  return await client.get(key);
}

export async function incr(key) {
  return await client.incr(key);
}

export async function decr(key) {
  return await client.decr(key);
}

export async function mget(keys) {
  return await client.mget(keys);
}

export async function ttl(key) {
  return await client.ttl(key);
}

export async function exists(key) {
  return await client.exists(key);
}
export async function persists(key) {
  return await client.persists(key);
}
export async function del(key) {
  return await client.del(key);
}

export async function update(key, value) {
  if (!(await exists(key))) {
    return 0;
  }
  await client.set(key, value);
  return 1;
}

export function blackListTokenKey({ userId, tokenId }) {
  return `blackLisToken::${userId}::${tokenId}`;
}

export function getOTPKey({ email, otpType }) {
  return `OTP::${email}::${otpType}`;
}
export function getOTPReqNoKey({ email, otpType }) {
  return `OTP::${email}::${otpType}::No`;
}

export function getOTPBlockedStatusKey({ email, otpType }) {
  return `OTP::${email}::${otpType}::Blocked`;
}

export async function setExpire({ key, exType = "EX", exValue = 30 }) {
  const value = Math.floor(exValue);

  if (exType === "EX") {
    return await client.expire(key, value); 
  }

  if (exType === "PX") {
    return await client.pexpire(key, value); 
  }

  throw new Error("Invalid expiration type. Use 'EX' or 'PX'");
}