# 專案開發進度書 (Tasks)

## 📌 階段一：Web 前端 UI 切版與後端資料庫初始化 (Phase 1)
- `[/]` 前端 (Next.js) 全面導入深色模式 (Dark Theme)
  - `[ ]` 設定 Tailwind CSS (v4) 顏色變數 (黑、深灰、金黃)
  - `[ ]` 建立全域 Navbar (Logo, 搜尋, 下拉選單)
- `[ ]` 核心頁面切版實作
  - `[ ]` 首頁 (`/`) - Hero Banner 與商品網格
  - `[ ]` 信用資訊儀表板 (`/account/credit`)
  - `[ ]` 出價紀錄 (`/account/bids`)
- `[ ]` 後端 (Flask) 資料庫與 API 基建
  - `[ ]` 設定 SQLAlchemy
  - `[ ]` 建立基礎 Models
  - `[ ]` 測試 API

## 📌 階段二：專案基礎建設 (Infrastructure Setup)
- `[x]` 清空舊有遺留代碼，初始化純淨的 Git 儲存庫
- `[x]` 初始化 Next.js 前端框架 (含 TailwindCSS, TypeScript)
- `[x]` 初始化 Python Flask 後端資料夾結構 (models, routes, config)
- `[x]` 根據 /check 規範建立 README.md, PRD.md, TASK.md
- `[ ]` 設定開發環境的 Docker Compose (PostgreSQL, Redis)

## 📌 階段三：核心業務 API 開發
- `[ ]` 實作 Redis 分散式鎖與出價高併發處理邏輯
- `[ ]` 實作 Celery 非同步任務 (得標判定、棄標扣分)
- `[ ]` 實作 Socket.io 廣播 (即時價格、聊天室)

## 📌 階段四：前端 Web 實作 (剩餘頁面)
- `[ ]` 實作商品詳情頁與 WebSocket 即時出價互動
- `[ ]` 串接 SRS 播放器與 Live 直播互動面板
- `[ ]` 實作賣家後台與綠界金流串接

## 📌 階段五：整合測試與部署
- `[ ]` 前後端 API 串接與測試
- `[ ]` 部署至 GCP / GKE 環境
