# Chatty

## 1. Overview

AWS/React/WebSockets-based chat application.

## 2. Architecture Components

![Architecture diagram](https://lucid.app/publicSegments/view/82f588b6-80d9-4c6a-a32c-ef1095079703/image.jpeg)

### 2.1 Backend

- AWS **Lambda** functions (Node.js) for serverless compute
- AWS **API Gateway** with **WebSocket** APIs
- AWS **Elasticache Redis** for managing connection ids of active users
- AWS **SQS** for network isolation of the lambda functions interacting with Elasticache Redis in a private subnet from the lambda function interacting with the API gateway in the default lambda environment.

### 2.2 Frontend

- **React**-based Single Page Application (SPA)
- Hosted on AWS **S3**
- Accessed via AWS **CloudFront** for global content delivery

#### State Management

The application uses Redux and Redux Thunk for state management:

- Messages are stored in the Redux store
- Component connects to Redux store using `connect` HOC (Higher-Order Component)

#### Dependencies

- React
- Redux
- WebSocket API
- TypeScript

## 3. Data Flow

1. User interacts with the React-based frontend hosted on CloudFront from S3
2. Frontend makes API calls to AWS API Gateway
3. API Gateway authenticates users with Cognito and triggers appropriate Lambda functions
4. Lambda functions interact with:
   - Elasticache to manage connection ids of other active users
   - SQS to send messages to connected users thru WebSocket API gateway

## 4. Security Considerations

- All data in transit is encrypted using **HTTPS**
- User authentication is handled by AWS Cognito, with **Google** federated authentication
- Lambda functions and Elasticache deployed into a **private subnet**
- Least privilege principle applied to IAM roles

## 5. Deployment

- AWS SAM (Serverless Application Model) is used for deployment
- CloudFormation templates define the infrastructure as code
- Single command deployment using `sam build` and `sam deploy`
- The application is currently accessible online at https://d3r9xds8pmdxik.cloudfront.net.

## 6. Scalability & Performance

- Serverless architecture allows automatic scaling
- CloudFront ensures low-latency content delivery

## 7. Monitoring & Logging

- AWS CloudWatch for monitoring and logging

## 8. Cost Optimization

- Pay-per-use model with serverless components
- Elasticache and VPC resources incur hourly costs
