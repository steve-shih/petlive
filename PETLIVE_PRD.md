# 🐾 寵霸 PetLive - 系統總規格與架構白皮書 (Master Specification)

> **版本**：v1.3 (完整規格 + MVP 實作範圍備註)
> **最後更新**：2026-06-15
> **定位**：此文件為寵霸平台開發的唯一標準依據，涵蓋產品願景、網頁端、雙 App 端與後端架構、資料庫設計及開發時程。

> [!IMPORTANT] 
> **🏆 當前實作焦點 (Current MVP Focus)**
> 雖然本文件定義了完整的系統與金流架構，但**目前第一階段將優先實作以下核心功能（暫不處理金流與 App 打包）**：
> 1. **基礎 Web 網頁端**：確保買家與賣家能透過電腦與手機瀏覽器順暢使用。
> 2. **帳號與店家資料**：顧客與店家的基本登入註冊、創建與檢視店家主頁資料。
> 3. **內容展示**：店家能新增與管理寵物/商品的照片與影片；顧客能瀏覽這些內容。
> 4. **直播與聊天室**：店家能透過瀏覽器開啟即時直播；顧客能觀看直播並在聊天室發送即時訊息。

---

## 🎯 一、產品願景與目標客群 (Product Vision & Target Audience)

「寵霸 PetLive」致力於打造全台首創的「寵物超低延遲直播與線上預約平台」，將傳統寵物店的展示與買賣流程數位化。透過高質感的介面與即時影音互動，解決買家與賣家之間的信任與時間成本問題。

### 目標客群
1. **買家 (消費者)**：尋找伴侶寵物、需要即時確認寵物健康狀態與互動情形的使用者。
2. **賣家 (合法寵物業者)**：具備「特定寵物業許可證」，希望透過線上直播擴大客源，並透過線上訂金機制減少顧客爽約率的合法店家。

---

## 🏗️ 二、全端架構總覽 (System Architecture)

為了達到「一套技術、多端產出（網頁、買家 App、業者 App）」的需求，本專案採取**混合式跨平台 (Hybrid Cross-Platform) 架構**與**前後端分離設計**。

### 1. 前端架構 (Frontend Monorepo)
- **核心框架**：`Next.js 14` (React) + `TypeScript`。提供 SSR/SSG 能力，優化首頁 SEO 與載入速度。
- **狀態管理**：`Zustand` (負責全域狀態如購物車、使用者登入狀態) + `React Query` (負責伺服器狀態與 API 快取)。
- **樣式系統**：`Vanilla CSS`。全站採用純手寫高品質 Glassmorphism 玻璃擬物化風格，禁止濫用臃腫套件以確保效能與客製化自由度。
- **跨平台打包引擎**：`Capacitor` (Ionic)。
- **部署策略**：
  - **瀏覽器 Web 版**：部署於 Vercel 或一般伺服器，支援響應式設計，任何人都可用瀏覽器開啟。*(當前優先實作)*
  - **買家端 App (`petlive-buyer.apk` / `.ipa`)**：透過 Capacitor 將 Next.js 買家路由打包。
  - **業者端 App (`petlive-seller.apk` / `.ipa`)**：透過 Capacitor 將 Next.js 店家後台路由打包，並內建呼叫手機相機與麥克風的硬體權限以利直播。

### 2. 後端架構 (Backend)
- **核心框架**：`Python 3.11+` + `FastAPI` (高併發非同步，利於未來擴充 AI 輔助模組)。
- **資料庫與快取**：
  - `PostgreSQL`：核心關聯式資料庫。儲存會員、商鋪、訂單、活體與商品資料。
  - `Redis`：快取熱門直播列表、即時聊天室訊息派發 (Pub/Sub) 與在線人數動態統計。
- **身分驗證**：JWT (JSON Web Tokens) Bearer Token 驗證，並規劃未來整合 OAuth (Google/LINE 登入)。

### 3. 超低延遲直播與即時聊天室架構 (Ultra-Low Latency Live & Chat) *(當前優先實作)*
因為寵物展示與預約需要極高的即時互動性，傳統 RTMP/HLS (3~10 秒延遲) 無法滿足需求。
- **影像串流 (WebRTC)**：採用 **LiveKit Cloud** 或 **AWS IVS**。讓手機鏡頭的畫面在「低於 1 秒」內傳遞給所有買家，實現「買家隨喊隨看」的極致體驗。
- **即時聊天室 (WebSockets + Redis Pub/Sub)**：
  - 透過 `FastAPI` 內建的非同步 WebSockets 建立雙向連線。
  - 結合 `Redis Pub/Sub` 機制，確保即使單一房間達上千人，聊天訊息也能毫秒級派發。
  - **賣家控制權**：賣家可點擊聊天室頭像，即時查看該觀眾的聯絡資訊 (防範惡意騷擾)。

---

## 📱 三、雙 App 功能邊界與使用者旅程 (App Boundaries & User Journeys)

### 🟢 1. 買家端 App / Web (PetLive Buyer)
**核心體驗：探索、互動、預約。**
- **首頁發現 (Discovery)**：瀑布流展示熱門店家、推薦的進行中直播與精選寵物。*(當前優先實作)*
- **沉浸式直播觀看 (Live Experience)**：*(當前優先實作)*
  - 支援如短影音般的「上下滑動 (Swipe)」流暢切換不同店家的直播間。
  - 支援點擊「店家專屬連結」直接進入直播間。
  - 直播間內功能：發送即時留言、點擊愛心、點擊懸浮商品卡片。
- **商鋪與商品探索 (Shop Exploration)**：*(當前優先實作)*
  - 瀏覽各家店的主頁 (含營業時間、地址、許可證字號)。
  - 活體展示：查看照片、影片、品種、性別、出生日期。
- **交易與預約旅程 (Transaction Journey)**：*(待後續階段實作)*
  - **訪客模式**：允許未註冊者觀看直播與商品，但若要「付訂金」或「預約現場看」，系統將強制要求輸入真實手機號碼與 LINE ID 進行 OTP 驗證。
  - 點擊「付訂金」 -> 喚起綠界金流 -> 付款成功 -> 取得專屬預約代碼 -> 系統推播通知賣家。

### 🟠 2. 業者端 App / Web (PetLive Pro/Seller)
**核心體驗：開播控場、上架管理、顧客聯繫。**
- **開播大廳 (Broadcasting Hub)**：*(當前優先實作)*
  - 網頁或手機端一鍵開播，系統秒產出「專屬直播連結」，方便店家分享至 FB 粉專或 LINE 群組。
  - 支援前後鏡頭切換、麥克風收音調整。
- **直播控場面板 (Moderator Dashboard)**：*(當前優先實作)*
  - 即時查看當下觀眾人數與觀眾列表。
  - 管理聊天室：置頂重要訊息、禁言或踢出違規觀眾。
  - 快速推播「活體展示卡片」到買家畫面上，引導點擊預約。
- **預約與訂單管理 (Order Management)**：*(待後續階段實作)*
  - 視覺化行事曆：查看顧客預約「現場看」的時段表。
  - 訂金狀態追蹤：確認綠界金流的匯款狀態 (已付款/未付款/已退款)。
- **商鋪上架 (Inventory Management)**：*(當前優先實作)*
  - 上傳寵物照片、設定品種、價格與展示影片。

---

## 🗄️ 四、資料庫核心結構與關聯 (Database Schema)

採 PostgreSQL 關聯式設計，包含未來所需之金流相關表單。

### 1. `users` (會員資料表)
- `id`: UUID (PK)
- `role`: Enum (BUYER, SELLER, ADMIN)
- `phone_number`: String (Unique, 登入/聯絡主要依據)
- `line_id`: String (Nullable)
- `name`: String
- `is_verified_seller`: Boolean (是否已通過合法店家審查，預設 false)
- `created_at` / `updated_at`: Timestamp

### 2. `shops` (商鋪資料表)
- `id`: UUID (PK)
- `seller_id`: UUID (FK -> users.id, Unique)
- `shop_name`: String
- `license_number`: String (特定寵物業許可證字號)
- `address`: String
- `business_hours`: JSON
- `status`: Enum (PENDING, ACTIVE, SUSPENDED)

### 3. `live_sessions` (直播場次表)
- `id`: UUID (PK)
- `shop_id`: UUID (FK -> shops.id)
- `title`: String (直播標題)
- `status`: Enum (SCHEDULED, LIVE, ENDED)
- `started_at` / `ended_at`: Timestamp
- `metrics`: JSON (存放最高在線人數、總觀看人次、互動次數等統計數據)

### 4. `items` (活體/商品表)
- `id`: UUID (PK)
- `shop_id`: UUID (FK -> shops.id)
- `type`: Enum (LIVESTOCK, PRODUCT)
- `title`: String (例如：兩個月大布偶貓)
- `description`: Text
- `media_urls`: Array of Strings (照片或影片 S3 連結)
- `full_price`: Decimal (總價)
- `deposit_price`: Decimal (訂金價格)
- `stock_status`: Enum (AVAILABLE, RESERVED, SOLD)

### 5. `transactions` (訂金與交易表) *(待後續實作)*
- `id`: UUID (PK)
- `buyer_id`: UUID (FK -> users.id)
- `item_id`: UUID (FK -> items.id)
- `amount`: Decimal (實際交易金額)
- `transaction_type`: Enum (DEPOSIT, FULL_PAYMENT)
- `payment_status`: Enum (UNPAID, PAID, FAILED, REFUNDED)
- `payment_gateway_id`: String (綠界交易序號)
- `reservation_date`: Timestamp (買家預約現場看寵物的時間)

---

## 🔗 五、第三方整合服務 (Third-Party Integrations)

1. **金流服務 (Payment Gateway)**：*(待後續實作)*
   - **綠界 ECPay**：提供信用卡刷卡、虛擬帳號 (ATM)、超商代碼繳費。
2. **即時通訊與推播 (Messaging & Notification)**：
   - **簡訊 API (Mitake / AWS SNS)**：發送 OTP 驗證碼。
   - **LINE Login & LINE Notify**：提供快速註冊登入與推播通知。
3. **低延遲直播串流 (Live Streaming Engine)**：*(當前優先實作)*
   - **LiveKit Cloud** (首選) 或 **AWS IVS**：確保 1 秒內超低延遲的影音傳遞。
4. **雲端儲存服務 (Cloud Storage)**：*(當前優先實作)*
   - **AWS S3 / Cloudflare R2**：用於存放靜態資源與展示短影片。

---

## 🛡️ 六、非功能性需求與合規 (Non-Functional Requirements & Compliance)

### 1. 系統效能 (Performance)
- **直播延遲 (Latency)**：端到端延遲需嚴格控制在 1-2 秒內。
- **訊息派發 (Message Delivery)**：聊天室訊息需在 200 毫秒內送達所有在線客戶端。
- **頁面載入 (Page Load)**：網頁端首屏載入時間 (LCP) 不超過 2 秒。

### 2. 安全性與隱私 (Security & Privacy)
- **API 驗證**：所有非公開路由皆需攜帶合法 JWT 進行驗證。
- **個資保護**：買家的敏感個人資料在資料庫中需加密儲存。

### 3. 法規遵循 (Compliance - 台灣地區)
- **特定寵物業許可證**：賣家註冊時必須上傳營業登記與許可證，系統會在店家主頁與直播間顯著標示。
- **消費者保護**：在付款頁面清楚標示「訂金退還政策」。

---

## 🚀 七、開發階段里程碑與未來藍圖 (Milestones & Roadmap)

### 📍 Phase 1: 核心 API、網頁端與直播連線 (Month 1-2) **[當前焦點]**
- 完成 PostgreSQL 核心 Schema (暫不處理金流) 與 FastAPI 基礎 CRUD、JWT 登入。
- 完成 Next.js (買賣家共用) Web 端切版與玻璃擬物化介面。
- 實作商品照片/影片上傳與店家主頁展示。
- 串接 LiveKit 實作 WebRTC 影像直播，並完成 WebSockets 聊天室。

### 📍 Phase 2: Capacitor App 打包與金流交易 (Month 2-3)
- 導入 Capacitor 引擎，配置 Buyer 與 Seller 兩個 App 環境，準備 `.apk` 與 `.ipa`。
- 串接綠界 ECPay，完成訂金刷卡與回傳驗證流程，補齊 `transactions` 資料流。

### 🔮 Phase 3+: 未來擴展 (Future Outlook)
- 導入 AI 分析觀看人流與轉換率，提供賣家報表。
- 開放寵物美容、醫療等周邊業者進駐。
