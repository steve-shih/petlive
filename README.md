# 🐾 PetLive 寵物直播平台

這是一個專為甲蟲、爬蟲等特殊寵物打造的即時直播競標與電商平台。
專案分為前端 (Next.js) 與後端 (Python Flask)。

## 🚀 快速啟動指南 (Quick Start)

### 1. 啟動後端 (Backend)
本機開發需具備 Python 3.9+ 環境。
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # (Windows)
pip install -r requirements.txt
python app.py
```
預設 API 將運行在 `http://127.0.0.1:5000`。

### 2. 啟動前端 (Frontend)
本機開發需具備 Node.js 20+ 環境。
```bash
cd frontend
npm install
npm run dev
```
預設網頁將運行在 `http://localhost:3000`。

---
> 💡 有關系統架構與詳細規格，請參閱 `PRD.md`。
> 💡 有關當前開發進度，請參閱 `TASK.md`。
