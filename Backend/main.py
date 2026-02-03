
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from dotenv import load_dotenv
import os
import bcrypt
from datetime import datetime
import asyncio

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import base64
import uuid

# Load environment variables
load_dotenv()

# --- Firebase Initialization ---
# Make sure to download your Firebase service account key and rename it to
# 'firebase-service-account.json' and place it in the 'Backend' directory.
try:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'coupleasapp.appspot.com'
    })
    print("[SUCCESS] Firebase App initialized")
except Exception as e:
    print(f"[ERROR] Firebase initialization error: {e}")
    # You might want to exit the app if Firebase doesn't initialize
    # For now, we'll let it run but endpoints will fail.

db = firestore.client()
bucket = storage.bucket()

# Pydantic Models (mostly unchanged, removed Mongo-specific parts)
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6) # Firebase requires a minimum of 6 characters for password

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    uid: str
    email: str
    isPremium: bool
    specialDate: Optional[str] = None

class UserUpdate(BaseModel):
    isPremium: Optional[bool] = None
    specialDate: Optional[str] = None

class PhotoUpload(BaseModel):
    userId: str = Field(...)
    url: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    memoryDate: str = Field(...)

class PhotoResponse(BaseModel):
    id: str
    url: str
    title: str
    description: str
    memoryDate: str
    uploadDate: str
    
    model_config = ConfigDict(
        populate_by_name=True,
    )

# FastAPI app
app = FastAPI(
    title="Couples App API",
    description="Backend API for Couples Photo Gallery (Firebase Edition)",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper function to get Firestore db instance ---
def get_db():
    return db

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Server is running"}

# Authentication endpoints
@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignup, db: firestore.client = Depends(get_db)):
    """Register a new user with email and password"""
    try:
        # Check if user already exists
        users_ref = db.collection("users").where("email", "==", user.email).limit(1)
        existing_users = list(users_ref.stream())
        
        if existing_users:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash the password
        password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user profile in Firestore
        user_data = {
            "email": user.email,
            "passwordHash": password_hash.decode('utf-8'),
            "isPremium": False,
            "specialDate": None,
            "createdAt": datetime.now().isoformat()
        }
        
        # Add the user document
        update_time, new_user_ref = db.collection("users").add(user_data)
        
        return UserResponse(
            uid=new_user_ref.id,
            email=user.email,
            isPremium=False,
            specialDate=None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@app.post("/api/auth/login", response_model=UserResponse)
async def login(user: UserLogin, db: firestore.client = Depends(get_db)):
    """Login with email and password"""
    try:
        # Find user by email
        users_ref = db.collection("users").where("email", "==", user.email).limit(1)
        users = list(users_ref.stream())
        
        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_doc = users[0]
        user_data = user_doc.to_dict()
        
        # Verify password
        stored_hash = user_data.get("passwordHash", "")
        if not bcrypt.checkpw(user.password.encode('utf-8'), stored_hash.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return UserResponse(
            uid=user_doc.id,
            email=user_data["email"],
            isPremium=user_data.get("isPremium", False),
            specialDate=user_data.get("specialDate")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


# Photo endpoints
@app.get("/api/photos/{user_id}", response_model=List[PhotoResponse])
async def get_photos(user_id: str, db: firestore.client = Depends(get_db)):
    """Get all photos for a specific user from Firestore"""
    photos_ref = db.collection("photos").where("userId", "==", user_id).order_by("memoryDate", direction=firestore.Query.DESCENDING)
    docs = photos_ref.stream()
    
    photos = []
    for doc in docs:
        photo = doc.to_dict()
        photo['id'] = doc.id
        photos.append(PhotoResponse(**photo))
    return photos


@app.post("/api/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(photo: PhotoUpload, db: firestore.client = Depends(get_db)):
    """Upload a new photo for a user to Firebase Storage and Firestore"""
    # Check if user exists
    user_ref = db.collection("users").document(photo.userId)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_doc.to_dict()

    # Check photo limit for free users
    photos_query = db.collection("photos").where("userId", "==", photo.userId)
    photo_count = len(list(photos_query.stream())) # Note: this can be inefficient for large collections

    if photo_count >= 100 and not user_data.get("isPremium", False):
        raise HTTPException(status_code=403, detail="limit_reached")

    try:
        # Upload image to Firebase Storage
        # Extract base64 data from data URL (e.g., "data:image/jpeg;base64,...")
        if photo.url.startswith("data:"):
            header, base64_data = photo.url.split(",", 1)
            image_data = base64.b64decode(base64_data)
            
            # Determine file extension from MIME type
            mime_type = header.split(";")[0].split(":")[1]
            extension = mime_type.split("/")[1]
            
            # Generate unique filename
            filename = f"photos/{photo.userId}/{uuid.uuid4()}.{extension}"
            
            # Upload to Firebase Storage
            blob = bucket.blob(filename)
            blob.upload_from_string(image_data, content_type=mime_type)
            
            # Make the blob publicly accessible
            blob.make_public()
            
            # Get the public URL
            download_url = blob.public_url
        else:
            # If it's already a URL, use it directly
            download_url = photo.url
        
        # Create photo document with URL instead of base64
        photo_doc = {
            "userId": photo.userId,
            "url": download_url,
            "title": photo.title,
            "description": photo.description or "",
            "memoryDate": photo.memoryDate,
            "uploadDate": datetime.now().isoformat()
        }
        
        update_time, new_photo_ref = db.collection("photos").add(photo_doc)
        
        return PhotoResponse(
            id=new_photo_ref.id,
            **photo_doc
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# User endpoints
@app.patch("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, updates: UserUpdate, db: firestore.client = Depends(get_db)):
    """Update user profile information in Firestore"""
    user_ref = db.collection("users").document(user_id)
    
    try:
        update_data = updates.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        user_ref.update(update_data)
        
        updated_doc = user_ref.get()
        if not updated_doc.exists:
             raise HTTPException(status_code=404, detail="User not found")
        
        user_data = updated_doc.to_dict()
        return UserResponse(
            uid=user_id,
            email=user_data["email"],
            isPremium=user_data.get("isPremium", False),
            specialDate=user_data.get("specialDate")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/users/{user_id}/payment")
async def process_payment(user_id: str):
    """Process payment for premium upgrade (mock implementation)"""
    # Simulate payment processing delay
    await asyncio.sleep(1.5)
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    # Make sure to set the port to 5000 or whatever your frontend expects
    uvicorn.run(app, host="0.0.0.0", port=5000)
