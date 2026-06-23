from flask import Blueprint, jsonify, request
from services.auth_service import AuthService
from flasgger import swag_from

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_service = AuthService()

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    登入 API
    ---
    tags:
      - 驗證授權 (Auth)
    summary: 使用者登入
    description: "透過帳號與密碼進行登入，驗證成功將回傳使用者資訊。"
    responses:
      200:
        description: 登入成功
      400:
        description: 帳號密碼未輸入
      401:
        description: 帳號或密碼錯誤
    """
    data = request.json
    result, status_code = auth_service.login(data.get('username'), data.get('password'))
    return jsonify(result), status_code

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """
    Google 登入 API
    ---
    tags:
      - 驗證授權 (Auth)
    summary: Google 快速登入
    description: "透過 Google Token 進行登入驗證。"
    responses:
      200:
        description: 登入成功
      400:
        description: 無效的 token 或找不到帳號
    """
    data = request.json
    result, status_code = auth_service.google_login(data.get('token'))
    return jsonify(result), status_code

@auth_bp.route('/line', methods=['POST'])
def line_login():
    """
    LINE 登入 API
    ---
    tags:
      - 驗證授權 (Auth)
    summary: LINE 快速登入
    description: "透過 LINE ID 進行登入。"
    responses:
      200:
        description: 登入成功
    """
    data = request.json
    result, status_code = auth_service.line_login(data.get('line_id'), data.get('name'), data.get('picture'))
    return jsonify(result), status_code

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    註冊 API
    ---
    tags:
      - 驗證授權 (Auth)
    summary: 註冊新帳號
    description: "註冊成為新使用者。"
    responses:
      201:
        description: 註冊成功
      400:
        description: 帳號已存在或資料不完整
    """
    data = request.json
    result, status_code = auth_service.register(data)
    return jsonify(result), status_code
