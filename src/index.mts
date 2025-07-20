import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
const stsClient = new STSClient({ region: process.env.AWS_REGION });
import { statSync } from "fs";
const start = Date.now();
const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
const getCallerIdLatency = Date.now() - start;

let size: number, runtimeBuildDate: Date;
try {
  runtimeBuildDate = statSync("/var/runtime").mtime;
} catch (e) {
  console.error("Unable to determine runtime build date", e);
}
try {
  size = statSync("index.mjs").size;
} catch (e) {
  console.error("Unable to determine size of index.mjs", e);
}

import packageJson from '@aws-sdk/client-sts/package.json' with { type: 'json' };
const sdkVersion: string | undefined = process.env.sdkVersion || packageJson.version;

var coldstart = 0;

export const handler = async (event: any, context: any) => {
  return {
    statusCode: 200,
    body: {
      requestId: callerIdentity["$metadata"].requestId,
      lambdaRequestId: context.awsRequestId,
      userId: callerIdentity.UserId,
      accountId: maskAccount(callerIdentity.Account!),
      arn: maskAccount(callerIdentity.Arn!),
      requestLatency: getCallerIdLatency,
      size,
      runtimeBuildDate,
      coldstart: coldstart++<1,
      sdkVersion,
      nodeVersion: process.version,
    },
  };
};

function maskAccount(input: string) {
  return input.replaceAll(/\d{12}/g, (match) => "x".repeat(match.length));
}
