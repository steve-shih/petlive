# 寵物live - Web 前後端系統詳細規格書 (v4.0)

本文件定義 PetLive 系統的基礎架構與核心業務邏輯，優先專注於 Web 前後端與系統基建。

## 🗄️ 一、 詳細資料庫綱要 (Data Structure)
基於 Python Flask 與 PostgreSQL (Cloud SQL)，使用 SQLAlchemy。

* **User (會員)**: 買賣家共用。欄位含 `email`, `auth_provider`, `role`, `credit_score` (預設100)。
* **Product (商品)**: 欄位含 `type` (BUY_NOW, BID), `status` (PENDING_REVIEW, ACTIVE, SOLD)。
* **BidItem (競標設定)**: 僅 BID 模式有此關聯。含 `start_price`, `current_price`, `end_time`。
* **BidRecord (出價紀錄)**: 記錄每次成功的出價。
* **Order (訂單)**: 記錄結帳或得標訂單。包含 `is_abandoned` 棄標標記。
* **OrderMessage (得標聊天)**: 得標後專屬的一對一聊天室訊息紀錄。
* **LiveRoom (直播間)**: 紀錄 SRS 伺服器的串流狀態，限制最高 50 人。

## 🖥️ 二、 Web 前端頁面與組件規劃 (Pages & Components)
使用 React / Next.js。

1. **首頁與公共頁面**: Hero Banner, Live Now, 熱門競標, 最新直購, 第三方登入。
2. **商品與交易頁面**: 分類篩選、直購/競標詳情、WebSocket 即時倒數與出價。
3. **Live 互動直播模組**: 嵌入 HTTP-FLV 播放器，聊天室，釘選商品快速出價。
4. **會員中心**: 信用儀表板、出價紀錄、訂單管理、棄標按鈕 (警告扣分)。
5. **賣家管理後台**: 綠界付費訂閱、商品上架審核、直播推流金鑰獲取、出貨管理。

## ⚙️ 三、 核心系統與資料流邏輯 (Business Logic Rules)

1. **競標高併發防呆 (Redis Lock)**: 出價時使用分散式鎖避免資料庫錯亂，再透過 Celery 非同步寫入。
2. **棄標懲罰機制**: 棄標扣除買家信用分 10 分。分數過低將阻擋後續出價。
3. **得標聊天室創建**: 結標後系統自動判定最高出價者建立訂單，並開通一對一專屬聊天室權限。
