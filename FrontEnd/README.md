# Couples App with MongoDB

A romantic photo gallery app for couples with FastAPI (Python) backend and React frontend.

## Project Structure

```
couplesApp/
├── backend/              # FastAPI Python server
│   ├── main.py          # FastAPI application
│   ├── database.py      # MongoDB connection
│   ├── models.py        # Pydantic models
│   ├── routes_auth.py   # Authentication routes
│   ├── routes_photos.py # Photo routes
│   ├── routes_users.py  # User routes
│   ├── requirements.txt # Python dependencies
│   └── .env
├── src/                 # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   └── types/          # TypeScript types
├── package.json        # Frontend dependencies
└── .env               # Frontend environment variables
```

## Prerequisites

- Node.js (v18 or higher)
- Python 3.9 or higher
- MongoDB Atlas account (or local MongoDB)

## Setup

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd ..
npm install
```

### 3. Configure Backend Environment

Edit `backend/.env`:
```
MONGODB_URI=your_mongodb_connection_string
DB_NAME=couplesApp
PORT=5000
```

### 4. Configure Frontend Environment

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 5. Start the Application

**Terminal 1 - Backend (FastAPI):**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend (React):**
```bash
npm run dev
```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:5173`.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login

### Users
- `PATCH /api/users/{userId}` - Update user profile
- `POST /api/users/{userId}/payment` - Process payment (mock)

### Photos
- `GET /api/photos/{userId}` - Get all user photos
- `POST /api/photos` - Upload new photo

## Features

- FastAPI backend with async/await support
- User authentication with bcrypt password hashing
- Special date as password gate
- Photo gallery with upload
- Premium tier (unlimited photos)
- 100 photo limit for free users
- RESTful API architecture
- Separated frontend/backend
- Auto-generated API docs at `/docs`

## Technology Stack

**Backend:**
- FastAPI - Modern Python web framework
- PyMongo - MongoDB driver
- Bcrypt - Password hashing
- Pydantic - Data validation
- Uvicorn - ASGI server

**Frontend:**
- React + TypeScript
- Vite - Build tool
- TailwindCSS - Styling
- Lucide React - Icons

## Production Notes

- Images should be stored in cloud storage (AWS S3, Cloudinary) instead of base64 in DB
- Add JWT tokens for authentication
- Add proper validation and error handling
- Set up HTTPS
- Configure CORS properly for production domain
- Use environment variables for sensitive data
# Couples-App
