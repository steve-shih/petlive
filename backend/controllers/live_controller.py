from flask import Blueprint, request, jsonify
from services.live_service import LiveService
import os
import time
from infrastructure.database import Database
import uuid
from datetime import datetime

live_bp = Blueprint('live', __name__, url_prefix='/api/live')
live_service = LiveService()

@live_bp.route('/rooms', methods=['GET'])
def get_live_rooms():
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "get_live_rooms API"
    description: "這個 API 會執行 get_live_rooms 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    rooms = live_service.get_live_rooms()
    return jsonify(rooms)

@live_bp.route('/rooms/<room_id>', methods=['GET'])
def get_live_room(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "get_live_room API"
    description: "這個 API 會執行 get_live_room 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    result, status = live_service.get_room(room_id)
    return jsonify(result), status

@live_bp.route('/rooms', methods=['POST'])
def create_live_room():
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "create_live_room API"
    description: "這個 API 會執行 create_live_room 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    streamer_id = data.get('streamer_id')
    title = data.get('title')
    max_layers = data.get('max_layers')
    layer_capacity = data.get('layer_capacity')
    
    result, status = live_service.create_live_room(streamer_id, title, max_layers, layer_capacity)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/end', methods=['POST'])
def end_room(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "end_room API"
    description: "這個 API 會執行 end_room 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    result, status = live_service.end_room(room_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/thumbnail', methods=['POST'])
def update_room_thumbnail(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "update_room_thumbnail API"
    description: "這個 API 會執行 update_room_thumbnail 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    thumbnail = data.get('thumbnail')
    result, status = live_service.update_room_thumbnail(room_id, thumbnail)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/peer', methods=['PUT'])
def update_live_room_peer(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "update_live_room_peer API"
    description: "這個 API 會執行 update_live_room_peer 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    peer_id = data.get('peer_id')
    result, status = live_service.update_streamer_peer(room_id, peer_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/tree', methods=['GET'])
def get_live_room_tree(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "get_live_room_tree API"
    description: "這個 API 會執行 get_live_room_tree 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    result, status = live_service.get_room_tree(room_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/settings', methods=['POST'])
def update_live_room_settings(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "update_live_room_settings API"
    description: "這個 API 會執行 update_live_room_settings 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    settings = {
        "max_layers": data.get('max_layers', 3),
        "layer_0_capacity": data.get('layer_capacity', 4),
        "layer_n_capacity": data.get('layer_capacity', 4),
        "max_viewers": data.get('total_viewers', 200),
        "base_delay": data.get('base_delay', 1000),
        "layer_delay": data.get('layer_delay', 300),
        "password": data.get('password', ""),
        "blur_preview": data.get('blur_preview', False)
    }
    result, status = live_service.update_room_settings(room_id, settings)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/report_stats', methods=['POST'])
def report_live_room_stats(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "report_live_room_stats API"
    description: "這個 API 會執行 report_live_room_stats 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    peer_id = data.get('peer_id')
    bitrate = data.get('bitrate_kbps')
    ping = data.get('ping_ms')
    result, status = live_service.report_stats(room_id, peer_id, bitrate, ping)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/swap_nodes', methods=['POST'])
def swap_live_room_nodes(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "swap_live_room_nodes API"
    description: "這個 API 會執行 swap_live_room_nodes 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    node_a = data.get('node_a')
    node_b = data.get('node_b')
    result, status = live_service.swap_nodes(room_id, node_a, node_b)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/join', methods=['POST'])
def join_mesh(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "join_mesh API"
    description: "這個 API 會執行 join_mesh 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    viewer_peer_id = data.get('peer_id')
    result, status = live_service.join_mesh(room_id, viewer_peer_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/report_dead', methods=['POST'])
def report_dead_node(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "report_dead_node API"
    description: "這個 API 會執行 report_dead_node 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    dead_peer_id = data.get('dead_peer_id')
    result, status = live_service.report_dead_node(room_id, dead_peer_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/leave', methods=['POST'])
def leave_mesh(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "leave_mesh API"
    description: "這個 API 會執行 leave_mesh 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    peer_id = data.get('peer_id')
    result, status = live_service.leave_mesh(room_id, peer_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/kick', methods=['POST'])
def kick_live_user(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "kick_live_user API"
    description: "這個 API 會執行 kick_live_user 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    user_id = data.get('user_id')
    result, status = live_service.kick_user(room_id, user_id)
    return jsonify(result), status

@live_bp.route('/rooms/<room_id>/verify_password', methods=['POST'])
def verify_password(room_id):
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "verify_password API"
    description: "這個 API 會執行 verify_password 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    password = data.get('password')
    result, status = live_service.verify_password(room_id, password)
    return jsonify(result), status

@live_bp.route('/messages', methods=['GET'])
def get_live_messages():
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "get_live_messages API"
    description: "這個 API 會執行 get_live_messages 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    room_id = request.args.get('room_id')
    user_id = request.args.get('user_id')
    result, status = live_service.get_messages(room_id, user_id)
    return jsonify(result), status

@live_bp.route('/messages', methods=['POST'])
def send_live_message():
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "send_live_message API"
    description: "這個 API 會執行 send_live_message 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    data = request.json
    result, status = live_service.send_message(data)
    return jsonify(result), status

# 影片上傳路由保留在此或獨立至 media_controller
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
from google.cloud import storage

# Initialize GCS client globally (will use GOOGLE_APPLICATION_CREDENTIALS)
# Fallback to local if no credentials (optional)
try:
    gcs_client = storage.Client()
    bucket_name = "petpa"
    bucket = gcs_client.bucket(bucket_name)
    use_gcs = True
except Exception as e:
    print(f"Failed to initialize GCS client: {e}")
    use_gcs = False

@live_bp.route('/upload-record', methods=['POST'])
def upload_live_record():
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "upload_live_record API"
    description: "這個 API 會執行 upload_live_record 操作。"
    responses:
      200:
        description: 成功返回資料
        schema:
          type: object
      400:
        description: 請求參數錯誤
      500:
        description: 伺服器內部錯誤
    """
    if 'video' not in request.files:
        return jsonify({'error': 'No video file'}), 400
        
    video = request.files['video']
    user_id = request.form.get('user_id')
    room_id = request.form.get('room_id')
    
    if video.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    filename = f"{user_id}_{room_id}_{int(time.time())}.webm"
    
    if use_gcs:
        blob = bucket.blob(f"petbar_vods/{filename}")
        # Upload from file object
        blob.upload_from_file(video, content_type=video.content_type)
        # Make public
        blob.make_public()
        media_url = blob.public_url
    else:
        # Fallback to local
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        video.save(filepath)
        media_url = f"/uploads/{filename}"
    
    db = Database.get_db()
    media_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "room_id": room_id,
        "type": "LIVE_RECORD",
        "url": media_url,
        "status": "PRIVATE",
        "created_at": datetime.utcnow().isoformat(),
        "is_permanent": False
    }
    db.media.insert_one(media_doc)
    return jsonify({'message': 'Video uploaded successfully', 'media': media_doc})

@live_bp.route('/record/<record_id>/upgrade', methods=['POST'])
def upgrade_record(record_id):
    """
    手動升級錄影檔為永久保存
    """
    db = Database.get_db()
    result = db.media.update_one(
        {"id": record_id},
        {"$set": {"is_permanent": True}}
    )
    
    if result.matched_count == 0:
        return jsonify({'error': 'Record not found'}), 404
        
    print(f"[ADMIN_NOTIFICATION] User requested permanent upgrade for record {record_id}")
    return jsonify({'message': 'Record upgraded to permanent successfully'})
