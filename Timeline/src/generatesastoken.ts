"use strict";
import crypto from "crypto";

export interface TokenArgs {
  secret: string;
  organization: string;
  namespace: string;
  service: string;
  permissions: string;
  keyName: string;
  expiration: number;
}

function generateExpiration(args: number) {
  return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
}

export function generateSasToken(args: TokenArgs) {
  const {
    secret,
    organization,
    namespace,
    service,
    permissions,
    keyName,
    expiration
  } = args;
  const calculatedExpiration = new Date(
    generateExpiration(expiration)
  ).toISOString();
  const sasTokenPrefix = `so=${organization}&sn=${namespace}&ss=${service}&sp=${permissions}&se=${calculatedExpiration}&sk=${keyName}`;
  const signature = encodeURIComponent(
    crypto
      .createHmac("sha256", secret)
      .update(sasTokenPrefix)
      .digest("base64")
  );
  return `${sasTokenPrefix}&sig=${signature}`;
}

/* Begin */
export function makeToken(args: TokenArgs) {
  try {
    const sasToken = generateSasToken(args);
    console.log("\n-- SUCCESS --");
    console.log(sasToken);
  } catch (err) {
    console.log("\n-- ERROR --");
    console.log(err);
  }
}
