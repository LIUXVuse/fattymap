#!/bin/bash
# Podcast RSS 自動更新腳本
# 每週一下午 4 點由 launchd 執行
# 自動下載最新音檔到 Windows 共享資料夾供 Whisper 處理

# 設定變數
PROJECT_DIR="/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
LOG_FILE="$HOME/Library/Logs/podcast-update.log"
VENV_PATH="$PROJECT_DIR/venv"

# Windows 共享資料夾路徑
WHISPER_INPUT="/Volumes/desktop-0i312mm-1/projects/whisper.cpp/input"

# 記錄開始時間
echo "========================================" >> "$LOG_FILE"
echo "🚀 開始更新 Podcast 資料" >> "$LOG_FILE"
echo "⏰ 時間: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# 切換到專案目錄
cd "$PROJECT_DIR" || {
    echo "❌ 無法切換到專案目錄: $PROJECT_DIR" >> "$LOG_FILE"
    exit 1
}

# 檢查 Windows 共享資料夾是否可用
if [ ! -d "$WHISPER_INPUT" ]; then
    echo "⚠️ Windows 共享資料夾不可用: $WHISPER_INPUT" >> "$LOG_FILE"
    echo "   請確認 Windows 電腦已開機且共享已連線" >> "$LOG_FILE"
    WHISPER_AVAILABLE=false
else
    echo "✅ Windows 共享資料夾已連線" >> "$LOG_FILE"
    WHISPER_AVAILABLE=true
fi

# 啟動虛擬環境並執行更新
source "$VENV_PATH/bin/activate" && {
    # 1. 更新 JSON 檔案
    echo "📋 更新 podcast_episodes.json..." >> "$LOG_FILE"
    python podcast_downloader.py --generate-json >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        # 複製到 public 目錄供網站使用
        cp "$PROJECT_DIR/podcast_episodes.json" "$PROJECT_DIR/public/podcast_episodes.json"
        echo "✅ JSON 更新成功！" >> "$LOG_FILE"
        
        # 2. 取得最新集數編號
        LATEST_EP=$(python -c "import json; eps=json.load(open('podcast_episodes.json')); print(eps[0]['episodeNumber'])" 2>/dev/null)
        echo "📺 最新集數: $LATEST_EP" >> "$LOG_FILE"
        
        # 3. 如果 Windows 可用，下載最新音檔到 Whisper input
        if [ "$WHISPER_AVAILABLE" = true ]; then
            # 檢查音檔是否已存在
            if [ -f "$WHISPER_INPUT/$LATEST_EP.mp3" ]; then
                echo "⏭️ 音檔已存在於 Whisper input，跳過下載" >> "$LOG_FILE"
            else
                echo "📥 下載最新音檔到 Whisper input..." >> "$LOG_FILE"
                # 取得最新集數號碼
                EP_NUM=$(python -c "import json; eps=json.load(open('podcast_episodes.json')); print(eps[0]['episode'])" 2>/dev/null)
                python podcast_downloader.py --download --start "$EP_NUM" --end "$EP_NUM" --output "$WHISPER_INPUT" >> "$LOG_FILE" 2>&1
                
                if [ $? -eq 0 ]; then
                    echo "✅ 音檔已下載到: $WHISPER_INPUT/$LATEST_EP.mp3" >> "$LOG_FILE"
                else
                    echo "❌ 音檔下載失敗" >> "$LOG_FILE"
                fi
            fi
        fi
    else
        echo "❌ JSON 更新失敗" >> "$LOG_FILE"
    fi
    
    deactivate
}

echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
