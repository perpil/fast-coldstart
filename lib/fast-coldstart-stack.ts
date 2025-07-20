import { Stack, StackProps } from "aws-cdk-lib";
import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { readFileSync } from "fs";

import {
  Architecture,
  Runtime,
  Alias,
  FunctionUrlAuthType,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export class FastColdstartStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const SERVICE_NAME = "FastColdstart";
    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: `/aws/lambda/${SERVICE_NAME}`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const func = new NodejsFunction(this, "NodejsFunction", {
      functionName: SERVICE_NAME,
      logGroup,
      entry: "src/index.mts",
      architecture: Architecture.ARM_64,
      memorySize: 512,
      runtime: Runtime.NODEJS_22_X,
      bundling: {
        mainFields: ["module", "main"],
        format: OutputFormat.ESM,
        bundleAwsSDK: true,
        externalModules: [
          "@aws-sdk/client-sso",
          "@aws-sdk/client-sso-oidc",
          "@smithy/credential-provider-imds",
          "@aws-sdk/credential-provider-ini",
          "@aws-sdk/credential-provider-http",
          "@aws-sdk/credential-provider-process",
          "@aws-sdk/credential-provider-sso",
          "@aws-sdk/credential-provider-web-identity",
          "@aws-sdk/token-providers",
        ],
        define: {
          "process.env.sdkVersion": JSON.stringify(
            JSON.parse(
              readFileSync(
                "node_modules/@aws-sdk/client-sts/package.json"
              ).toString()
            ).version
          ),
        },
      },
    });

    // add an alias to the lambda function
    const alias = new Alias(this, "FunctionAlias", {
      aliasName: "prod",
      version: func.currentVersion,
    });

    let url = alias.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    // Output the URL of the Lambda Function
    new CfnOutput(this, "FunctionUrl", {
      value: url.url,
      description: "The URL of the Lambda Function",
    });
  }
}
