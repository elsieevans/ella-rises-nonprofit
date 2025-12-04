# Deployment Fix

The previous deployment failed because the `Procfile` could not be parsed by the AWS Elastic Beanstalk rsyslog generator. This is typically due to trailing newlines or incorrect formatting.

## Changes Made
- Cleaned up `Procfile` to contain a single line: `web: node server.js`
- Verified `server.js` listens on `process.env.PORT`.

## How to Deploy
1. Upload `ella-rises-beanstalk-deploy-fixed-v2.zip` to AWS Elastic Beanstalk.

