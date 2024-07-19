from datetime import datetime, timedelta, timezone
from typing import Optional, List

import jwt
from jwt import PyJWTError
from fastapi import Depends, FastAPI, HTTPException, status, Form, Body
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field

# Configuration settings
class Settings:
    mongodb_url = "mongodb://localhost:27017"
    secret_key = "your_secret_key_here"
    algorithm = "HS256"
    access_token_expire_minutes = 30

settings = Settings()

# MongoDB setup
client = MongoClient(settings.mongodb_url)
db = client['phonebook-user']
users_collection = db['users']
phonebook = db['phonebook']

# Models
class User(BaseModel):
    username: str
    email: str

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PhonebookEntry(BaseModel):
    user_id : str
    name: str
    phonenumber: str

class PhonebookEntryResponse(PhonebookEntry):
    id: str = Field(default_factory=lambda: str(ObjectId()))

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str = Field(...)
    password: str = Field(...)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def get_user(email: str):
    user_dict = users_collection.find_one({"email": email})
    if user_dict:
        return UserInDB(**user_dict)

# FastAPI app
app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.ExpiredSignatureError:
        raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception
    user = get_user(token_data.username)
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=UserInDB)
async def register(user: RegisterRequest):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    user_dict = {"username": user.username, "email": user.email, "hashed_password": hashed_password}
    users_collection.insert_one(user_dict)
    access_token = create_access_token(data={"sub": user.email})
    response_data = {
        "user": {"username": user.username, "email": user.email},
        "access_token": access_token,
        "token_type": "bearer"
    }
    return response_data

@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        # Here, you can add logic to blacklist or invalidate the token
        # For simplicity, let's just assume the token is invalidated
        return {"message": "Logout successful"}
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.post("/login", response_class=JSONResponse, response_model=Token)
async def login(user_cred : LoginRequest):
    user = get_user(user_cred.email)
    if not user or not verify_password(user_cred.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    response_data = {
        "access_token": access_token,
        "token_type": "bearer"
    }
    return response_data


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    response_data = {
        "access_token": access_token,
        "token_type": "bearer"
    }
    return response_data

@app.post("/phonebook/", response_class=JSONResponse, response_model=PhonebookEntryResponse)
async def create_phonebook_entry(
    entry: PhonebookEntry,
    current_user: UserInDB = Depends(get_current_user)
):
    entry_dict = entry.dict()
    entry_dict['user_id'] = current_user.email
    result = phonebook.insert_one(entry_dict)
    entry_id = str(result.inserted_id)

    response_data = {
        "id": entry_id,
        "name": entry.name,
        "phonenumber": entry.phonenumber,
        "user_id": current_user.email  # Ensure user_id is set correctly
    }
    return response_data


@app.get("/phonebook/", response_class=JSONResponse, response_model=List[PhonebookEntryResponse])
async def read_phonebook_entries(current_user: UserInDB = Depends(get_current_user)):
    entries = list(phonebook.find({"user_id": current_user.email}))
    
    response_data = []
    for entry in entries:
        response_data.append(PhonebookEntryResponse(
            id=str(entry.get('_id')),
            name=entry.get('name'),
            phonenumber=entry.get('phonenumber'),
            user_id=entry.get('user_id')
        ))
    
    return response_data

@app.get("/phonebook/{entry_id}", response_class=JSONResponse, response_model=PhonebookEntryResponse)
async def read_phonebook_entry(
    entry_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    entry = phonebook.find_one({"_id": ObjectId(entry_id), "user_id": current_user.email})
    if entry:
        response_data = {
            "id": str(entry.get('_id')),
            "name": entry.get('name'),
            "phonenumber": entry.get('phonenumber'),
            "user_id": entry.get('user_id')
        }
        return response_data
    raise HTTPException(status_code=404, detail="Phonebook entry not found")

@app.put("/phonebook/{entry_id}", response_class=JSONResponse, response_model=PhonebookEntryResponse)
async def update_phonebook_entry(
    entry_id: str,
    entry: PhonebookEntry,
    current_user: UserInDB = Depends(get_current_user)
):
    entry_dict = entry.dict()
    existing_entry = phonebook.find_one({"_id": ObjectId(entry_id), "user_id": current_user.email})
    if existing_entry:
        result = phonebook.update_one({"_id": ObjectId(entry_id)}, {"$set": entry_dict})
        if result.modified_count == 1:
            response_data = {
                "id": entry_id,
                "name": entry.name,
                "phonenumber": entry.phonenumber,
                "user_id": entry.user_id
            }
            return response_data
    raise HTTPException(status_code=404, detail="Phonebook entry not found")

@app.delete("/phonebook/{entry_id}", response_class=JSONResponse)
async def delete_phonebook_entry(
    entry_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    result = phonebook.delete_one({"_id": ObjectId(entry_id), "user_id": current_user.email})
    if result.deleted_count == 1:
        return {"message": "Phonebook entry deleted successfully"}
    raise HTTPException(status_code=404, detail="Phonebook entry not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
