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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "upload_file API"
    description: "??API ?銵?upload_file ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_all_users API"
    description: "??API ?銵?get_all_users ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "login API"
    description: "??API ?銵?login ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    phone_or_email = data.get('username')
    password = data.get('password')
    # Mock validation: Accept any non-empty password for now
    if not phone_or_email or not password:
        return jsonify({'error': '隢撓?亙董??撖Ⅳ'}), 400
        
    # Find user by phone, email, or just name (mock)
    user = db.users.find_one({"$or": [{"phone": phone_or_email}, {"email": phone_or_email}, {"name": phone_or_email}]})
    if not user:
        return jsonify({'error': '撣唾?銝???}), 401
        
    # Check password
    if user.get('password') and user.get('password') != password:
        return jsonify({'error': '撖Ⅳ?航炊'}), 401
        
    return jsonify({
        'message': '?餃??',
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "google_login API"
    description: "??API ?銵?google_login ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    token = data.get('token')
    if not token:
        return jsonify({'error': 'Missing token'}), 400
        
    try:
        # ??ConfigLoader 霈?身摰?
        from infrastructure.config_loader import ConfigLoader
        client_id = ConfigLoader.get('auth', 'google_client_id', '788146443516-97ieiv3lpoauiehkpk7cnqnv82tqgh0v.apps.googleusercontent.com')
        
        # Verify token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')
        
        if not email:
            return jsonify({'error': '?⊥??? Google Email'}), 400
            
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
            'message': 'Google ?餃??',
            'user': {
                'id': user.get('id'),
                'name': user.get('name'),
                'role': user.get('role'),
                'is_test': user.get('is_test', user.get('role') != 'ADMIN')
            }
        })
        
    except ValueError as e:
        print(f"Google Token error: {e}")
        return jsonify({'error': 'Google Token 撽?憭望?'}), 401

import jwt
import requests

@api_bp.route('/auth/line', methods=['POST'])
def line_login():
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "line_login API"
    description: "??API ?銵?line_login ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    code = data.get('code')
    redirect_uri = data.get('redirect_uri')
    
    if not code or not redirect_uri:
        return jsonify({'error': '蝻箏???蝣?}), 400
        
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
            return jsonify({'error': res_data.get('error_description', 'LINE ??憭望?')}), 400
            
        id_token_str = res_data.get('id_token')
        if not id_token_str:
            return jsonify({'error': '?⊥??? LINE ID Token'}), 400
            
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
            'message': 'LINE ?餃??',
            'user': {
                'id': user.get('id'),
                'name': user.get('name'),
                'role': user.get('role'),
                'is_test': user.get('is_test', user.get('role') != 'ADMIN')
            }
        })
        
    except Exception as e:
        print(f"LINE Login error: {e}")
        return jsonify({'error': 'LINE ?餃???潛??航炊'}), 500


@api_bp.route('/auth/register', methods=['POST'])
def register():
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "register API"
    description: "??API ?銵?register ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    method = data.get('method') # 'PHONE' or 'EMAIL'
    contact = data.get('contact')
    password = data.get('password')
    code = data.get('code')
    name = data.get('name')
    role = data.get('role', 'BUYER')
    
    if not contact or not password or not code or not name:
        return jsonify({'error': '隢‵撖急???雿?}), 400
        
    if code != '123456': # Mock verification code
        return jsonify({'error': '撽?蝣潮隤?(皜祈岫??隢撓??123456)'}), 400
        
    # Check if exists
    existing = db.users.find_one({("phone" if method == 'PHONE' else "email"): contact})
    if existing:
        return jsonify({'error': '甇文董?歇閮餃?'}), 400
        
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
    
    return jsonify({'message': '閮餃???'})

@api_bp.route('/admin/test-users', methods=['GET'])
def get_test_users():
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_test_users API"
    description: "??API ?銵?get_test_users ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    admin_id = request.args.get('admin_id')
    admin = db.users.find_one({"id": admin_id, "role": "ADMIN"})
    if not admin:
        return jsonify({'error': '?⊥???}), 403
        
    test_users = list(db.users.find({"is_test": True}, {"_id": 0}))
    return jsonify([{
        'id': u.get('id'),
        'name': u.get('name'),
        'role': u.get('role'),
        'phone': u.get('phone') or u.get('email') or '?芾身摰?,
        'password': u.get('password') or '?芾身摰?
    } for u in test_users])


@api_bp.route('/bids', methods=['POST'])
def place_bid():
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "place_bid API"
    description: "??API ?銵?place_bid ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "create_order API"
    description: "??API ?銵?create_order ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "update_order_status API"
    description: "??API ?銵?update_order_status ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "create_call API"
    description: "??API ?銵?create_call ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "check_incoming_calls API"
    description: "??API ?銵?check_incoming_calls ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_call API"
    description: "??API ?銵?get_call ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    call = db.calls.find_one({"id": call_id}, {"_id": 0})
    if not call:
        return jsonify({'error': 'Call not found'}), 404
    return jsonify(call)

@api_bp.route('/calls/<call_id>/answer', methods=['POST'])
def answer_call(call_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "answer_call API"
    description: "??API ?銵?answer_call ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "add_ice_candidate API"
    description: "??API ?銵?add_ice_candidate ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "end_call API"
    description: "??API ?銵?end_call ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_messages API"
    description: "??API ?銵?get_messages ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "send_message API"
    description: "??API ?銵?send_message ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    sender_id = data['sender_id']
    receiver_id = data['receiver_id']
    
    sender = db.users.find_one({"id": sender_id})
    receiver = db.users.find_one({"id": receiver_id})
    
    # Check Blacklist
    if receiver_id in sender.get('blocked_users', []):
        return jsonify({'error': '?典歇撠?甇文?鞊∴??⊥??潮??胯?}), 403
    if sender_id in receiver.get('blocked_users', []):
        return jsonify({'error': '?典歇鋡怠??孵????⊥??潮??胯?}), 403

    db.messages.insert_one({
        "id": generate_uuid(),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "message_text": data['message_text'],
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({'message': 'Message sent'})

@api_bp.route('/users/<user_id>', methods=['PUT'])
def update_user_profile(user_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "update_user_profile API"
    description: "??API ?銵?update_user_profile ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    update_fields = {}
    if 'name' in data:
        update_fields['name'] = data['name']
    if 'phone' in data:
        update_fields['phone'] = data['phone']
        
    if not update_fields:
        return jsonify({'error': 'No data provided'}), 400
        
    db.users.update_one({'id': user_id}, {'$set': update_fields})
    return jsonify({'message': 'Profile updated successfully'})

@api_bp.route('/notifications/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_user_notifications API"
    description: "??API ?銵?get_user_notifications ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    # Fetch real notifications from database
    notifs = list(db.notifications.find({'user_id': user_id}, {'_id': 0}).sort('created_at', -1).limit(50))
    # If no notifications exist, return a default welcome notification
    if not notifs:
        welcome_notif = {
            'id': 'welcome-1',
            'user_id': user_id,
            'title': '甇∟?? PetBar',
            'content': '?典歇??閮餃?銝行??箸??∴????Ｙ揣?車???啁?改?',
            'created_at': datetime.utcnow().isoformat(),
            'read': False
        }
        db.notifications.insert_one(welcome_notif)
        del welcome_notif['_id']
        notifs.append(welcome_notif)
        
    return jsonify(notifs)

@api_bp.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_user API"
    description: "??API ?銵?get_user ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
        
    # Return gallery (default to empty list if not exists)
    
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
        
        # Fetch my VODs
        my_vods = list(db.live_rooms.find(
            {"streamer_id": user_id, "status": "ENDED", "vod_url": {"$exists": True, "$ne": None}},
            {"_id": 0}
        ).sort("created_at", -1))
        
        # Filter out expired VODs unless permanent
        valid_vods = []
        now = datetime.utcnow()
        for vod in my_vods:
            if vod.get("vod_is_permanent"):
                valid_vods.append(vod)
            else:
                expires_at_str = vod.get("vod_expires_at")
                if expires_at_str:
                    try:
                        expires_at = datetime.fromisoformat(expires_at_str)
                        if now <= expires_at:
                            valid_vods.append(vod)
                    except:
                        pass
        u['my_vods'] = valid_vods
        
    # Reset daily views if it's a new day
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    if u.get('last_view_date') != today_str:
        u['daily_views'] = 0
        db.users.update_one({"id": user_id}, {"$set": {"daily_views": 0, "last_view_date": today_str}})
        
    return jsonify(u)

@api_bp.route('/user/<user_id>/settings', methods=['GET', 'PUT'])
def user_settings(user_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "user_settings API"
    description: "??API ?銵?user_settings ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "view_user API"
    description: "??API ?銵?view_user ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "add_gallery_media API"
    description: "??API ?銵?add_gallery_media ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "delete_gallery_media API"
    description: "??API ?銵?delete_gallery_media ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    db.users.update_one(
        {"id": user_id},
        {"$pull": {"gallery": {"id": media_id}}}
    )
    return jsonify({'message': 'Media deleted'})

@api_bp.route('/users/<user_id>/following', methods=['GET'])
def get_following(user_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_following API"
    description: "??API ?銵?get_following ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "toggle_follow API"
    description: "??API ?銵?toggle_follow ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "toggle_block API"
    description: "??API ?銵?toggle_block ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
                return jsonify({'error': '鈭斗?銝哨??暑頨?蝡嗆????殷?嚗??臬???'}), 400

    blocked = u.get('blocked_users', [])
    if target_id in blocked:
        blocked.remove(target_id)
        action = "unblocked"
    else:
        blocked.append(target_id)
        action = "blocked"
        
    db.users.update_one({"id": user_id}, {"$set": {"blocked_users": blocked}})
    return jsonify({'message': 'ok', 'action': action})



@api_bp.route('/pricing', methods=['GET'])
def get_pricing():
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "get_pricing API"
    description: "??API ?銵?get_pricing ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
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
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "update_pricing API"
    description: "??API ?銵?update_pricing ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    admin_id = data.get('admin_id')
    admin = db.users.find_one({"id": admin_id, "role": "ADMIN"})
    if not admin:
        return jsonify({'error': '?⊥???}), 403
        
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
    return jsonify({'message': '摰撌脫??})

@api_bp.route('/users/<user_id>/upgrade', methods=['POST'])
def upgrade_user(user_id):
    """
    ?脣??耨?寡???API
    ---
    tags:
      - 蝟餌絞 API
    summary: "upgrade_user API"
    description: "??API ?銵?upgrade_user ????
    responses:
      200:
        description: ??餈?鞈?
        schema:
          type: object
      400:
        description: 隢???航炊
      500:
        description: 隡箸??典?券隤?
    """
    data = request.json
    upgrade_type = data.get('type') # 'TIER' or 'ADDON'
    target_tier = data.get('target_tier')
    addon_name = data.get('addon_name')
    
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if upgrade_type == 'TIER' and target_tier is not None:
        db.users.update_one({"id": user_id}, {"$set": {"tier": target_tier, "role": "SELLER" if target_tier > 0 else "BUYER"}})
        return jsonify({'message': '????', 'tier': target_tier})
        
    if upgrade_type == 'ADDON' and addon_name:
        db.users.update_one({"id": user_id}, {"$addToSet": {"addons": addon_name}})
        return jsonify({'message': '?澆??質圾????})
        
    return jsonify({'error': '?⊥???蝝?瘙?}), 400

@api_bp.route('/system/settings', methods=['GET'])
def get_system_settings():
    import json
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
    return jsonify(config.get('system', {}))

@api_bp.route('/system/settings', methods=['PUT'])
def update_system_settings():
    import json
    data = request.json
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
    config['system'] = data
    with open('config.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    return jsonify({'message': '蝟餌絞閮剖?撌脫??, 'system': config['system']})

@api_bp.route('/live/rooms/<room_id>/vod', methods=['POST'])
def upload_vod(room_id):
    if 'video' not in request.files:
        return jsonify({'error': 'No video part'}), 400
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No selected video'}), 400
    if file:
        filename = secure_filename(file.filename)
        safe_name = f"vod_{room_id}_{int(time.time())}.webm"
        filepath = os.path.join(UPLOAD_FOLDER, safe_name)
        file.save(filepath)
        vod_url = f"http://127.0.0.1:5000/uploads/{safe_name}"
        
        # Calculate expiration (12 hours from now)
        from datetime import timedelta
        expires_at = datetime.now() + timedelta(hours=12)
        
        db.live_rooms.update_one(
            {"id": room_id},
            {"$set": {
                "vod_url": vod_url,
                "vod_created_at": datetime.now().isoformat(),
                "vod_expires_at": expires_at.isoformat(),
                "vod_is_permanent": False
            }}
        )
        return jsonify({'message': 'VOD saved successfully', 'url': vod_url})

@api_bp.route('/live/rooms/<room_id>/vod/extend', methods=['POST'])
def extend_vod(room_id):
    # Check user payment/balance in a real app. For now, mark as permanent.
    db.live_rooms.update_one(
        {"id": room_id},
        {"$set": {
            "vod_is_permanent": True,
            "vod_expires_at": None
        }}
    )
    return jsonify({'message': 'VOD 撌脖?鞎餅偶銋?摮???})

