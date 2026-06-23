import os
from datetime import datetime, timedelta
from models import db, generate_uuid

def init_mock_data():
    print("??皜征?暹?鞈?...")
    db.users.delete_many({})
    db.products.delete_many({})
    db.bids.delete_many({})
    db.messages.delete_many({})
    db.orders.delete_many({})
    db.configs.delete_many({})
    print("鞈?摨怠歇皜征嚗?)
    
    buyer1_id = generate_uuid()
    buyer2_id = generate_uuid()
    seller1_id = generate_uuid()
    seller2_id = generate_uuid()
    admin_id = generate_uuid()
    
    print("甇?撱箇?雿輻??..")
    users = [
        {"id": buyer1_id, "name": "鞎瑕振?踹?", "phone": "test_buyer1", "password": "test123", "role": "BUYER", "tier": 0, "addons": [], "credit_score": 100, "following": [seller1_id, seller2_id], "is_test": True},
        {"id": buyer2_id, "name": "?唳?撠?", "phone": "test_buyer2", "password": "test123", "role": "BUYER", "tier": 0, "addons": [], "credit_score": 100, "following": [seller1_id], "is_test": True},
        {"id": seller1_id, "name": "?脰?訾蜓", "phone": "test_seller1", "password": "test123", "role": "SELLER", "tier": 3, "addons": ["HIGH_TRAFFIC_LIVE"], "credit_score": 150, "following": [buyer1_id], "is_test": True},
        {"id": seller2_id, "name": "?祈憭抒?", "phone": "test_seller2", "password": "test123", "role": "SELLER", "tier": 1, "addons": [], "credit_score": 180, "following": [], "is_test": True},
        {"id": admin_id, "name": "蝟餌絞蝞∠???, "phone": "admin", "password": "admin123", "role": "ADMIN", "tier": 3, "addons": ["HIGH_TRAFFIC_LIVE"], "credit_score": 200, "following": [], "is_test": False}
    ]
    db.users.insert_many(users)
    
    print("甇?撱箇???...")
    products = [
        {
            "id": generate_uuid(),
            "seller_id": seller1_id,
            "seller_name": "?脰?訾蜓",
            "title": "?瑟?憭批???DHH 150mm+",
            "description": "?噬??蝢?嚗?瑞嚗暑??璆萎蔔??銝蔣??憭撐蝝啁???",
            "main_category": "瘣駁?",
            "sub_category": "?脰",
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
            "seller_name": "?脰?訾蜓",
            "title": "擃??賜?脫???(50憿?)",
            "description": "?寡ˊ擃??賡??對??拙?蝜????脰???擗?,
            "main_category": "?賊??Ｗ?",
            "sub_category": "??",
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
            "seller_name": "?祈憭抒?",
            "title": "鞊寧?摰悅 (?賢?璈?",
            "description": "?拙?憭改?蝛拙?????嚗??ˉ擗?,
            "main_category": "瘣駁?",
            "sub_category": "?祈",
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
            "seller_name": "?祈憭抒?",
            "title": "?祈撠靽澈憓?,
            "description": "?航矽皞恬?撖?靘必敹???,
            "main_category": "?賊??Ｗ?",
            "sub_category": "?典?",
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
    
    print("甇?撱箇?閮剖?...")
    db.configs.insert_one({
        "id": "pricing",
        "tier_1_price": 500,
        "tier_2_price": 1000,
        "tier_3_price": 2000,
        "high_traffic_price": 1500
    })
    
    print("甇?撱箇?皜祈岫閮...")
    messages = [
        {
            "id": generate_uuid(),
            "sender_id": buyer1_id,
            "receiver_id": seller1_id,
            "message_text": "隢???瑟?憭批??脤???憭批?嚗?,
            "created_at": (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        },
        {
            "id": generate_uuid(),
            "sender_id": seller1_id,
            "receiver_id": buyer1_id,
            "message_text": "??嚗?撌脩?蝢賢??嚗??瑕停?箏???",
            "created_at": (datetime.utcnow() - timedelta(minutes=2)).isoformat()
        }
    ]
    db.messages.insert_many(messages)
    
    print("????嚗??葫閰西??歇蝬神??MongoDB Atlas??)

if __name__ == '__main__':
    print("--- PetBar MongoDB Atlas 鞈??蔭?單 ---")
    confirm = input("????蝛箸?????蒂撖怠皜祈岫鞈??Ⅱ摰?蝜潛???(y/n): ")
    if confirm.lower() == 'y':
        init_mock_data()
    else:
        print("撌脣?瘨?)
