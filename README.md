# Couples App

A couples photo gallery app with:
- signup and authenticated user profile
- special date lock/unlock flow
- photo upload and gallery
- premium upgrade mock flow

Tech stack:
- Backend: FastAPI + Firebase Admin (Auth, Firestore, Storage)
- Frontend: React + TypeScript + Vite

## Project Structure

```text
couplesApp/
├─ Backend/
│  ├─ main.py
│  ├─ requirements.txt
│  └─ firebase-service-account.json
├─ FrontEnd/
│  ├─ package.json
│  └─ src/
└─ README.md
```

## Prerequisites

- Node.js 18+
- Python 3.9+
- A Firebase project

## Firebase Setup

1. Create or open a Firebase project.
2. Enable:
   - Authentication
   - Firestore Database
   - Storage
3. Generate a service account key and place it at:
   - `Backend/firebase-service-account.json`
4. Confirm the storage bucket name in `Backend/main.py`:
   - `coupleasapp.appspot.com`
   - Change it if your project bucket is different.

## Backend Setup

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Backend URLs:
- API base: `http://localhost:5000/api`
- Swagger docs: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

## Frontend Setup

```bash
cd FrontEnd
npm install
```

Create `FrontEnd/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

Frontend URL:
- `http://localhost:5173`

## API Endpoints (Current Backend)

Auth:
- `POST /api/auth/signup`

Current user:
- `GET /api/me`

User updates:
- `PATCH /api/users/{user_id}`
- `POST /api/users/{user_id}/payment`

Photos:
- `GET /api/photos`
- `POST /api/photos`

## Known Gaps

- The frontend login page currently calls `POST /api/auth/login`, but this endpoint is not implemented in `Backend/main.py`.
- Authentication middleware expects a Firebase ID token in the `Authorization: Bearer <token>` header for protected routes.

## Notes

- Free users are limited to 100 photos; premium users are unlimited.
- Do not commit secrets:
  - `Backend/firebase-service-account.json`
  - any `.env` files

## Suggested Next Improvements

1. Implement `POST /api/auth/login` or migrate frontend login fully to Firebase client SDK.
2. Move Firebase config values (like storage bucket) to environment variables.
3. Add tests for auth and photo upload limits.
