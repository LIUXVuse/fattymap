#!/bin/bash
# Podcast RSS 自動更新腳本
# 每週一下午 4 點由 launchd 執行

# 設定變數
PROJECT_DIR="/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
LOG_FILE="$HOME/Library/Logs/podcast-update.log"
VENV_PATH="$PROJECT_DIR/venv"

# 記錄開始時間
echo "========================================" >> "$LOG_FILE"
echo "🚀 開始更新 Podcast 資料" >> "$LOG_FILE"
echo "⏰ 時間: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# 切換到專案目錄
cd "$PROJECT_DIR" || {
    echo "❌ 無法切換到專案目錄: $PROJECT_DIR" >> "$LOG_FILE"
    exit 1
}

# 啟動虛擬環境並執行更新
source "$VENV_PATH/bin/activate" && {
    # 更新 JSON 檔案
    python podcast_downloader.py --generate-json >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        # 同時複製到 public 目錄供網站使用
        cp "$PROJECT_DIR/podcast_episodes.json" "$PROJECT_DIR/public/podcast_episodes.json"
        echo "✅ 更新成功！已複製到 public 目錄" >> "$LOG_FILE"
    else
        echo "❌ 更新失敗" >> "$LOG_FILE"
    fi
    
    deactivate
}

echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
