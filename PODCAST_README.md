# 📻 Podcast RSS 下載工具使用說明

這個工具可以幫你從 Firstory RSS feed 下載 podcast 音檔，並自動產生網站用的 JSON 檔案。

---

## 🚀 快速開始

### 1. 建立虛擬環境（第一次使用）

```bash
# 建立虛擬環境
python3 -m venv venv

# 啟動虛擬環境
source venv/bin/activate

# 安裝依賴套件
pip install -r requirements.txt
```

### 2. 使用腳本

```bash
# 啟動虛擬環境（每次使用前都要執行）
source venv/bin/activate

# 列出所有集數清單
python podcast_downloader.py --list

# 下載所有音檔（檔名格式：S3EP01.mp3）
python podcast_downloader.py --download

# 產生網站用的 JSON 檔案
python podcast_downloader.py --generate-json

# 一次完成：下載音檔 + 產生 JSON
python podcast_downloader.py --download --generate-json
```

---

## 📖 詳細使用方式

### 列出集數清單

顯示所有 podcast 集數的資訊（集數編號、標題、網址、發布日期）：

```bash
python podcast_downloader.py --list
```

輸出範例：

```
🎧 S3EP245
   📝 標題: 路人來分享新加坡人都去哪邊玩？
   🔗 網址: https://open.firstory.me/story/cmjpgrwsl00qd01sp2or3a0vc
   📅 日期: 2025-12-29
```

### 批量下載音檔

下載所有音檔到 `downloads/` 目錄，檔名格式為 `S3EP01.mp3`（方便跑 whisper）：

```bash
# 下載全部
python podcast_downloader.py --download

# 只下載第 222 到 245 集（最新的幾集）
python podcast_downloader.py --download --start 222 --end 245

# 強制重新下載已存在的檔案
python podcast_downloader.py --download --force

# 指定下載目錄
python podcast_downloader.py --download --output my_podcasts/
```

### 產生網站用的 JSON 檔案

從 RSS feed 擷取每集的資訊（集數編號、標題、專屬連結），產生 `podcast_episodes.json`：

```bash
python podcast_downloader.py --generate-json
```

產生的 JSON 檔案格式：

```json
[
  {
    "episodeNumber": "S3EP245",
    "season": 3,
    "episode": 245,
    "title": "路人來分享新加坡人都去哪邊玩？",
    "url": "https://open.firstory.me/story/cmjpgrwsl00qd01sp2or3a0vc",
    "audioUrl": "https://m.cdn.firstory.me/track/...",
    "pubDate": "2025-12-29"
  }
]
```

---

## 🌐 網站整合

腳本產生的 `podcast_episodes.json` 會被網站自動讀取，讓每個「收聽這一集」按鈕都能直接跳轉到 Firstory 的專屬頁面。

### 更新網站資料

1. 執行腳本產生最新的 JSON 檔案：

   ```bash
   source venv/bin/activate
   python podcast_downloader.py --generate-json
   ```

2. 重新啟動網站（如果需要）：

   ```bash
   npm run dev
   ```

3. 打開網站，點選「Podcast」標籤，確認每集都能正確跳轉

---

## 💡 常見使用場景

### 場景 1：下載最新集數給 whisper

你已經有 1-221 集的逐字稿，想下載 222-245 集（最新的）：

```bash
source venv/bin/activate
python podcast_downloader.py --download --start 222 --end 245
```

音檔會下載到 `downloads/` 目錄，檔名為 `S3EP222.mp3`、`S3EP223.mp3` 等，方便你跑 whisper。

### 場景 2：更新網站的 Podcast 資料

有新的 podcast 集數發布，想更新網站上的資訊：

```bash
source venv/bin/activate
python podcast_downloader.py --generate-json
```

網站會自動從 `podcast_episodes.json` 讀取最新資料。

### 場景 3：重新下載某集音檔

某集音檔損壞或需要重新下載：

```bash
source venv/bin/activate
python podcast_downloader.py --download --start 100 --end 100 --force
```

---

## ⚙️ 指令參數說明

| 參數 | 簡寫 | 說明 | 範例 |
|------|------|------|------|
| `--list` | `-l` | 列出所有集數清單 | `python podcast_downloader.py --list` |
| `--download` | `-d` | 下載音檔 | `python podcast_downloader.py --download` |
| `--generate-json` | `-g` | 產生網站用 JSON | `python podcast_downloader.py --generate-json` |
| `--output` | `-o` | 指定下載目錄 | `--output my_podcasts/` |
| `--json-file` | `-j` | 指定 JSON 輸出檔案 | `--json-file episodes.json` |
| `--start` | - | 起始集數 | `--start 222` |
| `--end` | - | 結束集數 | `--end 245` |
| `--force` | `-f` | 強制重新下載 | `--force` |

---

## 🐛 常見問題

### Q: 虛擬環境啟動後，指令找不到？

A: 請確認虛擬環境已啟動（提示符前面會有 `(venv)`），並且已安裝依賴套件：

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Q: 下載速度很慢？

A: 可能是網路問題，可以試試先下載幾集測試：

```bash
python podcast_downloader.py --download --start 240 --end 245
```

### Q: 網站上的「收聽這一集」按鈕還是跳到通用頁面？

A: 請確認：

1. 已執行 `python podcast_downloader.py --generate-json`
2. `podcast_episodes.json` 檔案在專案根目錄
3. 網站已重新啟動

### Q: 檔名格式可以改嗎？

A: 目前檔名格式固定為 `S3EP01.mp3`（方便跑 whisper），如果需要修改可以編輯 `podcast_downloader.py` 的第 99 行。

---

## 📝 檔案說明

- `podcast_downloader.py` - 主程式腳本
- `requirements.txt` - Python 依賴套件清單
- `podcast_episodes.json` - 網站用的 podcast 資料（自動產生）
- `downloads/` - 音檔下載目錄（自動建立）
- `venv/` - Python 虛擬環境（自動建立）

---

祝你使用愉快！🎉

---

## 🤖 自動更新設定

系統已設定 **每週一下午 4 點** 自動更新 Podcast 資料。

> **注意（2026-05-12 更新）**：git push 已改用 SSH 認證（`git@github.com:LIUXVuse/fattymap.git`），不再依賴 `GH_TOKEN` 環境變數。launchd 環境下也能正常 push。

### 查看定時任務狀態

```bash
launchctl list | grep fattymap
```

輸出 `0 com.fattymap.podcast-update` 表示任務正常運作。

### 手動觸發更新

如果想要立即更新（不等到週一）：

```bash
launchctl start com.fattymap.podcast-update
```

### 查看更新記錄

```bash
cat ~/Library/Logs/podcast-update.log
```

### 停用自動更新

```bash
launchctl unload ~/Library/LaunchAgents/com.fattymap.podcast-update.plist
```

### 重新啟用自動更新

```bash
launchctl load ~/Library/LaunchAgents/com.fattymap.podcast-update.plist
```

### 相關檔案

- `update_podcast.sh` - 自動更新腳本（下載音檔到 Windows）
- `sync_podcast_results.sh` - 同步 Windows 處理結果到網站
- `~/Library/LaunchAgents/com.fattymap.podcast-update.plist` - 週一 16:00 執行
- `~/Library/LaunchAgents/com.fattymap.podcast-sync.plist` - 週二 16:00 執行
- `~/Library/Logs/podcast-update.log` - 更新記錄
- `~/Library/Logs/podcast-sync.log` - 同步記錄

---

## 🔄 完整自動化流程

整個流程需要 Mac 和 Windows 協作：

```
週一 16:00 (Mac)          週一 17:00+ (Windows)       週二 16:00 (Mac)
      │                          │                        │
      ▼                          │                        │
更新 JSON                        │                        │
下載音檔到 Windows ────► Whisper 轉逐字稿               │
      │                          │                        │
      │                          ▼                        │
      │                    產生摘要                       │
      │                          │                        │
      │                          └────────────────────►  同步到網站
      │                                                   │
      │                                                   ▼
      │                                              Git push
```

### Windows 設定說明

請參考 [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) 設定 Windows 排程任務。
