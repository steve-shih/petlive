from flask import Blueprint, jsonify, request
from models import db, generate_uuid
from datetime import datetime
import os
import time
from werkzeug.utils import secure_filename

api_bp = Blueprint('api', __name__)

# Mesh WebRTC Tree Storage
# MESH_TREES[room_id] = { peer_id: {"children": [], "parent": parent_peer_id} }
MESH_TREES = {}

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@api_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        safe_name = f"{int(time.time())}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, safe_name)
        file.save(filepath)
        url = f"http://127.0.0.1:5000/uploads/{safe_name}"
        return jsonify({'url': url})

@api_bp.route('/users', methods=['GET'])
def get_all_users():
    users = list(db.users.find({}, {"_id": 0}))
    return jsonify([{
        'id': u.get('id'),
        'name': u.get('name'),
        'role': u.get('role'),
        'is_test': u.get('is_test', u.get('role') != 'ADMIN'),
        'credit_score': u.get('credit_score')
    } for u in users])

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    phone_or_email = data.get('username')
    password = data.get('password')
    # Mock validation: Accept any non-empty password for now
    if not phone_or_email or not password:
        return jsonify({'error': '請輸入帳號與密碼'}), 400
        
    # Find user by phone, email, or just name (mock)
    user = db.users.find_one({"$or": [{"phone": phone_or_email}, {"email": phone_or_email}, {"name": phone_or_email}]})
    if not user:
        return jsonify({'error': '帳號不存在'}), 401
        
    # Check password
    if user.get('password') and user.get('password') != password:
        return jsonify({'error': '密碼錯誤'}), 401
        
    return jsonify({
        'message': '登入成功',
        'user': {
            'id': user.get('id'),
            'name': user.get('name'),
            'role': user.get('role'),
            'is_test': user.get('is_test', user.get('role') != 'ADMIN')
        }
    })

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@api_bp.route('/auth/google', methods=['POST'])
def google_login():
    data = request.json
    token = data.get('token')
    if not token:
        return jsonify({'error': 'Missing token'}), 400
        
    try:
        # Use placeholder client ID or read from env
        # google-auth verify_oauth2_token verifies the token is valid
        # We allow any client_id for testing if we skip client_id check, but for security we should provide it.
        # Here we read from env or use the placeholder
        client_id = os.environ.get('GOOGLE_CLIENT_ID', '788146443516-97ieiv3lpoauiehkpk7cnqnv82tqgh0v.apps.googleusercontent.com')
        
        # Verify token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')
        
        if not email:
            return jsonify({'error': '無法取得 Google Email'}), 400
            
        # Find user
        user = db.users.find_one({"email": email})
        
        if not user:
            # Auto Register
            new_user = {
                "id": generate_uuid(),
                "name": name,
                "role": "BUYER",
                "credit_score": 100,
                "following": [],
                "is_test": False,
                "email": email,
                "google_id": google_id
            }
            db.users.insert_one(new_user)
            user = new_user
            
        return jsonify({
            'message': 'Google 登入成功',
            'user': {
                'id': user.get('id'),
                'name': user.get('name'),
                'role': user.get('role'),
                'is_test': user.get('is_test', user.get('role') != 'ADMIN')
            }
        })
        
    except ValueError as e:
        print(f"Google Token error: {e}")
        return jsonify({'error': 'Google Token 驗證失敗'}), 401

import jwt
import requests

@api_bp.route('/auth/line', methods=['POST'])
def line_login():
    data = request.json
    code = data.get('code')
    redirect_uri = data.get('redirect_uri')
    
    if not code or not redirect_uri:
        return jsonify({'error': '缺少授權碼'}), 400
        
    channel_id = "2010452149"
    channel_secret = "12a894a8f62cf0d08b8c4dd6dce53394"
    
    token_url = "https://api.line.me/oauth2/v2.1/token"
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': channel_id,
        'client_secret': channel_secret
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        res = requests.post(token_url, data=payload, headers=headers)
        res_data = res.json()
        
        if 'error' in res_data:
            print("LINE Token Error:", res_data)
            return jsonify({'error': res_data.get('error_description', 'LINE 授權失敗')}), 400
            
        id_token_str = res_data.get('id_token')
        if not id_token_str:
            return jsonify({'error': '無法取得 LINE ID Token'}), 400
            
        decoded = jwt.decode(id_token_str, channel_secret, algorithms=["HS256"], audience=channel_id, issuer="https://access.line.me")
        
        line_id = decoded.get('sub')
        name = decoded.get('name')
        email = decoded.get('email')
        picture = decoded.get('picture')
        
        user = None
        if email:
            user = db.users.find_one({"email": email})
        if not user:
            user = db.users.find_one({"line_id": line_id})
            
        if not user:
            new_user = {
                "id": generate_uuid(),
                "name": name,
                "role": "BUYER",
                "credit_score": 100,
                "following": [],
                "is_test": False,
                "email": email,
                "line_id": line_id,
                "avatar": picture
            }
            db.users.insert_one(new_user)
            user = new_user
        else:
            updates = {}
            if not user.get('line_id'):
                updates['line_id'] = line_id
            if not user.get('avatar') and picture:
                updates['avatar'] = picture
            if updates:
                db.users.update_one({"id": user['id']}, {"$set": updates})
            
        return jsonify({
            'message': 'LINE 登入成功',
            'user': {
                'id': user.get('id'),
                'name': user.get('name'),
                'role': user.get('role'),
                'is_test': user.get('is_test', user.get('role') != 'ADMIN')
            }
        })
        
    except Exception as e:
        print(f"LINE Login error: {e}")
        return jsonify({'error': 'LINE 登入處理發生錯誤'}), 500


@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    method = data.get('method') # 'PHONE' or 'EMAIL'
    contact = data.get('contact')
    password = data.get('password')
    code = data.get('code')
    name = data.get('name')
    role = data.get('role', 'BUYER')
    
    if not contact or not password or not code or not name:
        return jsonify({'error': '請填寫所有欄位'}), 400
        
    if code != '123456': # Mock verification code
        return jsonify({'error': '驗證碼錯誤 (測試期間請輸入 123456)'}), 400
        
    # Check if exists
    existing = db.users.find_one({("phone" if method == 'PHONE' else "email"): contact})
    if existing:
        return jsonify({'error': '此帳號已註冊'}), 400
        
    new_user = {
        "id": generate_uuid(),
        "name": name,
        "role": role,
        "credit_score": 100,
        "following": [],
        "is_test": False,
        "phone": contact if method == 'PHONE' else None,
        "email": contact if method == 'EMAIL' else None
    }
    db.users.insert_one(new_user)
    
    return jsonify({'message': '註冊成功'})

@api_bp.route('/admin/test-users', methods=['GET'])
def get_test_users():
    admin_id = request.args.get('admin_id')
    admin = db.users.find_one({"id": admin_id, "role": "ADMIN"})
    if not admin:
        return jsonify({'error': '無權限'}), 403
        
    test_users = list(db.users.find({"is_test": True}, {"_id": 0}))
    return jsonify([{
        'id': u.get('id'),
        'name': u.get('name'),
        'role': u.get('role'),
        'phone': u.get('phone') or u.get('email') or '未設定',
        'password': u.get('password') or '未設定'
    } for u in test_users])


@api_bp.route('/bids', methods=['POST'])
def place_bid():
    data = request.json
    product_id = data.get('product_id')
    user_id = data.get('user_id')
    bid_amount = int(data.get('bid_amount', 0))
    
    auto_bid_max = int(data.get('auto_bid_max', 0))
    
    product = db.products.find_one({"id": product_id})
    if not product or product.get('type') != 'BID':
        return jsonify({'error': 'Invalid product'}), 400
        
    end_time_str = product.get('end_time')
    if end_time_str and datetime.fromisoformat(end_time_str) < datetime.utcnow():
        return jsonify({'error': 'Bidding has ended'}), 400
        
    if bid_amount <= product.get('current_price', 0):
        return jsonify({'error': 'Bid amount must be higher than current price'}), 400
        
    user = db.users.find_one({"id": user_id})
    
    # 1. Place the explicit bid
    db.bids.insert_one({
        "id": generate_uuid(),
        "product_id": product_id,
        "user_id": user_id,
        "user_name": user.get('name'),
        "bid_amount": bid_amount,
        "auto_bid_max": auto_bid_max,
        "created_at": datetime.utcnow().isoformat()
    })
    
    current_highest = bid_amount
    db.products.update_one({"id": product_id}, {"$set": {"current_price": current_highest}})
    
    # 2. Proxy Bidding Resolution (Find the highest proxy bid from other users)
    # We find the max auto_bid_max among all other users for this product
    other_proxy_bids = list(db.bids.find({
        "product_id": product_id, 
        "user_id": {"$ne": user_id}, 
        "auto_bid_max": {"$gt": current_highest}
    }).sort("auto_bid_max", -1))
    
    if other_proxy_bids:
        highest_proxy = other_proxy_bids[0]
        # If the other person's max is higher or equal to our new bid+50, they outbid us
        new_proxy_amount = current_highest + 50
        if new_proxy_amount <= highest_proxy.get('auto_bid_max'):
            # The proxy user auto-bids!
            db.bids.insert_one({
                "id": generate_uuid(),
                "product_id": product_id,
                "user_id": highest_proxy['user_id'],
                "user_name": highest_proxy['user_name'],
                "bid_amount": new_proxy_amount,
                "auto_bid_max": highest_proxy['auto_bid_max'],
                "created_at": datetime.utcnow().isoformat(),
                "is_proxy_auto": True
            })
            db.products.update_one({"id": product_id}, {"$set": {"current_price": new_proxy_amount}})
    
    return jsonify({'message': 'Bid placed successfully'})

@api_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    buyer_id = data.get('buyer_id')
    
    order_id = generate_uuid()
    db.orders.insert_one({
        "id": order_id,
        "buyer_id": buyer_id,
        "shipping_method": data.get('shipping_method'),
        "shipping_fee": data.get('shipping_fee'),
        "shipping_details": data.get('shipping_details'),
        "total_amount": data.get('total_amount'),
        "items": data.get('items', []),
        "status": "NEGOTIATING",
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({"message": "Order created successfully", "order_id": order_id}), 201

@api_bp.route('/orders/<order_id>/status', methods=['POST'])
def update_order_status(order_id):
    data = request.json
    new_status = data.get('status') # TOSHIP, SHIPPED, COMPLETED
    if not new_status:
        return jsonify({'error': 'Missing status'}), 400
        
    order = db.orders.find_one({"id": order_id})
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    db.orders.update_one({"id": order_id}, {"$set": {"status": new_status, "updated_at": datetime.utcnow().isoformat()}})
    return jsonify({"message": f"Order status updated to {new_status}"}), 200
# ==========================================
# WebRTC 1-on-1 Video Call Signaling API
# ==========================================

@api_bp.route('/calls', methods=['POST'])
def create_call():
    data = request.json
    caller_id = data.get('caller_id')
    receiver_id = data.get('receiver_id')
    offer = data.get('offer') # JSON string or dict
    
    if not caller_id or not receiver_id or not offer:
        return jsonify({'error': 'Missing required fields'}), 400
        
    call_id = generate_uuid()
    db.calls.insert_one({
        "id": call_id,
        "caller_id": caller_id,
        "receiver_id": receiver_id,
        "status": "CALLING",
        "offer": offer,
        "answer": None,
        "caller_candidates": [],
        "receiver_candidates": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return jsonify({"message": "Call initiated", "call_id": call_id}), 201

@api_bp.route('/calls/incoming', methods=['GET'])
def check_incoming_calls():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    # Find any active call where receiver_id == user_id and status is CALLING
    incoming_call = db.calls.find_one({
        "receiver_id": user_id,
        "status": "CALLING"
    }, {"_id": 0})
    
    if incoming_call:
        caller = db.users.find_one({"id": incoming_call.get('caller_id')})
        incoming_call['caller_name'] = caller.get('name') if caller else 'Unknown'
        return jsonify({"incoming": incoming_call})
        
    return jsonify({"incoming": None})

@api_bp.route('/calls/<call_id>', methods=['GET'])
def get_call(call_id):
    call = db.calls.find_one({"id": call_id}, {"_id": 0})
    if not call:
        return jsonify({'error': 'Call not found'}), 404
    return jsonify(call)

@api_bp.route('/calls/<call_id>/answer', methods=['POST'])
def answer_call(call_id):
    data = request.json
    answer = data.get('answer')
    
    db.calls.update_one(
        {"id": call_id},
        {"$set": {
            "answer": answer,
            "status": "ACCEPTED",
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    return jsonify({"message": "Call answered"})

@api_bp.route('/calls/<call_id>/candidates', methods=['POST'])
def add_ice_candidate(call_id):
    data = request.json
    candidate = data.get('candidate')
    is_caller = data.get('is_caller')
    
    field = "caller_candidates" if is_caller else "receiver_candidates"
    
    db.calls.update_one(
        {"id": call_id},
        {"$push": {field: candidate}}
    )
    return jsonify({"message": "Candidate added"})

@api_bp.route('/calls/<call_id>/end', methods=['POST'])
def end_call(call_id):
    db.calls.update_one(
        {"id": call_id},
        {"$set": {
            "status": "ENDED",
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    return jsonify({"message": "Call ended"})

@api_bp.route('/messages', methods=['GET'])
def get_messages():
    user1_id = request.args.get('user1')
    user2_id = request.args.get('user2')
    
    if not user1_id or not user2_id:
        return jsonify({'error': 'Missing user ids'}), 400
        
    msgs = list(db.messages.find({
        "$or": [
            {"sender_id": user1_id, "receiver_id": user2_id},
            {"sender_id": user2_id, "receiver_id": user1_id}
        ]
    }, {"_id": 0}).sort("created_at", 1))
    
    return jsonify(msgs)

@api_bp.route('/messages', methods=['POST'])
def send_message():
    data = request.json
    sender_id = data['sender_id']
    receiver_id = data['receiver_id']
    
    sender = db.users.find_one({"id": sender_id})
    receiver = db.users.find_one({"id": receiver_id})
    
    # Check Blacklist
    if receiver_id in sender.get('blocked_users', []):
        return jsonify({'error': '您已封鎖此對象，無法發送訊息。'}), 403
    if sender_id in receiver.get('blocked_users', []):
        return jsonify({'error': '您已被對方封鎖，無法發送訊息。'}), 403

    db.messages.insert_one({
        "id": generate_uuid(),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "message_text": data['message_text'],
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({'message': 'Message sent'})

@api_bp.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    u = db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        return jsonify({'error': 'User not found'}), 404
        
    u['tier'] = u.get('tier', 0)
    u['addons'] = u.get('addons', [])
        
    orders = list(db.orders.find({"buyer_id": user_id}, {"_id": 0}))
    u['orders'] = orders
    
    # Fetch bids
    bids = list(db.bids.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1))
    u['bids'] = bids
    
    # Fetch winnings (orders where this user is buyer, or from products where winner_id == user_id)
    # For MVP, we can filter orders that are completed or shipped as 'winnings'
    winnings = list(db.orders.find({"buyer_id": user_id}, {"_id": 0}))
    u['winnings'] = winnings
    
    # Fetch watchlist
    watchlist_ids = u.get('watchlist', [])
    if watchlist_ids:
        watchlist = list(db.products.find({"id": {"$in": watchlist_ids}}, {"_id": 0}))
        u['watchlist'] = watchlist
    else:
        u['watchlist'] = []
        
    u['notifications'] = [] # Mock notifications can be injected frontend
    
    # Return gallery (default to empty list if not exists)
    u['gallery'] = u.get('gallery', [])
    
    # If SELLER, return their products
    if u.get('role') in ['SELLER', 'ADMIN']:
        my_products = list(db.products.find({"seller_id": user_id}, {"_id": 0}).sort("created_at", -1))
        
        # Format media_urls fallback just like get_products
        for p in my_products:
            media_urls = p.get('media_urls', [])
            p['image_url'] = next((url for url in media_urls if not url.endswith('.mp4')), p.get('image_url', ''))
            
        u['my_products'] = my_products
        
    # Reset daily views if it's a new day
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    if u.get('last_view_date') != today_str:
        u['daily_views'] = 0
        db.users.update_one({"id": user_id}, {"$set": {"daily_views": 0, "last_view_date": today_str}})
        
    return jsonify(u)

@api_bp.route('/user/<user_id>/settings', methods=['GET', 'PUT'])
def user_settings(user_id):
    if request.method == 'GET':
        user = db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user.get("settings", {}))
    
    if request.method == 'PUT':
        data = request.json
        user = db.users.find_one({"id": user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        settings = user.get("settings", {})
        # Update settings (bio, phone, addresses, preferences)
        settings.update(data)
        
        db.users.update_one({"id": user_id}, {"$set": {"settings": settings}})
        return jsonify({"message": "Settings updated successfully", "settings": settings})

@api_bp.route('/users/<user_id>/view', methods=['POST'])
def view_user(user_id):
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    u = db.users.find_one({"id": user_id})
    if u:
        if u.get('last_view_date') != today_str:
            db.users.update_one({"id": user_id}, {"$set": {"daily_views": 1, "last_view_date": today_str}})
        else:
            db.users.update_one({"id": user_id}, {"$inc": {"daily_views": 1}})
    return jsonify({'message': 'ok'})

@api_bp.route('/users/<user_id>/gallery', methods=['POST'])
def add_gallery_media(user_id):
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'Missing url'}), 400
        
    media_type = 'VIDEO' if url.endswith('.mp4') or url.endswith('.webm') else 'IMAGE'
    
    description = data.get('description', '')
    
    new_media = {
        "id": generate_uuid(),
        "type": media_type,
        "url": url,
        "description": description,
        "created_at": datetime.utcnow().isoformat()
    }
    
    db.users.update_one(
        {"id": user_id},
        {"$push": {"gallery": {"$each": [new_media], "$position": 0}}} # Push to front
    )
    return jsonify({'message': 'Media added', 'media': new_media}), 201

@api_bp.route('/users/<user_id>/gallery/<media_id>', methods=['DELETE'])
def delete_gallery_media(user_id, media_id):
    db.users.update_one(
        {"id": user_id},
        {"$pull": {"gallery": {"id": media_id}}}
    )
    return jsonify({'message': 'Media deleted'})

@api_bp.route('/users/<user_id>/following', methods=['GET'])
def get_following(user_id):
    u = db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        return jsonify({'error': 'User not found'}), 404
        
    following_ids = u.get('following', [])
    friends = list(db.users.find({"id": {"$in": following_ids}}, {"_id": 0, "id": 1, "name": 1, "role": 1}))
    
    return jsonify({
        "ids": following_ids,
        "details": friends
    })

@api_bp.route('/users/<user_id>/follow', methods=['POST'])
def toggle_follow(user_id):
    data = request.json
    target_id = data.get('target_id')
    
    u = db.users.find_one({"id": user_id})
    if not u:
        return jsonify({'error': 'User not found'}), 404
        
    following = u.get('following', [])
    if target_id in following:
        following.remove(target_id)
        action = "unfollowed"
    else:
        following.append(target_id)
        action = "followed"
        
    db.users.update_one({"id": user_id}, {"$set": {"following": following}})
    return jsonify({'message': 'ok', 'action': action, 'following': following})

@api_bp.route('/users/<user_id>/block', methods=['POST'])
def toggle_block(user_id):
    data = request.json
    target_id = data.get('target_id')
    
    u = db.users.find_one({"id": user_id})
    if not u:
        return jsonify({'error': 'User not found'}), 404
        
    # Transaction Protection Check
    # Check if there are active bids between these two users
    # For MVP, if user_id is buyer and target is seller of an active bid product, block fails
    active_bids = list(db.bids.find({
        "$or": [
            {"user_id": user_id},
            {"user_id": target_id}
        ]
    }))
    
    # Simple logic: if they have interacted in bids, we check if product is still active
    for bid in active_bids:
        product = db.products.find_one({"id": bid['product_id']})
        if product and product.get('status') == 'ACTIVE':
            # Check if one is seller and one is buyer of this product
            if (product['seller_id'] == target_id and bid['user_id'] == user_id) or \
               (product['seller_id'] == user_id and bid['user_id'] == target_id):
                return jsonify({'error': '交易中（有活躍的競標或訂單），不可封鎖！'}), 400

    blocked = u.get('blocked_users', [])
    if target_id in blocked:
        blocked.remove(target_id)
        action = "unblocked"
    else:
        blocked.append(target_id)
        action = "blocked"
        
    db.users.update_one({"id": user_id}, {"$set": {"blocked_users": blocked}})
    return jsonify({'message': 'ok', 'action': action})

# --- Live Streaming APIs ---
@api_bp.route('/live/rooms', methods=['GET'])
def get_live_rooms():
    rooms = list(db.live_rooms.find({"status": "LIVE"}, {"_id": 0}))
    return jsonify(rooms)

@api_bp.route('/live/rooms', methods=['POST'])
def create_live_room():
    data = request.json
    streamer_id = data.get('streamer_id')
    
    streamer = db.users.find_one({"id": streamer_id})
    if not streamer:
        return jsonify({'error': 'User not found'}), 404
        
    tier = streamer.get('tier', 0)
    if tier < 3:
        return jsonify({'error': '需要升級「買賣競標直播」階級才能開啟直播'}), 403
        
    addons = streamer.get('addons', [])
    is_high_traffic = "HIGH_TRAFFIC_LIVE" in addons
        
    room_id = generate_uuid()
    room = {
        "id": room_id,
        "streamer_id": streamer_id,
        "streamer_name": streamer.get('name'),
        "title": data.get('title', f"{streamer.get('name')} 的直播間"),
        "status": "LIVE",
        "high_traffic": is_high_traffic,
        "max_layers": data.get('max_layers', 3),
        "layer_0_capacity": data.get('layer_0_capacity', 4),
        "layer_n_capacity": data.get('layer_n_capacity', 4),
        "created_at": datetime.utcnow().isoformat()
    }
    db.live_rooms.insert_one(room)
    room.pop('_id', None) # Remove ObjectId before JSON serialization
    return jsonify({'message': 'Live room created', 'room': room}), 201

@api_bp.route('/live/rooms/<room_id>/end', methods=['POST'])
def end_room(room_id):
    db.live_rooms.update_one({'id': room_id}, {'$set': {'status': 'ENDED'}})
    return jsonify({'message': 'Room ended'})

@api_bp.route('/live/rooms/<room_id>/thumbnail', methods=['POST'])
def update_room_thumbnail(room_id):
    data = request.json
    thumbnail = data.get('thumbnail')
    if thumbnail:
        db.live_rooms.update_one({'id': room_id}, {'$set': {'thumbnail_url': thumbnail}})
    return jsonify({'message': 'Thumbnail updated'})

import os
import time

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@api_bp.route('/live/upload-record', methods=['POST'])
def upload_live_record():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file'}), 400
        
    video = request.files['video']
    user_id = request.form.get('user_id')
    room_id = request.form.get('room_id')
    
    if video.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    filename = f"{user_id}_{room_id}_{int(time.time())}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    video.save(filepath)
    
    media_url = f"/uploads/{filename}"
    
    media_doc = {
        "id": generate_uuid(),
        "user_id": user_id,
        "room_id": room_id,
        "type": "LIVE_RECORD",
        "url": media_url,
        "status": "PRIVATE",
        "created_at": datetime.utcnow().isoformat()
    }
    db.media.insert_one(media_doc)
    return jsonify({'message': 'Video uploaded successfully', 'media': media_doc})

@api_bp.route('/media/<user_id>', methods=['GET'])
def get_user_media(user_id):
    media_list = list(db.media.find({'user_id': user_id, 'type': 'LIVE_RECORD'}, {'_id': 0}).sort('created_at', -1))
    return jsonify(media_list)

@api_bp.route('/media/<media_id>/status', methods=['POST'])
def update_media_status(media_id):
    data = request.json
    status = data.get('status')
    if status in ['PUBLIC', 'PRIVATE']:
        db.media.update_one({'id': media_id}, {'$set': {'status': status}})
        return jsonify({'message': 'Status updated'})
    return jsonify({'error': 'Invalid status'}), 400

@api_bp.route('/media/<media_id>', methods=['DELETE'])
def delete_media(media_id):
    media = db.media.find_one({'id': media_id})
    if media:
        filepath = os.path.join(UPLOAD_FOLDER, os.path.basename(media['url']))
        if os.path.exists(filepath):
            os.remove(filepath)
        db.media.delete_one({'id': media_id})
    return jsonify({'message': 'Deleted'})


@api_bp.route('/live/rooms/<room_id>/peer', methods=['PUT'])
def update_live_room_peer(room_id):
    data = request.json
    peer_id = data.get('peer_id')
    db.live_rooms.update_one({"id": room_id}, {"$set": {"streamer_peer_id": peer_id}})
    
    # Initialize Mesh tree for this room
    if room_id not in MESH_TREES:
        MESH_TREES[room_id] = {}
    MESH_TREES[room_id][peer_id] = {"children": [], "parent": None, "layer": 0}
    
    return jsonify({'message': 'Peer ID updated'})

@api_bp.route('/live/rooms/<room_id>/join', methods=['POST'])
def join_mesh(room_id):
    data = request.json
    viewer_peer_id = data.get('peer_id')
    
    room = db.live_rooms.find_one({"id": room_id})
    if not room or room.get('status') == 'ENDED':
        return jsonify({"error": "Room not found or ended"}), 404
        
    streamer_peer_id = room.get('streamer_peer_id')
    if not streamer_peer_id:
        return jsonify({"error": "Streamer not ready"}), 400
        
    if room_id not in MESH_TREES:
        MESH_TREES[room_id] = {streamer_peer_id: {"children": [], "parent": None, "layer": 0}}
        
    tree = MESH_TREES[room_id]
    
    if viewer_peer_id not in tree:
        tree[viewer_peer_id] = {"children": [], "parent": None, "layer": -1}
        
    # BFS to find the first node with available slots based on capacity and max_layers
    queue = [streamer_peer_id]
    parent_id = None
    
    max_layers = room.get('max_layers', 3)
    layer_0_capacity = room.get('layer_0_capacity', 4)
    layer_n_capacity = room.get('layer_n_capacity', 4)
    
    while queue:
        current_id = queue.pop(0)
        node = tree.get(current_id)
        if node:
            cap = layer_0_capacity if node["layer"] == 0 else layer_n_capacity
            if len(node["children"]) < cap and node["layer"] < max_layers:
                parent_id = current_id
                break
            queue.extend(node["children"])
            
    if parent_id:
        if viewer_peer_id not in tree[parent_id]["children"]:
            tree[parent_id]["children"].append(viewer_peer_id)
        tree[viewer_peer_id]["parent"] = parent_id
        tree[viewer_peer_id]["layer"] = tree[parent_id]["layer"] + 1
        return jsonify({"parent_peer_id": parent_id})
    
    return jsonify({"error": "Live room mesh network is at maximum capacity"}), 503

@api_bp.route('/live/rooms/<room_id>/report_dead', methods=['POST'])
def report_dead_node(room_id):
    data = request.json
    dead_peer_id = data.get('dead_peer_id')
    
    if room_id in MESH_TREES:
        tree = MESH_TREES[room_id]
        if dead_peer_id in tree:
            parent_id = tree[dead_peer_id].get("parent")
            if parent_id and parent_id in tree:
                if dead_peer_id in tree[parent_id]["children"]:
                    tree[parent_id]["children"].remove(dead_peer_id)
            del tree[dead_peer_id]
            
    return jsonify({"message": "Dead node removed from mesh tree"})

@api_bp.route('/live/rooms/<room_id>/leave', methods=['POST'])
def leave_mesh(room_id):
    data = request.json
    peer_id = data.get('peer_id')
    
    if room_id in MESH_TREES:
        tree = MESH_TREES[room_id]
        if peer_id in tree:
            parent_id = tree[peer_id].get("parent")
            if parent_id and parent_id in tree:
                if peer_id in tree[parent_id]["children"]:
                    tree[parent_id]["children"].remove(peer_id)
            del tree[peer_id]
            
    return jsonify({"message": "Left mesh"})


@api_bp.route('/live/rooms/<room_id>/kick', methods=['POST'])
def kick_live_user(room_id):
    data = request.json
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    
    db.live_rooms.update_one(
        {"id": room_id}, 
        {"$addToSet": {"kicked_users": user_id}}
    )
    return jsonify({'message': 'User kicked'})

@api_bp.route('/live/messages', methods=['GET'])
def get_live_messages():
    room_id = request.args.get('room_id')
    user_id = request.args.get('user_id')
    if not room_id:
        return jsonify({'error': 'Missing room_id'}), 400
        
    # Check if user is kicked
    room = db.live_rooms.find_one({"id": room_id})
    if room and user_id and user_id in room.get('kicked_users', []):
        return jsonify({'error': 'You have been kicked from this room'}), 403

    msgs = list(db.live_messages.find({"room_id": room_id}, {"_id": 0}).sort("created_at", 1))
    return jsonify(msgs)

@api_bp.route('/live/messages', methods=['POST'])
def send_live_message():
    data = request.json
    sender = db.users.find_one({"id": data['sender_id']})
    
    db.live_messages.insert_one({
        "id": generate_uuid(),
        "room_id": data['room_id'],
        "sender_id": data['sender_id'],
        "sender_name": sender.get('name') if sender else 'Unknown',
        "message_text": data['message_text'],
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({'message': 'Message sent to live room'})

@api_bp.route('/pricing', methods=['GET'])
def get_pricing():
    config = db.configs.find_one({"id": "pricing"}, {"_id": 0})
    if not config:
        return jsonify({
            "tier_1_price": 500,
            "tier_2_price": 1000,
            "tier_3_price": 2000,
            "high_traffic_price": 1500
        })
    return jsonify(config)

@api_bp.route('/pricing', methods=['POST'])
def update_pricing():
    data = request.json
    admin_id = data.get('admin_id')
    admin = db.users.find_one({"id": admin_id, "role": "ADMIN"})
    if not admin:
        return jsonify({'error': '無權限'}), 403
        
    db.configs.update_one(
        {"id": "pricing"},
        {"$set": {
            "tier_1_price": data.get('tier_1_price', 500),
            "tier_2_price": data.get('tier_2_price', 1000),
            "tier_3_price": data.get('tier_3_price', 2000),
            "high_traffic_price": data.get('high_traffic_price', 1500)
        }},
        upsert=True
    )
    return jsonify({'message': '定價已更新'})

@api_bp.route('/users/<user_id>/upgrade', methods=['POST'])
def upgrade_user(user_id):
    data = request.json
    upgrade_type = data.get('type') # 'TIER' or 'ADDON'
    target_tier = data.get('target_tier')
    addon_name = data.get('addon_name')
    
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if upgrade_type == 'TIER' and target_tier is not None:
        db.users.update_one({"id": user_id}, {"$set": {"tier": target_tier, "role": "SELLER" if target_tier > 0 else "BUYER"}})
        return jsonify({'message': '升級成功', 'tier': target_tier})
        
    if upgrade_type == 'ADDON' and addon_name:
        db.users.update_one({"id": user_id}, {"$addToSet": {"addons": addon_name}})
        return jsonify({'message': '加值功能解鎖成功'})
        
    return jsonify({'error': '無效的升級請求'}), 400
