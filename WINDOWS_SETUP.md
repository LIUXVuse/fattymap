# Windows 排程任務設定說明

這份文件說明如何在 Windows 設定排程任務，讓 Whisper 和摘要自動執行。

---

## 📋 自動化流程

```
Mac (週一 16:00)          Windows                    Mac (週二 16:00)
     │                         │                          │
     ▼                         │                          │
下載最新音檔 ─────────► input/S3EPxxx.mp3              │
     │                         │                          │
     │              (週一 17:00 或手動觸發)                │
     │                         │                          │
     │                         ▼                          │
     │               run_all_whisper_cuda.bat             │
     │                         │                          │
     │                         ▼                          │
     │               output/S3EPxxx_tw.txt                │
     │                         │                          │
     │                  (手動執行或排程)                    │
     │                         │                          │
     │                         ▼                          │
     │                     main.py                        │
     │                         │                          │
     │                         ▼                          │
     │               S3EPxxx_摘要.txt ─────────────────► 同步到網站
     │                                                    │
     │                                                    ▼
     │                                               Git push
```

---

## 🔧 設定步驟

### 步驟 1：建立 Whisper 處理批次檔

在 `C:\projects\whisper.cpp\` 建立一個新的批次檔 `auto_process_new.bat`：

```batch
@echo off
chcp 65001
echo ===================================
echo 自動處理新音檔
echo %date% %time%
echo ===================================

cd /d C:\projects\whisper.cpp

REM 檢查 input 資料夾是否有 .mp3 檔案
for %%f in (input\*.mp3) do (
    echo 發現音檔: %%~nf
    
    REM 檢查 output 是否已經有對應的 _tw.txt
    if not exist "output\%%~nf_tw.txt" (
        echo 處理中: %%~nf
        call run_all_whisper_cuda.bat
        goto :done
    ) else (
        echo 已處理過: %%~nf，跳過
    )
)

:done
echo ===================================
echo 處理完成
echo ===================================
```

---

### 步驟 2：設定 Windows 排程任務

1. 按 `Win + R`，輸入 `taskschd.msc`，按 Enter 開啟「工作排程器」

2. 在右側點選「建立基本工作」

3. **名稱**：`Podcast Whisper 自動處理`

4. **觸發程序**：每週
   - 每週一次
   - 週一
   - 時間：17:00（比 Mac 晚 1 小時，確保音檔已下載）

5. **動作**：啟動程式
   - 程式或指令碼：`C:\projects\whisper.cpp\auto_process_new.bat`
   - 開始位置：`C:\projects\whisper.cpp`

6. 完成並儲存

---

### 步驟 3：設定摘要自動執行（可選）

如果也想自動執行摘要，在 `C:\projects\faty\fatty_talk\S3EP201_204\` 建立 `auto_summary.bat`：

```batch
@echo off
chcp 65001
echo ===================================
echo 自動產生摘要
echo %date% %time%
echo ===================================

cd /d C:\projects\faty\fatty_talk\S3EP201_204

REM 啟動虛擬環境（如果有的話）
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM 複製最新的逐字稿
for %%f in (C:\projects\whisper.cpp\output\*_tw.txt) do (
    if not exist "faty_talk\%%~nxf" (
        echo 複製: %%~nxf
        copy "%%f" "faty_talk\"
    )
)

REM 執行摘要程式
python src\main.py

echo ===================================
echo 摘要完成
echo ===================================
```

然後再建立一個排程任務：

- 時間：週一 20:00（Whisper 處理完後）
- 執行：`C:\projects\faty\fatty_talk\S3EP201_204\auto_summary.bat`

---

## 🔍 手動執行

如果不想等排程，可以手動執行：

### 1. 執行 Whisper

```cmd
cd C:\projects\whisper.cpp
run_all_whisper_cuda.bat
```

### 2. 執行摘要

```cmd
cd C:\projects\faty\fatty_talk\S3EP201_204
python src\main.py
```

---

## ✅ 驗證

### 檢查 Mac 定時任務

```bash
launchctl list | grep fattymap
```

應該看到：

- `com.fattymap.podcast-update` - 週一 16:00 下載音檔
- `com.fattymap.podcast-sync` - 週二 16:00 同步結果

### 手動觸發同步

```bash
launchctl start com.fattymap.podcast-sync
```

### 查看 log

```bash
cat ~/Library/Logs/podcast-update.log
cat ~/Library/Logs/podcast-sync.log
```
