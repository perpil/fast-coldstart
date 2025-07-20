# AWS Javascript SDK v3 Lambda Node 22 Benchmark

This is a companion to the blog post [The fastest Node 22 Lambda coldstart configuration](https://speedrun.nobackspacecrew.com/blog/2025/07/22/the-fastest-node-22-lambda-coldstart-configuration.html)

## Code notes
The lambda function makes a `GetCallerIdentity` call to STS using https and emits some metadata about the runtime, environment, and request [src/handler.mjs](src/handler.mts).  It is fronted by a Lambda Function url.

The CDK stack uses esbuild to bundle the function and marks the unnecessary credentials provider packages as external. It also demonstrates how to set environment variables without adding latency.  It doesn't do any minification. [lib/fast-coldstart-stack.mts](lib/fast-coldstart-stack).

[The SDK patch](patches/@smithy+node-http-handler+4.1.0.patch) removes the http request bits that add ~50 ms of latency when run under Node 22.

## Deployment

Run this once:

`npm install`

### To deploy without patching the SDK on Node 22:
`npx cdk deploy`

Hit the url to trigger a coldstart.  You need to wait ~8 minutes between requests to trigger a new coldstart. When I was benchmarking this, I used an Event Bridge rule to trigger it every 8 minutes.

## Get stats
Run the following CloudWatch Insights Query on `/aws/lambda/FastColdstart` to get coldstart stats:

```
filter ispresent(@initDuration) 
| stats count(@initDuration) as samples, pct(@initDuration,0) as p0, 
pct(@initDuration,50) as p50, pct(@initDuration,90) as p90, pct(@initDuration,95) as p95, pct(@initDuration,99) as p99, pct(@initDuration,100) as p100 by @log as test
```

## Cleaning up

`npx cdk destroy`
