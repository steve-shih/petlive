import os
from datetime import datetime, timedelta
from models import db, generate_uuid

def init_mock_data():
    print("開始清空現有資料...")
    db.users.delete_many({})
    db.products.delete_many({})
    db.bids.delete_many({})
    db.messages.delete_many({})
    db.orders.delete_many({})
    db.configs.delete_many({})
    print("資料庫已清空！")
    
    buyer1_id = generate_uuid()
    buyer2_id = generate_uuid()
    seller1_id = generate_uuid()
    seller2_id = generate_uuid()
    admin_id = generate_uuid()
    
    print("正在建立使用者...")
    users = [
        {"id": buyer1_id, "name": "買家阿傑", "phone": "test_buyer1", "password": "test123", "role": "BUYER", "tier": 0, "addons": [], "credit_score": 100, "following": [seller1_id, seller2_id], "is_test": True},
        {"id": buyer2_id, "name": "新手小菜", "phone": "test_buyer2", "password": "test123", "role": "BUYER", "tier": 0, "addons": [], "credit_score": 100, "following": [seller1_id], "is_test": True},
        {"id": seller1_id, "name": "甲蟲霸主", "phone": "test_seller1", "password": "test123", "role": "SELLER", "tier": 3, "addons": ["HIGH_TRAFFIC_LIVE"], "credit_score": 150, "following": [buyer1_id], "is_test": True},
        {"id": seller2_id, "name": "爬蟲大王", "phone": "test_seller2", "password": "test123", "role": "SELLER", "tier": 1, "addons": [], "credit_score": 180, "following": [], "is_test": True},
        {"id": admin_id, "name": "系統管理員", "phone": "admin", "password": "admin123", "role": "ADMIN", "tier": 3, "addons": ["HIGH_TRAFFIC_LIVE"], "credit_score": 200, "following": [], "is_test": False}
    ]
    db.users.insert_many(users)
    
    print("正在建立商品...")
    products = [
        {
            "id": generate_uuid(),
            "seller_id": seller1_id,
            "seller_name": "甲蟲霸主",
            "title": "長戟大兜蟲 DHH 150mm+",
            "description": "剛羽化完美個體，無斷爪，活動力極佳。附上影片與多張細節圖！",
            "main_category": "活體",
            "sub_category": "甲蟲",
            "type": "BID",
            "start_price": 3500,
            "current_price": 3500,
            "end_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "media_urls": [
                "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                "https://picsum.photos/seed/beetle1/800/600",
                "https://picsum.photos/seed/beetle2/800/600",
                "https://picsum.photos/seed/beetle3/800/600"
            ],
            "views": 1250,
            "status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": generate_uuid(),
            "seller_id": seller1_id,
            "seller_name": "甲蟲霸主",
            "title": "高蛋白甲蟲果凍 (50顆裝)",
            "description": "特製高蛋白配方，適合繁殖期母蟲補充營養。",
            "main_category": "相關產品",
            "sub_category": "耗材",
            "type": "BUY_NOW",
            "price": 250,
            "stock": 50,
            "media_urls": [
                "https://picsum.photos/seed/jelly/800/600"
            ],
            "views": 320,
            "status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": generate_uuid(),
            "seller_id": seller2_id,
            "seller_name": "爬蟲大王",
            "title": "豹紋守宮 (陽光橘)",
            "description": "兩個月大，穩定開口吃蟋蟀，適合新手飼養。",
            "main_category": "活體",
            "sub_category": "爬蟲",
            "type": "BID",
            "start_price": 1000,
            "current_price": 1800,
            "end_time": (datetime.utcnow() + timedelta(hours=5)).isoformat(),
            "media_urls": [
                "https://picsum.photos/seed/gecko1/800/600",
                "https://picsum.photos/seed/gecko2/800/600"
            ],
            "views": 890,
            "status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": generate_uuid(),
            "seller_id": seller2_id,
            "seller_name": "爬蟲大王",
            "title": "爬蟲專用保溫墊",
            "description": "可調溫，寒流來襲必備。",
            "main_category": "相關產品",
            "sub_category": "用品",
            "type": "BUY_NOW",
            "price": 450,
            "stock": 10,
            "media_urls": [
                "https://picsum.photos/seed/pad/800/600"
            ],
            "views": 45,
            "status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    db.products.insert_many(products)
    
    print("正在建立設定...")
    db.configs.insert_one({
        "id": "pricing",
        "tier_1_price": 500,
        "tier_2_price": 1000,
        "tier_3_price": 2000,
        "high_traffic_price": 1500
    })
    
    print("正在建立測試訊息...")
    messages = [
        {
            "id": generate_uuid(),
            "sender_id": buyer1_id,
            "receiver_id": seller1_id,
            "message_text": "請問這隻長戟大兜蟲還會再大嗎？",
            "created_at": (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        },
        {
            "id": generate_uuid(),
            "sender_id": seller1_id,
            "receiver_id": buyer1_id,
            "message_text": "哈囉！牠已經羽化成蟲，體長就固定囉！",
            "created_at": (datetime.utcnow() - timedelta(minutes=2)).isoformat()
        }
    ]
    db.messages.insert_many(messages)
    
    print("✅ 成功！所有測試資料已經寫入 MongoDB Atlas。")

if __name__ == '__main__':
    print("--- PetLive MongoDB Atlas 資料重置腳本 ---")
    confirm = input("這將會清空所有現有資料並寫入測試資料。確定要繼續嗎？(y/n): ")
    if confirm.lower() == 'y':
        init_mock_data()
    else:
        print("已取消。")
