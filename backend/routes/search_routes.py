from flask import Blueprint
from controllers.search_controller import SearchController

search_bp = Blueprint('search', __name__)
search_controller = SearchController()

@search_bp.route('', methods=['GET'])
def search():
    """
    獲取或修改資料 API
    ---
    tags:
      - 系統 API
    summary: "search API"
    description: "這個 API 會執行 search 操作。"
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
    return search_controller.search()
