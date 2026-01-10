#!/bin/bash
# 同步 Whisper 和摘要結果到網站
# 此腳本會：
# 1. 從 Windows whisper output 複製逐字稿到 public/doc
# 2. 從 Windows fatty_talk output 複製摘要到 public/doc  
# 3. 自動 commit 並 push 到 Git

# 設定變數
PROJECT_DIR="/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
LOG_FILE="$HOME/Library/Logs/podcast-sync.log"
PUBLIC_DOC="$PROJECT_DIR/public/doc"

# Windows 共享資料夾路徑
WHISPER_OUTPUT="/Volumes/desktop-0i312mm-1/projects/whisper.cpp/output"
SUMMARY_OUTPUT="/Volumes/desktop-0i312mm-1/projects/faty/fatty_talk/S3EP201_204/output"

# 記錄開始時間
echo "========================================" >> "$LOG_FILE"
echo "🔄 開始同步 Podcast 處理結果" >> "$LOG_FILE"
echo "⏰ 時間: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# 切換到專案目錄
cd "$PROJECT_DIR" || {
    echo "❌ 無法切換到專案目錄: $PROJECT_DIR" >> "$LOG_FILE"
    exit 1
}

# 計數器
COPIED_COUNT=0

# 1. 同步 Whisper 逐字稿（_tw.txt 檔案）
if [ -d "$WHISPER_OUTPUT" ]; then
    echo "📄 檢查 Whisper 逐字稿..." >> "$LOG_FILE"
    
    for file in "$WHISPER_OUTPUT"/*_tw.txt; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # 檢查是否已存在於 public/doc
            if [ ! -f "$PUBLIC_DOC/$filename" ]; then
                cp "$file" "$PUBLIC_DOC/"
                echo "   ✅ 複製: $filename" >> "$LOG_FILE"
                ((COPIED_COUNT++))
            fi
        fi
    done
else
    echo "⚠️ Whisper output 資料夾不可用" >> "$LOG_FILE"
fi

# 2. 同步摘要檔案（_摘要.txt 檔案）
if [ -d "$SUMMARY_OUTPUT" ]; then
    echo "📝 檢查摘要檔案..." >> "$LOG_FILE"
    
    for file in "$SUMMARY_OUTPUT"/*_摘要.txt; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            # 檢查是否已存在於 public/doc
            if [ ! -f "$PUBLIC_DOC/$filename" ]; then
                cp "$file" "$PUBLIC_DOC/"
                echo "   ✅ 複製: $filename" >> "$LOG_FILE"
                ((COPIED_COUNT++))
            fi
        fi
    done
else
    echo "⚠️ 摘要 output 資料夾不可用" >> "$LOG_FILE"
fi

# 3. 如果有新檔案，自動 commit 並 push
if [ $COPIED_COUNT -gt 0 ]; then
    echo "📤 發現 $COPIED_COUNT 個新檔案，準備更新 Git..." >> "$LOG_FILE"
    
    git add public/doc/
    git commit -m "feat: 自動更新 Podcast 逐字稿與摘要 ($(date '+%Y-%m-%d'))"
    
    if git push 2>> "$LOG_FILE"; then
        echo "✅ Git 更新成功！" >> "$LOG_FILE"
    else
        echo "❌ Git push 失敗，請手動處理" >> "$LOG_FILE"
    fi
else
    echo "ℹ️ 沒有新檔案需要同步" >> "$LOG_FILE"
fi

echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
