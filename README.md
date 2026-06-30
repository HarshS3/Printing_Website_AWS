# PrintCraft — Printing & Stationery Shop

A full-stack web application for a printing and stationery shop. Built with React (frontend) and Node.js/Express (backend), deployed on AWS with both EC2 and serverless (Lambda) architecture.

---

## Architecture

```
User Browser
    │
    ├──► S3 Static Website ──► React App (HTML/CSS/JS)
    │         │
    │         │ API calls (REACT_APP_API_URL)
    │         ▼
    ├──► ALB → EC2 (Node.js)     ← 3-Tier Architecture
    │              │
    └──► API Gateway → Lambda    ← Serverless Architecture
                       │
                       ▼
                  RDS MySQL (shared)
                       │
                       ▼
                Secrets Manager (credentials)
```

Switch between architectures by changing `REACT_APP_API_URL`:
- EC2: `http://alb-dns.us-east-1.elb.amazonaws.com`
- Lambda: `https://xxxxx.execute-api.us-east-1.amazonaws.com`

---

## Project Structure

```
Printing App - AWS/
├── backend/
│   ├── server.js          # Express server (EC2)
│   ├── lambda.js          # Lambda handler (serverless)
│   ├── db.js              # Shared DB logic (used by both)
│   ├── events.js          # SNS event publisher
│   ├── emailHandler.js    # Lambda — sends confirmation email
│   ├── orderProcessor.js  # Lambda — processes order via SQS
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React app
│   │   └── index.js
│   └── public/
│       └── index.html
└── .github/
    └── workflows/
        ├── deploy.yml          # Main orchestrator
        ├── test-backend.yml    # Backend CI tests
        ├── test-frontend.yml   # Frontend CI tests
        ├── deploy-backend.yml  # Backend CD
        └── deploy-frontend.yml # Frontend CD
```

---

## Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/categories` | List all product categories |
| `GET` | `/api/products` | List all products (optional `?category=`) |
| `GET` | `/api/products/:id` | Get product by ID |
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/order` | Place an order |

---

## How Backend Works (Dual Mode)

**EC2 Mode (`server.js`):**
```
Express server running 24/7
Reads DB credentials from .env file
```

**Lambda Mode (`lambda.js`):**
```
Wakes up per request
Reads DB credentials from Secrets Manager
Routes requests manually by checking event.path + event.method
```

**Shared logic (`db.js`):**
```
Both modes import from db.js
If DB_HOST env var exists → use it (EC2)
If not → fetch from Secrets Manager (Lambda)
```

---

## Event Driven Architecture

When an order is placed, an event is published to SNS:

```
POST /api/order
    ↓
Saves to RDS
    ↓
Publishes ORDER_PLACED to SNS (order-events topic)
    ↓
SNS fans out:
    ├──► email-handler Lambda → sends confirmation email
    └──► SQS queue → order-processor Lambda → generates invoice
```

---

## Local Development

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in DB credentials
node server.js
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env file in frontend/ folder
echo "REACT_APP_API_URL=http://localhost:3000" > .env
npm start
```

---

## Environment Variables

**Backend `.env` (EC2):**
```
DB_HOST=your-rds-endpoint
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=appdb
PORT=3000
ORDER_EVENTS_TOPIC_ARN=arn:aws:sns:us-east-1:xxx:order-events
```

**Frontend `.env`:**
```
REACT_APP_API_URL=http://your-alb-or-api-gateway-url
```

---

## CI/CD Pipeline

### Workflow Overview

```
PR opened to main:
    ├── test-backend  (syntax, file checks, route checks)
    └── test-frontend (syntax, build test, file checks)

Merged to main:
    ├── test-backend → deploy-backend
    │       ├── zip EC2 code → upload to S3
    │       ├── zip Lambda code → upload to S3
    │       ├── update Lambda functions
    │       └── trigger ASG instance refresh
    └── test-frontend → deploy-frontend
            ├── npm run build
            └── sync to S3 frontend bucket
    ↓
notify (SNS email on success/failure)
```

### Path Filters
- Changes in `backend/**` → only backend pipeline runs
- Changes in `frontend/**` → only frontend pipeline runs
- Both changed → both run in parallel

### GitHub Secrets Required

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `REACT_APP_API_URL` | ALB DNS or API Gateway URL |
| `SNS_TOPIC_ARN` | ARN of app-alerts SNS topic for notifications |

---

## Deployment

**Automatic via CI/CD:**
```bash
git add .
git commit -m "your changes"
git push origin main
# GitHub Actions deploys automatically
```

**Manual deploy:**
```bash
# Backend to EC2
zip -r app.zip backend/ frontend/ deploy.sh
aws s3 cp app.zip s3://printshop-app-code/Printing_Website_AWS-master.zip
aws autoscaling start-instance-refresh --auto-scaling-group-name asg-for-ec2

# Lambda
cd backend && zip -r ../function.zip lambda.js db.js events.js package.json node_modules/
aws s3 cp ../function.zip s3://printshop-app-code/function.zip
aws lambda update-function-code --function-name printshop-app --s3-bucket printshop-app-code --s3-key function.zip

# Frontend
cd frontend && npm run build
aws s3 sync build/ s3://printshop-frontend-code --delete
```

---

## Infrastructure

Infrastructure is managed separately in the Terraform repo. See `C:\D\Terraform - AWS\day28\` for all AWS resources.

| Resource | Details |
|---|---|
| EC2 Backend | t3.small, Auto Scaling Group (min 2, max 4) |
| Lambda Backend | Node.js 20.x, VPC enabled |
| RDS | MySQL, db.t3.micro, Multi-AZ |
| S3 Frontend | Static website hosting |
| API Gateway | HTTP API, `$default` stage |
| ALB | Application Load Balancer, port 80 |

---

## Pending Improvements

- [ ] Add Jest unit tests for API routes
- [ ] AWS SES for real email sending in emailHandler
- [ ] EventBridge to replace direct SNS publishing
- [ ] Add staging environment
- [ ] Docker containerization
