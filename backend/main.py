from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from livekit import api

load_dotenv()

app = FastAPI(title="PetLive API - Mock Version")

# Allow CORS for Next.js frontend (port 3388)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all. In production, restrict to app domains.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOCK DATA ---
MOCK_SHOPS = [
    {
        "id": "shop-001",
        "name": "極光英國短毛貓舍",
        "license_number": "特寵業繁字第A110001號",
        "description": "專營純種英國短毛貓，合法登記，絕不近親繁殖。我們致力於培育健康、親人的英短寶寶。",
        "avatar": "🐱",
        "is_live": True,
        "media": {
            "photos": [
                "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80"
            ],
            "videos": [
                # Mock video URL (using a placeholder or generic video)
                "https://www.w3schools.com/html/mov_bbb.mp4"
            ]
        },
        "pets": [
            {"id": "p1", "name": "銀漸層弟弟", "price": 45000, "deposit": 5000, "status": "AVAILABLE"},
            {"id": "p2", "name": "金漸層妹妹", "price": 55000, "deposit": 5000, "status": "RESERVED"}
        ]
    },
    {
        "id": "shop-002",
        "name": "忠犬小八柴犬莊園",
        "license_number": "特寵業繁字第B220002號",
        "description": "日本柴犬專門犬舍，擁有廣大戶外跑跑草皮，保證狗狗身心健康。",
        "avatar": "🐕",
        "is_live": False,
        "media": {
            "photos": [
                "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80"
            ],
            "videos": []
        },
        "pets": [
            {"id": "p3", "name": "赤柴弟弟", "price": 35000, "deposit": 3000, "status": "AVAILABLE"}
        ]
    }
]

MOCK_LIVE_STREAMS = {
    "live-001": {
        "id": "live-001",
        "shop_id": "shop-001",
        "title": "🔴 剛滿月的小英短初登場！開放預訂中",
        "viewers": 128,
        "status": "LIVE",
        # We can use a dummy HLS stream or an MP4 for the mock frontend
        "stream_url": "https://www.w3schools.com/html/mov_bbb.mp4" 
    }
}


# --- ROUTES ---

@app.get("/")
def read_root():
    return {"message": "Welcome to PetLive API"}

@app.get("/api/shops")
def get_shops():
    """取得所有店家列表"""
    # Return basic info without heavy media arrays to save bandwidth
    return [
        {
            "id": s["id"], 
            "name": s["name"], 
            "avatar": s["avatar"], 
            "is_live": s["is_live"],
            "license": s["license_number"]
        } 
        for s in MOCK_SHOPS
    ]

@app.get("/api/shops/{shop_id}")
def get_shop_details(shop_id: str):
    """取得單一店家詳細資訊、照片、影片與寵物列表"""
    for shop in MOCK_SHOPS:
        if shop["id"] == shop_id:
            return shop
    return {"error": "Shop not found"}, 404

@app.get("/api/live/{live_id}")
def get_live_stream(live_id: str):
    """取得特定直播串流資訊"""
    if live_id in MOCK_LIVE_STREAMS:
        return MOCK_LIVE_STREAMS[live_id]
    return {"error": "Live stream not found"}, 404

@app.get("/api/livekit/token")
def get_livekit_token(room: str, participant: str, is_host: bool = False):
    """產生 LiveKit Access Token"""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="Missing LiveKit API Credentials in .env")
        
    grant = api.VideoGrants(
        room_join=True,
        room=room,
        can_publish=is_host,
        can_publish_data=True,
        can_subscribe=True
    )
    
    access_token = api.AccessToken(api_key, api_secret)
    access_token = access_token.with_grants(grant).with_identity(participant).with_name(participant)
    jwt_token = access_token.to_jwt()
    
    return {
        "token": jwt_token,
        "url": os.getenv("LIVEKIT_URL")
    }
