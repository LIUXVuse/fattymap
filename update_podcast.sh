#!/bin/bash
# Podcast RSS 自動更新腳本
# 每週一下午 4 點由 launchd 執行
# 1. 下載音檔到 Mac 本地（速度快）
# 2. 複製到 Windows 共享資料夾（本地複製比網路下載快）

# 設定變數
PROJECT_DIR="/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
LOG_FILE="$HOME/Library/Logs/podcast-update.log"
VENV_PATH="$PROJECT_DIR/venv"
LOCAL_DOWNLOADS="$PROJECT_DIR/downloads"

# Windows 共享資料夾路徑
# 優先使用 IP 掛載，fallback 到 hostname 掛載
WHISPER_INPUT_BY_IP="/Volumes/192.168.1.106/projects/whisper.cpp/input"
WHISPER_INPUT_BY_HOST="/Volumes/projects/whisper.cpp/input"

# 自動偵測可用的掛載路徑
if [ -d "$WHISPER_INPUT_BY_IP" ]; then
    WHISPER_INPUT="$WHISPER_INPUT_BY_IP"
elif [ -d "$WHISPER_INPUT_BY_HOST" ]; then
    WHISPER_INPUT="$WHISPER_INPUT_BY_HOST"
else
    WHISPER_INPUT="$WHISPER_INPUT_BY_IP"  # 預設用 IP（後面會檢查是否可用）
fi

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

        # 自動 commit + push JSON 變更（如有新集數）
        if ! git diff --quiet podcast_episodes.json public/podcast_episodes.json; then
            echo "📤 偵測到新集數，自動 commit JSON..." >> "$LOG_FILE"
            git add podcast_episodes.json public/podcast_episodes.json
            git commit -m "feat: 自動更新 podcast_episodes.json ($(date '+%Y-%m-%d'))" >> "$LOG_FILE" 2>&1
            if git push >> "$LOG_FILE" 2>&1; then
                echo "✅ JSON Git 更新成功！" >> "$LOG_FILE"
            else
                echo "❌ JSON Git push 失敗，請手動處理" >> "$LOG_FILE"
            fi
        else
            echo "ℹ️ JSON 無新集數，跳過 commit" >> "$LOG_FILE"
        fi
        
        # 2. 取得最新 3 集的資訊
        echo "📺 檢查最新 3 集..." >> "$LOG_FILE"
        
        # 使用 Python 取得最新 3 集的編號
        EPISODES_INFO=$(python -c "
import json
eps = json.load(open('podcast_episodes.json'))
for i in range(min(3, len(eps))):
    print(f\"{eps[i]['episode']}|{eps[i]['episodeNumber']}\")
" 2>/dev/null)
        
        # 3. 下載最新 3 集到 Mac 本地（已有的會跳過）
        DOWNLOAD_COUNT=0
        while IFS='|' read -r EP_NUM EP_NAME; do
            if [ -z "$EP_NUM" ]; then continue; fi
            
            if [ ! -f "$LOCAL_DOWNLOADS/$EP_NAME.mp3" ]; then
                echo "📥 下載 $EP_NAME 到 Mac 本地..." >> "$LOG_FILE"
                python podcast_downloader.py --download --start "$EP_NUM" --end "$EP_NUM" >> "$LOG_FILE" 2>&1
                
                if [ $? -eq 0 ]; then
                    echo "   ✅ $EP_NAME.mp3 下載完成" >> "$LOG_FILE"
                    ((DOWNLOAD_COUNT++))
                else
                    echo "   ❌ $EP_NAME.mp3 下載失敗" >> "$LOG_FILE"
                fi
            else
                echo "⏭️ $EP_NAME.mp3 已存在，跳過下載" >> "$LOG_FILE"
            fi
        done <<< "$EPISODES_INFO"
        
        echo "📊 本次下載了 $DOWNLOAD_COUNT 個新檔案" >> "$LOG_FILE"
        
        # 4. 如果 Windows 可用，複製所有新音檔過去
        if [ "$WHISPER_AVAILABLE" = true ]; then
            COPY_COUNT=0
            while IFS='|' read -r EP_NUM EP_NAME; do
                if [ -z "$EP_NUM" ]; then continue; fi
                
                if [ -f "$LOCAL_DOWNLOADS/$EP_NAME.mp3" ]; then
                    if [ ! -f "$WHISPER_INPUT/$EP_NAME.mp3" ]; then
                        echo "📤 複製 $EP_NAME.mp3 到 Windows..." >> "$LOG_FILE"
                        cp "$LOCAL_DOWNLOADS/$EP_NAME.mp3" "$WHISPER_INPUT/"
                        
                        if [ $? -eq 0 ]; then
                            echo "   ✅ 已複製到 Windows" >> "$LOG_FILE"
                            ((COPY_COUNT++))
                        else
                            echo "   ❌ 複製失敗" >> "$LOG_FILE"
                        fi
                    else
                        echo "⏭️ Windows 已有 $EP_NAME.mp3，跳過" >> "$LOG_FILE"
                    fi
                fi
            done <<< "$EPISODES_INFO"
            
            echo "📊 本次複製了 $COPY_COUNT 個檔案到 Windows" >> "$LOG_FILE"
        fi
    else
        echo "❌ JSON 更新失敗" >> "$LOG_FILE"
    fi
    
    deactivate
}

echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
