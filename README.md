# NestJS CRUD Application

A RESTful API built with NestJS, featuring CRUD operations, authentication, and Google OAuth integration.

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20.x (for local development)
- npm or yarn

### Environment Setup

1. Clone the repository:
```bash
git clone <your-repository-url>
cd nestjs-crud-app-2
```

2. Create your environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your actual values:
- Generate a secure JWT_SECRET
- Set up Google OAuth credentials in Google Cloud Console
- Update other environment variables as needed

### Running with Docker

1. Build and start the container:
```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run start:dev
```

## 🔧 Environment Variables

The following environment variables are required:

- `NODE_ENV`: Application environment (development/production)
- `PORT`: Application port (default: 3000)
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRATION`: JWT token expiration time
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: Google OAuth callback URL
- `DATABASE_URL`: Database connection URL

## 📝 API Documentation

API documentation is available at `http://localhost:3000/api` when running the application.

## 🐳 Docker

The application is containerized using Docker. The Dockerfile uses a multi-stage build to optimize the image size and security.

### Building the Image

```bash
docker build -t nestjs-crud-app .
```

### Running with Docker Compose

```bash
docker-compose up
```

## 🔍 Health Check

The application includes a health check endpoint at `/health` that can be used to monitor the application's status.

## 📦 Project Structure

```
nestjs-crud-app-2/
├── src/
│   ├── auth/           # Authentication module
│   ├── users/          # Users module
│   ├── common/         # Common utilities and guards
│   └── main.ts         # Application entry point
├── test/               # Test files
├── migrations/         # Database migrations
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker Compose configuration
└── .env.example       # Example environment variables
```

## 🔐 Security

- Environment variables are not committed to the repository
- JWT tokens are used for authentication
- Google OAuth integration for secure login
- SQLite database with proper file permissions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.