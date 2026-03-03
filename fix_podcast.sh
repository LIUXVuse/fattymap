#!/bin/bash
# ============================================
# 🔧 Podcast 一鍵修復腳本
# 雙擊此檔案即可自動執行所有修復步驟
# ============================================

echo "🔧 開始一鍵修復 Podcast 自動化..."
echo ""

PROJECT_DIR="$HOME/Documents/porject/肥宅老司機前進世界地圖"

# 步驟 1：重新載入排程任務
echo "📋 步驟 1/4：重新載入排程任務..."
launchctl unload ~/Library/LaunchAgents/com.fattymap.podcast-update.plist 2>/dev/null
launchctl unload ~/Library/LaunchAgents/com.fattymap.podcast-sync.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.fattymap.podcast-update.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.fattymap.podcast-sync.plist 2>/dev/null

if launchctl list | grep -q fattymap; then
    echo "   ✅ 排程任務已載入！"
else
    echo "   ⚠️ 排程任務載入可能需要重新登入"
fi

# 步驟 2：複製漏掉的兩集到 Windows Whisper
echo ""
echo "📥 步驟 2/4：複製 S3EP252、S3EP253 到 Windows..."

# 偵測 Windows 掛載路徑
if [ -d "/Volumes/192.168.1.106/projects/whisper.cpp/input" ]; then
    WHISPER_INPUT="/Volumes/192.168.1.106/projects/whisper.cpp/input"
elif [ -d "/Volumes/projects/whisper.cpp/input" ]; then
    WHISPER_INPUT="/Volumes/projects/whisper.cpp/input"
elif [ -d "/Volumes/desktop-0i312mm/projects/whisper.cpp/input" ]; then
    WHISPER_INPUT="/Volumes/desktop-0i312mm/projects/whisper.cpp/input"
else
    echo "   ❌ 找不到 Windows whisper input 資料夾！"
    echo "   請確認 Windows 電腦已開機且共享已連線"
    WHISPER_INPUT=""
fi

if [ -n "$WHISPER_INPUT" ]; then
    echo "   使用路徑: $WHISPER_INPUT"
    
    for EP in S3EP252 S3EP253; do
        if [ -f "$PROJECT_DIR/downloads/$EP.mp3" ]; then
            if [ ! -f "$WHISPER_INPUT/$EP.mp3" ]; then
                cp "$PROJECT_DIR/downloads/$EP.mp3" "$WHISPER_INPUT/" 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo "   ✅ $EP.mp3 已複製到 Windows"
                else
                    echo "   ❌ $EP.mp3 複製失敗（權限問題），請用 Finder 手動拖拉"
                fi
            else
                echo "   ⏭️ $EP.mp3 已存在，跳過"
            fi
        else
            echo "   ⚠️ $EP.mp3 不存在於 downloads/"
        fi
    done
fi

# 步驟 3：更新網站 JSON
echo ""
echo "📝 步驟 3/4：更新網站 JSON..."
cd "$PROJECT_DIR"
source venv/bin/activate 2>/dev/null
python podcast_downloader.py --generate-json 2>/dev/null
if [ $? -eq 0 ]; then
    cp podcast_episodes.json public/podcast_episodes.json
    echo "   ✅ JSON 已更新！"
else
    echo "   ❌ JSON 更新失敗"
fi

# 步驟 4：同步現有摘要到網站
echo ""
echo "📤 步驟 4/4：同步摘要到網站..."
bash "$PROJECT_DIR/sync_podcast_results.sh" 2>/dev/null

echo ""
echo "============================================"
echo "🎉 修復完成！"
echo ""
echo "📌 注意事項："
echo "   - S3EP252、S3EP253 複製到 Windows 後"
echo "     需要等 Whisper 處理完才會有逐字稿和摘要"
echo "   - Windows 處理完後，下週一 17:30 會自動同步"
echo "   - 或你可以手動執行："
echo "     bash $PROJECT_DIR/sync_podcast_results.sh"
echo "============================================"
echo ""
echo "按 Enter 關閉此視窗..."
read
