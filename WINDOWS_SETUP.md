# Windows 排程任務設定說明

這份文件說明如何在 Windows 設定排程任務，讓 Whisper 和摘要自動執行。

---

## 📋 完整自動化時間表（週一）

| 時間 | 位置 | 動作 |
|------|------|------|
| 16:00 | Mac | 下載音檔到 Windows `input/` + 更新 JSON |
| 16:30 | Windows | 執行 `auto_full_process.bat`（Whisper + 摘要） |
| 19:30 | Mac | 同步結果到網站 + Git push |

```
16:00 Mac        16:30 Windows           17:00~19:00           19:30 Mac
  │                    │                      │                    │
  ▼                    │                      │                    │
下載音檔 ────────► Whisper 轉逐字稿          │                    │
                       │                      │                    │
                       └────► 產生摘要 ───────┘                    │
                                              │                    │
                                      output/_摘要.txt ──────────► 同步 + Git
```

---

## 🔧 設定步驟（只需做一次）

### 步驟 1：確認批次檔已存在

我已經幫你建立了 `auto_full_process.bat` 在：

```
C:\projects\whisper.cpp\auto_full_process.bat
```

這個批次檔會：

1. 檢查 `input/` 是否有新音檔
2. 執行 Whisper 轉逐字稿
3. 複製逐字稿到摘要輸入資料夾
4. 執行 `main.py` 產生摘要

---

### 步驟 2：設定 Windows 排程任務

1. 按 `Win + R`，輸入 `taskschd.msc`，按 Enter

2. 在右側點選「**建立基本工作**」

3. **名稱**：`Podcast 自動處理（Whisper + 摘要）`

4. **觸發程序**：選擇「每週」
   - 每週執行
   - 勾選「**星期一**」
   - 時間：`16:30:00`

5. **動作**：選擇「啟動程式」
   - 程式或指令碼：

     ```
     C:\projects\whisper.cpp\auto_full_process.bat
     ```

   - 開始位置：

     ```
     C:\projects\whisper.cpp
     ```

6. **完成**：勾選「當我按完成時，開啟此工作的內容對話方塊」

7. 在「**一般**」標籤中：
   - 勾選「**不論使用者登入與否均執行**」（這樣電腦閒置也會執行）
   - 勾選「**以最高權限執行**」

8. 點選「確定」並輸入 Windows 密碼

---

## 🔍 手動執行

### 測試批次檔

在 Windows 上雙擊 `auto_full_process.bat`，或在 CMD 執行：

```cmd
cd C:\projects\whisper.cpp
auto_full_process.bat
```

### 手動觸發 Mac 同步

```bash
launchctl start com.fattymap.podcast-sync
```

---

## ✅ 驗證設定

### 1. 確認 Mac 排程

```bash
launchctl list | grep fattymap
```

應該看到：

- `com.fattymap.podcast-update` - 週一 16:00
- `com.fattymap.podcast-sync` - 週一 19:30

### 2. 確認 Windows 排程

打開「工作排程器」，在「工作排程器程式庫」中找到「Podcast 自動處理」

### 3. 查看 Mac log

```bash
cat ~/Library/Logs/podcast-update.log
cat ~/Library/Logs/podcast-sync.log
```

---

## 📁 相關檔案位置

### Windows

| 檔案 | 路徑 |
|------|------|
| 自動化批次檔 | `C:\projects\whisper.cpp\auto_full_process.bat` |
| Whisper 輸入 | `C:\projects\whisper.cpp\input\` |
| Whisper 輸出 | `C:\projects\whisper.cpp\output\` |
| 摘要輸入 | `C:\projects\faty\fatty_talk\S3EP201_204\faty_talk\` |
| 摘要輸出 | `C:\projects\faty\fatty_talk\S3EP201_204\output\` |

### Mac

| 檔案 | 路徑 |
|------|------|
| 下載腳本 | `update_podcast.sh` |
| 同步腳本 | `sync_podcast_results.sh` |
| 網站資料 | `public/doc/` |
