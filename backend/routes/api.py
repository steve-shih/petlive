from flask import Blueprint, jsonify, request
from models import db, generate_uuid
from datetime import datetime

api_bp = Blueprint('api', __name__)

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

@api_bp.route('/products', methods=['GET'])
def get_products():
    main_cat = request.args.get('main_category')
    sub_cat = request.args.get('sub_category')
    filter_followed = request.args.get('filter_followed', 'true') == 'true'
    user_id = request.args.get('user_id')
    
    query = {"status": "ACTIVE"}
    if main_cat and main_cat != 'ALL':
        query["main_category"] = main_cat
    if sub_cat and sub_cat != 'ALL':
        query["sub_category"] = sub_cat
        
    all_products = list(db.products.find(query, {"_id": 0}))
    
    # Calculate hot sellers (top 2 by total views)
    seller_views = {}
    for p in all_products:
        seller_id = p.get('seller_id')
        seller_views[seller_id] = seller_views.get(seller_id, 0) + p.get('views', 0)
    
    sorted_sellers = sorted(seller_views.items(), key=lambda x: x[1], reverse=True)
    hot_seller_ids = [s[0] for s in sorted_sellers[:2]]
    
    user_following = []
    if filter_followed and user_id:
        user = db.users.find_one({"id": user_id})
        if user:
            user_following = user.get("following", [])
            
        filtered_products = []
        for p in all_products:
            if p.get('seller_id') in user_following or p.get('seller_id') in hot_seller_ids:
                filtered_products.append(p)
        all_products = filtered_products

    hot_products = sorted(all_products, key=lambda x: x.get('views', 0), reverse=True)[:4]
    hot_ids = [p.get('id') for p in hot_products]
    
    latest_products = sorted(
        [p for p in all_products if p.get('id') not in hot_ids], 
        key=lambda x: x.get('created_at', ''), 
        reverse=True
    )
    
    def format_product(p):
        media_urls = p.get('media_urls', [])
        # Fallback to image_url for older data
        first_img = next((url for url in media_urls if not url.endswith('.mp4')), p.get('image_url', ''))
        return {
            'id': p.get('id'),
            'title': p.get('title'),
            'price': p.get('price') if p.get('type') == 'BUY_NOW' else p.get('current_price'),
            'type': p.get('type'),
            'main_category': p.get('main_category'),
            'sub_category': p.get('sub_category'),
            'image_url': first_img,
            'seller_name': p.get('seller_name'),
            'seller_id': p.get('seller_id'),
            'views': p.get('views', 0)
        }
        
    return jsonify({
        'hot_products': [format_product(p) for p in hot_products],
        'latest_products': [format_product(p) for p in latest_products]
    })

@api_bp.route('/products/<product_id>/view', methods=['POST'])
def view_product(product_id):
    db.products.update_one({"id": product_id}, {"$inc": {"views": 1}})
    return jsonify({'message': 'ok'})

@api_bp.route('/products', methods=['POST'])
def create_product():
    data = request.json
    seller = db.users.find_one({"id": data['seller_id']})
    if not seller:
        return jsonify({'error': 'Seller not found'}), 400
        
    media_urls = data.get('media_urls', [])
    if len(media_urls) > 10:
        return jsonify({'error': 'Too many media files'}), 400
        
    p_id = generate_uuid()
    p = {
        "id": p_id,
        "seller_id": data['seller_id'],
        "seller_name": seller.get('name'),
        "title": data['title'],
        "description": data.get('description', ''),
        "main_category": data['main_category'],
        "sub_category": data['sub_category'],
        "type": data['type'],
        "media_urls": media_urls,
        "views": 0,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat()
    }
    
    if data['type'] == 'BUY_NOW':
        p['price'] = data['price']
        p['stock'] = data.get('stock', 1)
    else:
        p['start_price'] = data['start_price']
        p['current_price'] = data['start_price']
        import datetime as dt
        p['end_time'] = (dt.datetime.utcnow() + dt.timedelta(days=int(data.get('days', 3)))).isoformat()
        
    db.products.insert_one(p)
    return jsonify({'message': 'Product created successfully', 'id': p_id}), 201

@api_bp.route('/products/<product_id>', methods=['GET'])
def get_product(product_id):
    p = db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        return jsonify({'error': 'Product not found'}), 404
        
    bids = list(db.bids.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1))
    p['bids'] = bids
    return jsonify(p)

@api_bp.route('/bids', methods=['POST'])
def place_bid():
    data = request.json
    product_id = data.get('product_id')
    user_id = data.get('user_id')
    bid_amount = int(data.get('bid_amount', 0))
    
    product = db.products.find_one({"id": product_id})
    if not product or product.get('type') != 'BID':
        return jsonify({'error': 'Invalid product'}), 400
        
    end_time_str = product.get('end_time')
    if end_time_str and datetime.fromisoformat(end_time_str) < datetime.utcnow():
        return jsonify({'error': 'Bidding has ended'}), 400
        
    if bid_amount <= product.get('current_price', 0):
        return jsonify({'error': 'Bid amount must be higher than current price'}), 400
        
    db.products.update_one({"id": product_id}, {"$set": {"current_price": bid_amount}})
    
    user = db.users.find_one({"id": user_id})
    db.bids.insert_one({
        "id": generate_uuid(),
        "product_id": product_id,
        "user_id": user_id,
        "user_name": user.get('name'),
        "bid_amount": bid_amount,
        "created_at": datetime.utcnow().isoformat()
    })
    
    return jsonify({'message': 'Bid placed successfully'})

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
        
    orders = list(db.orders.find({"buyer_id": user_id}, {"_id": 0}))
    u['orders'] = orders
    
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
    
    new_media = {
        "id": generate_uuid(),
        "type": media_type,
        "url": url,
        "created_at": datetime.utcnow().isoformat()
    }
    
    db.users.update_one(
        {"id": user_id},
        {"$push": {"gallery": {"$each": [new_media], "$position": 0}}} # Push to front
    )
    return jsonify({'message': 'Media added', 'media': new_media}), 201

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
        
    room_id = generate_uuid()
    room = {
        "id": room_id,
        "streamer_id": streamer_id,
        "streamer_name": streamer.get('name'),
        "title": data.get('title', f"{streamer.get('name')} 的直播間"),
        "status": "LIVE",
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
    return jsonify({'message': 'Peer ID updated'})

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
