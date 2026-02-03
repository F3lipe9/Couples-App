# Couples App

A romantic photo gallery application for couples featuring special date unlocking, secure authentication, and cloud storage. Built with FastAPI (Python) backend and React + TypeScript frontend, powered by Firebase.

## Features

- **Secure Authentication** - Firebase Auth with email/password
- **Photo Gallery** - Upload and view cherished memories
- **Special Date Lock** - Use your special date as an unlock code
- **Premium Tier** - Upgrade for unlimited photo storage (100 photo limit for free users)
- **Modern UI** - Clean, responsive design with Lucide icons
- **Fast Performance** - Vite for frontend, FastAPI for backend
- **Cloud Storage** - Firebase Storage for reliable photo hosting

## Project Structure

```
couplesApp/
├── Backend/                          # FastAPI Python server
│   ├── main.py                      # API endpoints & Firebase integration
│   ├── firebase-service-account.json # Firebase credentials (NEVER commit!)
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Backend environment variables (NEVER commit!)
│   └── .gitignore                   # Git ignore rules
├── FrontEnd/                        # React + TypeScript SPA
│   ├── src/
│   │   ├── components/              # Reusable UI components (Button, Input)
│   │   ├── pages/                   # Page components
│   │   │   ├── LoginPage.tsx       # User authentication
│   │   │   ├── SignupPage.tsx      # User registration
│   │   │   ├── GalleryPage.tsx     # Photo gallery view
│   │   │   ├── UploadPage.tsx      # Photo upload
│   │   │   ├── SetSpecialDatePage.tsx   # Set special date
│   │   │   ├── UnlockDatePage.tsx  # Date unlock feature
│   │   │   └── UpgradePage.tsx     # Premium upgrade
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── App.tsx                  # Main app component & routing
│   │   └── main.tsx                 # Application entry point
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite build configuration
│   ├── .env                         # Frontend environment variables (NEVER commit!)
│   └── .gitignore                   # Git ignore rules
└── .gitignore                       # Root-level git ignore
```

## Prerequisites

- **Node.js** v18 or higher
- **Python** 3.9 or higher
- **pip** (Python package manager)
- **npm** (Node package manager)
- **Firebase Project** with:
  - Firestore Database enabled
  - Fire Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Firestore Database** (Start in test mode for development)
4. Enable **Firebase Storage** (Start in test mode for development)
5. Enable **Authentication** → Email/Password sign-in method
6. Download service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `firebase-service-account.json` in `Backend/` directory
7. Copy your Storage Bucket name (format: `yourproject.appspot.com`)
8. Update `storageBucket` in `Backend/main.py` (line ~25) with your bucket name

**IMPORTANT**: Never commit `firebase-service-account.json` to git!

### 2. Install Backend Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

**Dependencies include:**
- FastAPI - Web framework
- Firebase Admin SDK - Firebase integration
- Python-dotenv - Environment variables
- Bcrypt - Password hashing
- Uvicorn - ASGI server

### 3. Install Frontend Dependencies

```bash
cd FrontEnd
npm install
```

**Dependencies include:**
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool & dev server
- Lucide React - Icon library

### 4. Configure Environment Variables

**Backend** - Create `Backend/.env`:
```env
PORT=5000
# Add any additional backend configuration here
```

**Frontend** - Create `FrontEnd/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Run the Application

**Terminal 1 - Backend Server:**
## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login (returns user data)

### Users
- `GET /api/users/{userId}` - Get user profile
- `PATCH /api/users/{userId}` - Update user profile (specialDate, isPremium)
- `POST /api/users/{userId}/payment` - Process premium payment (mock implementation)

### Photos
- `GET /api/photos/{userId}` - Get all photos for a user
- `POST /api/photos` - Upload new photo with base64 image data

**Interactive API Documentation**: Visit `http://localhost:5000/docs` when backend is running

## Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **Firebase Admin SDK** - Authentication, Firestore, Storage
- **Pydantic** - Data validation and serialization
- **Bcrypt** - Password hashing
- **Python-dotenv** - Environment variable management
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling
- **Lucide React** - Beautiful icon library
- **CSS3** - Styling

### Infrastructure
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Storage** - Cloud file storage
- **Firebase Auth** - User authentication service

## Architecture

- **Frontend**: React SPA with TypeScript for type safety
- **Backend**: RESTful API with FastAPI (async/await)
- **Database**: Firestore (document-based NoSQL)
- **Storage**: Firebase Storage (cloud object storage)
- **Auth**: Firebase Authentication with custom backend validation

## Deployment

### Backend Deployment
1. Set up hosting (Railway, Render, Google Cloud Run, etc.)
2. Configure environment variables
3. Upload Firebase service account JSON securely
4. Update CORS settings for production domain

### Frontend Deployment
1. Update `VITE_API_URL` in `.env` to production backend URL
2. Build: `npm run build`
3. Deploy `dist/` folder to hosting (Vercel, Netlify, Firebase Hosting)

## Security Notes

- All secrets are gitignored (`.env`, `firebase-service-account.json`)
- Passwords are hashed with bcrypt
- CORS middleware configured for cross-origin requests
- For production, use proper JWT tokens
- Enable Firebase security rules for Firestore and Storage
- Use HTTPS in production
- Implement rate limiting on sensitive endpoints

## Development Notes

- Backend auto-reloads on code changes (FastAPI's uvicorn reload)
- Frontend has HMR (Hot Module Replacement) via Vite
- TypeScript provides compile-time type checking
- Free users limited to 100 photos
- Premium users get unlimited storage

## Troubleshooting

**Firebase initialization error:**
- Verify `firebase-service-account.json` exists in `Backend/`
- Check storage bucket name in `main.py`

**CORS errors:**
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`

**Module not found:**
- Backend: Run `pip install -r requirements.txt`
- Frontend: Run `npm install`

## License

This project is private and proprietary.

---

Made with love for couples everywhereongoDB driver
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
