#!/bin/bash
# OpenClaw Skills のセットアップスクリプト
# MacBook Air 上で実行する

SKILLS_DIR="$HOME/.openclaw/skills"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# スキルディレクトリが存在しない場合は作成
mkdir -p "$SKILLS_DIR"

# スキルをシンボリックリンクで設置
for skill in job-chat job-status job-add job-reminder; do
  ln -sfn "$REPO_DIR/skills/$skill" "$SKILLS_DIR/$skill"
  echo "✅ $skill をリンクしました"
done

echo ""
echo "セットアップ完了！ OpenClaw を再起動してスキルを読み込んでください。"
