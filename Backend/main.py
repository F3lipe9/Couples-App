from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List
from dotenv import load_dotenv
import os
from datetime import datetime, date
import asyncio

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import base64
import uuid

# Load environment variables
load_dotenv()

# ---------------- FIREBASE INIT ----------------
# Required .env variables:
#   FIREBASE_SERVICE_ACCOUNT  - path to service account JSON (default: firebase-service-account.json)
#   FIREBASE_STORAGE_BUCKET   - e.g. yourapp.appspot.com
#   FRONTEND_ORIGIN           - e.g. http://localhost:5173 or https://yourapp.com

SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT", "firebase-service-account.json")
STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

if not STORAGE_BUCKET:
    raise RuntimeError("FIREBASE_STORAGE_BUCKET is not set in environment variables.")

cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})

db = firestore.client()
bucket = storage.bucket()

# ---------------- FIRESTORE SCHEMA ----------------
# users/{uid}
#   email:            string
#   isPremium:        bool
#   specialDate:      string (ISO date YYYY-MM-DD) | null
#   storageUsedBytes: int    (running total of GCS bytes used; decremented on delete)
#   createdAt:        string (ISO datetime)
#
# photos/{photo_id}
#   userId:       string
#   gcsPath:      string | null  (GCS object path; null for external URLs)
#   sizeBytes:    int            (byte size of uploaded file; 0 for external URLs)
#   title:        string
#   description:  string
#   memoryDate:   string (ISO date YYYY-MM-DD)
#   uploadDate:   string (ISO datetime)

# Storage limits (bytes)
FREE_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024          #  50 MB
PREM_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024    #   5 GB

SIGNED_URL_EXPIRY_SECONDS = 3600  # 1 hour


# ---------------- MODELS ----------------

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    uid: str
    email: str
    isPremium: bool
    specialDate: Optional[str] = None
    storageUsedBytes: int = 0
    storageLimitBytes: int = FREE_STORAGE_LIMIT_BYTES


class UserUpdate(BaseModel):
    isPremium: Optional[bool] = None
    specialDate: Optional[str] = None

    @field_validator("specialDate")
    @classmethod
    def validate_special_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            date.fromisoformat(v)  # expects YYYY-MM-DD
        except ValueError:
            raise ValueError("specialDate must be a valid ISO date string (YYYY-MM-DD)")
        return v


class PhotoUpload(BaseModel):
    userId: str
    # base64 data URI  OR  an existing https:// URL
    url: str
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default="", max_length=1000)
    memoryDate: str

    @field_validator("memoryDate")
    @classmethod
    def validate_memory_date(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("memoryDate must be a valid ISO date string (YYYY-MM-DD)")
        return v


class PhotoResponse(BaseModel):
    id: str
    url: str          # signed URL, valid for SIGNED_URL_EXPIRY_SECONDS
    title: str
    description: str
    memoryDate: str
    uploadDate: str
    sizeBytes: int = 0

    model_config = ConfigDict(populate_by_name=True)


# ---------------- APP ----------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- HELPERS ----------------

def _signed_url(gcs_path: str) -> str:
    """Return a temporary signed URL for a GCS object."""
    blob = bucket.blob(gcs_path)
    return blob.generate_signed_url(
        expiration=SIGNED_URL_EXPIRY_SECONDS,
        method="GET",
        version="v4",
    )


def _storage_limit(is_premium: bool) -> int:
    return PREM_STORAGE_LIMIT_BYTES if is_premium else FREE_STORAGE_LIMIT_BYTES


# ---------------- AUTH MIDDLEWARE ----------------

def get_current_user(authorization: str = Header(...)):
    """Verify Firebase ID token from Authorization: Bearer <token> header."""
    try:
        token = authorization.split("Bearer ")[1]
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or missing token")


# ---------------- AUTH ----------------

@app.post("/api/auth/signup", response_model=UserResponse, status_code=201)
async def signup(user: UserSignup):
    """
    Create a new Firebase Auth user and initialise their Firestore document.

    Login is handled entirely on the frontend via the Firebase client SDK
    (signInWithEmailAndPassword). After signup, the frontend should call
    signInWithEmailAndPassword to obtain an ID token for subsequent requests.
    """
    try:
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
        )
    except firebase_admin.exceptions.FirebaseError as e:
        raise HTTPException(status_code=400, detail=e.code if hasattr(e, "code") else str(e))

    db.collection("users").document(user_record.uid).set({
        "email": user.email,
        "isPremium": False,
        "specialDate": None,
        "storageUsedBytes": 0,
        "createdAt": datetime.now().isoformat(),
    })

    return UserResponse(
        uid=user_record.uid,
        email=user.email,
        isPremium=False,
        storageUsedBytes=0,
        storageLimitBytes=FREE_STORAGE_LIMIT_BYTES,
    )


# ── Login is handled on the frontend with Firebase client SDK. ──────────────
# Frontend flow:
#   import { signInWithEmailAndPassword } from "firebase/auth";
#   const { user } = await signInWithEmailAndPassword(auth, email, password);
#   const idToken = await user.getIdToken();
#   // Then pass idToken in: Authorization: Bearer <idToken>
# ─────────────────────────────────────────────────────────────────────────────


# ---------------- USER ----------------

@app.get("/api/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    uid = user["uid"]
    doc = db.collection("users").document(uid).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    data = doc.to_dict()
    is_premium = data.get("isPremium", False)
    return UserResponse(
        uid=uid,
        email=data["email"],
        isPremium=is_premium,
        specialDate=data.get("specialDate"),
        storageUsedBytes=data.get("storageUsedBytes", 0),
        storageLimitBytes=_storage_limit(is_premium),
    )


@app.patch("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, updates: UserUpdate, user=Depends(get_current_user)):
    if user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ref = db.collection("users").document(user_id)
    ref.update(updates.model_dump(exclude_unset=True))

    data = ref.get().to_dict()
    is_premium = data.get("isPremium", False)
    return UserResponse(
        uid=user_id,
        email=data["email"],
        isPremium=is_premium,
        specialDate=data.get("specialDate"),
        storageUsedBytes=data.get("storageUsedBytes", 0),
        storageLimitBytes=_storage_limit(is_premium),
    )


# ---------------- PHOTOS ----------------

@app.get("/api/photos", response_model=List[PhotoResponse])
async def get_photos(user=Depends(get_current_user)):
    uid = user["uid"]

    docs = (
        db.collection("photos")
        .where("userId", "==", uid)
        .order_by("memoryDate", direction=firestore.Query.DESCENDING)
        .stream()
    )

    results = []
    for doc in docs:
        data = doc.to_dict()
        gcs_path = data.get("gcsPath")
        signed = _signed_url(gcs_path) if gcs_path else data.get("url", "")
        results.append(
            PhotoResponse(
                id=doc.id,
                url=signed,
                title=data["title"],
                description=data.get("description", ""),
                memoryDate=data["memoryDate"],
                uploadDate=data["uploadDate"],
                sizeBytes=data.get("sizeBytes", 0),
            )
        )

    return results


@app.post("/api/photos", response_model=PhotoResponse, status_code=201)
async def upload_photo(photo: PhotoUpload, user=Depends(get_current_user)):
    uid = user["uid"]

    if uid != photo.userId:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # ── Decode image bytes early so we know the size before the transaction ──
    if photo.url.startswith("data:"):
        header, base64_data = photo.url.split(",", 1)
        image_data = base64.b64decode(base64_data)
        mime_type = header.split(";")[0].split(":")[1]
        ext = mime_type.split("/")[1]
        incoming_size = len(image_data)
    else:
        image_data = None
        mime_type = None
        ext = None
        incoming_size = 0  # external URLs don't count toward storage

    # ── Enforce storage limit inside a Firestore transaction ─────────────────
    # Reads current usage and limit, then atomically increments if within limit.
    user_ref = db.collection("users").document(uid)

    @firestore.transactional
    def _check_and_add_storage(transaction, u_ref, size: int):
        snapshot = u_ref.get(transaction=transaction)
        if not snapshot.exists:
            raise HTTPException(status_code=404, detail="User not found")

        data = snapshot.to_dict()
        used       = data.get("storageUsedBytes", 0)
        is_premium = data.get("isPremium", False)
        limit      = _storage_limit(is_premium)

        if used + size > limit:
            raise HTTPException(status_code=403, detail="storage_limit_reached")

        transaction.update(u_ref, {"storageUsedBytes": used + size})

    transaction = db.transaction()
    _check_and_add_storage(transaction, user_ref, incoming_size)
    # ─────────────────────────────────────────────────────────────────────────

    # ── Upload image to GCS ──────────────────────────────────────────────────
    if image_data is not None:
        gcs_path = f"photos/{uid}/{uuid.uuid4()}.{ext}"
        blob = bucket.blob(gcs_path)
        blob.upload_from_string(image_data, content_type=mime_type)
        # Do NOT make_public() — serve via signed URLs only
        url = _signed_url(gcs_path)
    else:
        gcs_path = None
        url = photo.url
    # ─────────────────────────────────────────────────────────────────────────

    upload_date = datetime.now().isoformat()
    doc_data = {
        "userId":      uid,
        "gcsPath":     gcs_path,
        "sizeBytes":   incoming_size,
        "title":       photo.title,
        "description": photo.description or "",
        "memoryDate":  photo.memoryDate,
        "uploadDate":  upload_date,
    }

    _, ref = db.collection("photos").add(doc_data)

    return PhotoResponse(
        id=ref.id,
        url=url,
        title=photo.title,
        description=photo.description or "",
        memoryDate=photo.memoryDate,
        uploadDate=upload_date,
        sizeBytes=incoming_size,
    )


@app.delete("/api/photos/{photo_id}", status_code=204)
async def delete_photo(photo_id: str, user=Depends(get_current_user)):
    uid = user["uid"]

    photo_ref = db.collection("photos").document(photo_id)
    photo_doc = photo_ref.get()

    if not photo_doc.exists:
        raise HTTPException(status_code=404, detail="Photo not found")

    data = photo_doc.to_dict()

    if data["userId"] != uid:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # ── Delete file from GCS first ───────────────────────────────────────────
    gcs_path = data.get("gcsPath")
    if gcs_path:
        blob = bucket.blob(gcs_path)
        try:
            blob.delete()
        except Exception:
            # GCS object missing (already deleted externally) — continue cleanup
            pass
    # ─────────────────────────────────────────────────────────────────────────

    # ── Decrement storage counter + delete Firestore doc atomically ──────────
    size_freed = data.get("sizeBytes", 0)
    user_ref = db.collection("users").document(uid)

    @firestore.transactional
    def _delete_and_free(transaction, p_ref, u_ref, freed: int):
        user_snap = u_ref.get(transaction=transaction)
        current  = user_snap.to_dict().get("storageUsedBytes", 0) if user_snap.exists else 0
        new_used = max(0, current - freed)  # guard against going negative
        transaction.delete(p_ref)
        transaction.update(u_ref, {"storageUsedBytes": new_used})

    transaction = db.transaction()
    _delete_and_free(transaction, photo_ref, user_ref, size_freed)
    # ─────────────────────────────────────────────────────────────────────────


# ---------------- PAYMENT (mock) ----------------

@app.post("/api/users/{user_id}/payment")
async def process_payment(user_id: str, user=Depends(get_current_user)):
    """
    Mock payment endpoint. Replace the body with your real payment provider
    (e.g. Stripe webhook or checkout session verification) before going live.
    """
    if user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    if user_doc.to_dict().get("isPremium", False):
        return {"success": True, "message": "Already premium"}

    await asyncio.sleep(1.5)

    db.collection("users").document(user_id).update({"isPremium": True})
    return {"success": True}