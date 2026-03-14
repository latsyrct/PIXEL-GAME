# PIXEL QUEST 像素闖關問答遊戲

這是一個使用 React Vite + TypeScript 開發的 2000 年代街機像素風格問答遊戲。
後端使用 Google Apps Script (GAS) 連接 Google Sheets 作為題目與成績資料庫。

## 系統需求
- Node.js 20+ 或更新版本
- 一個 Google 帳號（用來建立試算表）

---

## 🚀 步驟一：設定 Google Sheets (資料庫)

1. 在您的 Google 雲端硬碟建立一個新的「Google 試算表」。
2. 將第一張工作表重新命名為 **「題目」**。
3. 在「題目」工作表的**第一列**建立以下標題：
   - A1: `題號`
   - B1: `題目`
   - C1: `A`
   - D1: `B`
   - E1: `C`
   - F1: `D`
   - G1: `解答` (請填寫正確的選項大寫字母，如 A、B、C 或 D)
4. 新增第二張工作表並命名為 **「回答」**。
5. 在「回答」工作表的**第一列**建立以下標題：
   - A1: `ID`
   - B1: `闖關次數`
   - C1: `總分`
   - D1: `最高分`
   - E1: `第一次通關分數`
   - F1: `花了幾次通關`
   - G1: `最近遊玩時間`

---

## 🛠️ 步驟二：部署 Google Apps Script (後端)

1. 在剛建立的 Google 試算表中，點擊上方選單的 **擴充功能 > Apps Script**。
2. 開啟後會看到 `程式碼.gs`，將裡面的內容清空，並貼上本專案內的 `google_apps_script.gs` 的所有程式碼。
3. 點擊上方的 **「儲存」** (磁碟片圖示)。
4. 點擊右上角的 **「部署」 > 「新增部署作業」**。
5. 點擊「選取類型」旁邊的齒輪 ⚙️，選擇 **「網頁應用程式」**。
6. 設定如下：
   - **說明**: 隨意填寫 (例如：Pixel Game API)
   - **執行身分**: `我 (你的電子郵件)`
   - **誰可以存取**: `所有人 (Anyone)`
7. 點擊 **「部署」**。
   - *(注意：第一次授權時會跳出警告「Google 尚未驗證這個應用程式」，請點擊「進階」 > 「前往OOO(不安全)」允許存取)*
8. 部署成功後，會給您一個 **網頁應用程式網址 (Web App URL)**，請**複製這個網址**。

*(附註：如果之後有修改 .gs 程式碼，需點擊「部署」>「管理部署作業」> 編輯圖示 > 版本選「新增」才會生效！)*

---

## 💻 步驟三：設定與啟動 React 本地端 

1. 開啟終端機，進入專案資料夾 (`PIXEL-GAME`)。
2. 安裝依賴套件 (如果您尚未安裝)：
   ```bash
   npm install
   ```
3. 在專案根目錄下找到 (或建立) `.env` 檔案，並填入以下內容：
   *(請將您的 GAS 網址取代 `YOUR_GOOGLE_APP_SCRIPT_URL_HERE`)*

   ```env
   VITE_GOOGLE_APP_SCRIPT_URL=YOUR_GOOGLE_APP_SCRIPT_URL_HERE
   VITE_PASS_THRESHOLD=3
   VITE_QUESTION_COUNT=5
   ```
   - `VITE_PASS_THRESHOLD`: 設定答對幾題才算過關
   - `VITE_QUESTION_COUNT`: 設定每次遊戲隨機出幾題

4. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
5. 點擊終端機上的 `http://localhost:5173/` 即可開始遊玩！

---

## 🎨 遊戲特色
- **關主隨機圖**：每次挑戰都會透過 DiceBear API 隨機產生不重複的像素人物或怪物。
- **Mock Data 模式**：如果在 `.env` 的 GAS URL 未設定 (或包含 `YOUR_GOOGLE_APP`)，前端會自動啟用 Mock Data 讓你不用連線也能預覽畫面。

---

## 🌐 步驟四：自動部署至 GitHub Pages

本專案已包含 `deploy.yml`，可以在推送至 GitHub 時自動將最新的網站部署到 GitHub Pages。請遵循以下步驟設定環境變數（Secrets）：

1. **上傳至 GitHub**：確定您已經將此專案推送到您自己的 GitHub 儲存庫。
2. **開啟設定**：前往 GitHub Repository 的 **Settings** (設定) > **Secrets and variables** > **Actions**。
3. **新增 Repository secrets**：點擊 `New repository secret`，分別將您在 `.env` / `.env.example` 內的環境變數新增進去：
   - 屬性名稱欄位：`VITE_GOOGLE_APP_SCRIPT_URL`，值： *(您的 GAS URL)*
   - 屬性名稱欄位：`VITE_PASS_THRESHOLD`，值： `3` *(或您想要的分數門檻)*
   - 屬性名稱欄位：`VITE_QUESTION_COUNT`，值： `5` *(或您的出題數量)*
4. **開啟 GitHub Pages 權限**：至 GitHub Repository 的 **Settings** > **Pages**，將 **Source** 改選為 `GitHub Actions`。
5. **觸發自動部署**：當您下一次推送程式碼到 `main` 分支時，Actions 就會自動抓取這些參數，並幫您部署好免費且公開的遊戲網址囉！
