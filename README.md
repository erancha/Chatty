# Chatty

## 1. Overview

Chatty is a serverless chat application built with AWS, React, and WebSockets.  
The application is available online at https://dc3jlg51gqshu.cloudfront.net/

## 2. Architecture Components

![Architecture diagram](https://lucid.app/publicSegments/view/27e7f65d-2111-4c33-b360-649aab219ab4/image.jpeg)

### 2.1 Backend

- **AWS Lambda** functions (Node.js) for serverless compute
- **AWS API Gateway** with **WebSocket** APIs
- **AWS Cognito** for API authentication
- **AWS Elasticache Redis** to manage active user connection IDs and cache messages
- **AWS DynamoDB** for message storage
- **AWS SQS** for network isolation between Lambda functions

### 2.2 Frontend

- Single Page Application (SPA) built with **React**
- Hosted on **AWS S3**
- Accessed through **AWS CloudFront** for global delivery

#### State Management

- Uses Redux and Redux Thunk
- Messages are stored in the Redux store
- Components connect to Redux using `connect` HOC (Higher-Order Component)

#### Dependencies

- React
- Redux
- WebSocket API
- TypeScript

## 3. Security Considerations

- Data in transit is encrypted with **HTTPS**
- User authentication via AWS Cognito with **Google** integration
- Lambda functions and Elasticache are in a **private subnet**
- IAM roles follow the least privilege principle

## 4. Deployment

- Uses AWS SAM (Serverless Application Model) for deployment
- Infrastructure is defined with CloudFormation templates
- Deploy with a single command: `sam build` and `sam deploy`
- The application is available online at https://dc3jlg51gqshu.cloudfront.net/

## 5. Scalability & Performance

- Serverless architecture enables automatic scaling
- CloudFront provides low-latency content delivery

## 6. Monitoring & Logging

- Monitoring and logging via AWS CloudWatch

## 7. Cost Optimization

- Pay-per-use model for serverless components
- Elasticache and VPC resources have hourly costs
