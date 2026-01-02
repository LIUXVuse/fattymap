#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Podcast RSS 下載工具
從 Firstory RSS feed 下載 podcast 音檔，並產生網站用的 JSON 檔案
"""

import feedparser
import requests
import json
import os
import re
import argparse
from pathlib import Path
from tqdm import tqdm
from datetime import datetime


# RSS Feed URL
RSS_URL = "https://feed.firstory.me/rss/user/ckfxl5d27rbym0800l58wgleg"

# 預設下載目錄
DEFAULT_OUTPUT_DIR = "downloads"

# 預設 JSON 輸出檔案
DEFAULT_JSON_FILE = "podcast_episodes.json"


def parse_rss(url):
    """解析 RSS feed，回傳所有集數資訊"""
    print(f"🔍 正在解析 RSS feed: {url}")
    feed = feedparser.parse(url)
    
    if not feed.entries:
        print("❌ 無法解析 RSS feed 或沒有找到任何集數")
        return []
    
    episodes = []
    for entry in feed.entries:
        # 取得季數和集數
        season = entry.get('itunes_season', '1')
        episode = entry.get('itunes_episode', '0')
        
        # 產生集數編號：S3EP01
        episode_number = f"S{season}EP{int(episode):02d}"
        
        # 取得標題
        title = entry.get('title', '').strip()
        
        # 取得專屬連結
        url = entry.get('link', '')
        
        # 取得音檔下載連結
        audio_url = ''
        if 'enclosures' in entry and len(entry.enclosures) > 0:
            audio_url = entry.enclosures[0].get('href', '')
        
        # 取得發布日期
        pub_date = entry.get('published', '')
        if pub_date:
            try:
                # 轉換為 YYYY-MM-DD 格式
                dt = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %Z')
                pub_date = dt.strftime('%Y-%m-%d')
            except:
                pass
        
        episodes.append({
            'episodeNumber': episode_number,
            'season': int(season),
            'episode': int(episode),
            'title': title,
            'url': url,
            'audioUrl': audio_url,
            'pubDate': pub_date
        })
    
    # 按集數排序（由新到舊）
    episodes.sort(key=lambda x: (x['season'], x['episode']), reverse=True)
    
    print(f"✅ 成功解析 {len(episodes)} 集")
    return episodes


def list_episodes(episodes):
    """列出所有集數資訊"""
    print("\n📻 ===== Podcast 集數清單 =====\n")
    
    for ep in episodes:
        print(f"🎧 {ep['episodeNumber']}")
        print(f"   📝 標題: {ep['title']}")
        print(f"   🔗 網址: {ep['url']}")
        print(f"   📅 日期: {ep['pubDate']}")
        print()
    
    print(f"總共 {len(episodes)} 集\n")


def download_episode(episode, output_dir, force=False):
    """下載單集音檔"""
    # 檔名格式：S3EP01.mp3
    filename = f"{episode['episodeNumber']}.mp3"
    filepath = Path(output_dir) / filename
    
    # 檢查檔案是否已存在
    if filepath.exists() and not force:
        print(f"⏭️  {filename} 已存在，跳過")
        return True
    
    # 下載音檔
    try:
        response = requests.get(episode['audioUrl'], stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(filepath, 'wb') as f, tqdm(
            desc=filename,
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
        ) as pbar:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                pbar.update(len(chunk))
        
        print(f"✅ {filename} 下載完成")
        return True
    
    except Exception as e:
        print(f"❌ {filename} 下載失敗: {e}")
        return False


def download_all(episodes, output_dir, start_episode=None, end_episode=None, force=False):
    """批量下載音檔"""
    # 建立輸出目錄
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # 過濾集數範圍
    if start_episode or end_episode:
        filtered = []
        for ep in episodes:
            ep_num = ep['episode']
            if start_episode and ep_num < start_episode:
                continue
            if end_episode and ep_num > end_episode:
                continue
            filtered.append(ep)
        episodes = filtered
    
    print(f"\n📥 準備下載 {len(episodes)} 集到 {output_dir}/\n")
    
    success_count = 0
    for ep in episodes:
        if download_episode(ep, output_dir, force):
            success_count += 1
    
    print(f"\n🎉 下載完成！成功 {success_count}/{len(episodes)} 集")


def generate_json(episodes, output_file):
    """產生網站用的 JSON 檔案"""
    print(f"\n📝 產生 JSON 檔案: {output_file}")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(episodes, f, ensure_ascii=False, indent=2)
        
        print(f"✅ JSON 檔案已產生，包含 {len(episodes)} 集資訊")
        print(f"   網站可以從此檔案讀取每集的專屬連結")
    
    except Exception as e:
        print(f"❌ 產生 JSON 檔案失敗: {e}")


def main():
    parser = argparse.ArgumentParser(
        description='Podcast RSS 下載工具 - 下載音檔並產生網站用 JSON'
    )
    
    parser.add_argument(
        '-l', '--list',
        action='store_true',
        help='列出所有集數清單'
    )
    
    parser.add_argument(
        '-d', '--download',
        action='store_true',
        help='下載音檔'
    )
    
    parser.add_argument(
        '-g', '--generate-json',
        action='store_true',
        help='產生網站用的 JSON 檔案'
    )
    
    parser.add_argument(
        '-o', '--output',
        default=DEFAULT_OUTPUT_DIR,
        help=f'音檔下載目錄（預設：{DEFAULT_OUTPUT_DIR}）'
    )
    
    parser.add_argument(
        '-j', '--json-file',
        default=DEFAULT_JSON_FILE,
        help=f'JSON 輸出檔案（預設：{DEFAULT_JSON_FILE}）'
    )
    
    parser.add_argument(
        '--start',
        type=int,
        help='起始集數（例如：222）'
    )
    
    parser.add_argument(
        '--end',
        type=int,
        help='結束集數（例如：240）'
    )
    
    parser.add_argument(
        '-f', '--force',
        action='store_true',
        help='強制重新下載已存在的檔案'
    )
    
    args = parser.parse_args()
    
    # 如果沒有指定任何動作，顯示幫助訊息
    if not (args.list or args.download or args.generate_json):
        parser.print_help()
        return
    
    # 解析 RSS
    episodes = parse_rss(RSS_URL)
    if not episodes:
        return
    
    # 列出清單
    if args.list:
        list_episodes(episodes)
    
    # 下載音檔
    if args.download:
        download_all(
            episodes,
            args.output,
            start_episode=args.start,
            end_episode=args.end,
            force=args.force
        )
    
    # 產生 JSON
    if args.generate_json:
        generate_json(episodes, args.json_file)


if __name__ == '__main__':
    main()
