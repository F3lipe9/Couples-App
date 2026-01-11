from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from typing_extensions import Annotated
from pydantic.functional_validators import BeforeValidator
from dotenv import load_dotenv
import os
import bcrypt
from bson import ObjectId
from datetime import datetime
import asyncio

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "couplesApp")

# MongoDB client
client = None
db = None

# Type for MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

# Pydantic Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

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
    description="Backend API for Couples Photo Gallery",
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

# Database functions
async def connect_db():
    global client, db
    try:
        client = AsyncMongoClient(MONGODB_URI)
        db = client[DB_NAME]
        
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.photos.create_index("userId")
        await db.photos.create_index([("memoryDate", -1)])
        
        print("✅ Connected to MongoDB")
        return db
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        raise e

def get_db():
    if db is None:
        raise Exception("Database not initialized. Call connect_db first.")
    return db

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

# Event handlers
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await connect_db()
    except Exception as e:
        print(f"⚠️ Warning: MongoDB connection failed - {e}")
        print("🚀 FastAPI server started (without database)")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_db()
    print("👋 FastAPI server stopped")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Server is running"}

# Authentication endpoints
@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignup):
    """Register a new user"""
    db = get_db()
    
    # Check if user exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_doc = {
        "email": user.email,
        "password": hashed_password,
        "isPremium": False,
        "specialDate": None,
        "createdAt": datetime.now()
    }
    
    result = await db.users.insert_one(user_doc)
    
    return UserResponse(
        uid=str(result.inserted_id),
        email=user.email,
        isPremium=False,
        specialDate=None
    )

@app.post("/api/auth/login", response_model=UserResponse)
async def login(user: UserLogin):
    """Authenticate user with email and password"""
    db = get_db()
    
    # Find user
    user_doc = await db.users.find_one({"email": user.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found. Please sign up.")
    
    # Verify password
    if not bcrypt.checkpw(user.password.encode('utf-8'), user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    return UserResponse(
        uid=str(user_doc["_id"]),
        email=user_doc["email"],
        isPremium=user_doc.get("isPremium", False),
        specialDate=user_doc.get("specialDate")
    )

# Photo endpoints
@app.get("/api/photos/{user_id}", response_model=List[PhotoResponse])
async def get_photos(user_id: str):
    """Get all photos for a specific user"""
    db = get_db()
    
    photos = await db.photos.find({"userId": user_id}).sort("memoryDate", -1).to_list(1000)
    
    return [
        PhotoResponse(
            id=str(photo["_id"]),
            url=photo["url"],
            title=photo["title"],
            description=photo.get("description", ""),
            memoryDate=photo["memoryDate"],
            uploadDate=photo["uploadDate"]
        )
        for photo in photos
    ]

@app.post("/api/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(photo: PhotoUpload):
    """Upload a new photo for a user"""
    db = get_db()
    
    # Check if user exists
    try:
        user = await db.users.find_one({"_id": ObjectId(photo.userId)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check photo limit for free users
    photo_count = await db.photos.count_documents({"userId": photo.userId})
    if photo_count >= 100 and not user.get("isPremium", False):
        raise HTTPException(status_code=403, detail="limit_reached")
    
    # Create photo
    photo_doc = {
        "userId": photo.userId,
        "url": photo.url,
        "title": photo.title,
        "description": photo.description,
        "memoryDate": photo.memoryDate,
        "uploadDate": datetime.now().isoformat()
    }
    
    result = await db.photos.insert_one(photo_doc)
    
    return PhotoResponse(
        id=str(result.inserted_id),
        url=photo.url,
        title=photo.title,
        description=photo.description,
        memoryDate=photo.memoryDate,
        uploadDate=photo_doc["uploadDate"]
    )

# User endpoints
@app.patch("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, updates: UserUpdate):
    """Update user profile information"""
    db = get_db()
    
    try:
        # Prepare update data
        update_data = updates.model_dump(exclude_unset=True)
        
        result = await db.users.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            uid=str(result["_id"]),
            email=result["email"],
            isPremium=result.get("isPremium", False),
            specialDate=result.get("specialDate")
        )
    except HTTPException:
        raise
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
    uvicorn.run(app, host="0.0.0.0", port=5000)
