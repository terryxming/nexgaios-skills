#!/usr/bin/env python3
# extract_transcript.py — 从 Claude Code 会话 transcript(jsonl)逐字扣出问答对
#
# 行为契约（见 ADR-0013 / references/distill.md 的 signal-noise 结构层）：
#   纯只读会话 jsonl：不改 transcript、不读写用户知识库、不联网；仅用 Python 标准库。
#   只做「结构层」信号提取——机械可判、无主观判断：
#     保留：user 的真人 text/image + assistant 的 text/image（逐字，一字不改）；
#     滤除：assistant 的 thinking / tool_use、user 里的 tool_result、
#           mode/queue-operation/last-prompt/system/attachment 等元数据行、
#           isCompactSummary 摘要行、[Request interrupted by user] 中断标记。
#   「语义层」——一段问答有没有认知增量、值不值得沉淀——不在本脚本，留给 agent/distill 判。
#
# depends_on: transcript-extract
#   （脚本非 markdown，无 frontmatter；依赖以本注释等价声明。
#    是 transcript-extract 规则项的机械实现——只做结构层滤除；语义层判断在 agent。）

import os
import sys
import json
import glob
import argparse
from pathlib import Path
from collections import Counter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # Windows GBK 控制台直跑也能输出中文
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

INTERRUPT_MARKERS = {"[Request interrupted by user]"}
DEFAULT_PROJECTS_DIR = Path.home() / ".claude" / "projects"


def find_session_file(session_id, projects_dir):
    """按 session id 在 projects 下 glob <id>.jsonl（最稳，不重算 cwd 编码）。"""
    hits = glob.glob(str(Path(projects_dir) / "*" / f"{session_id}.jsonl"))
    return hits[0] if hits else None


def load_lines(path):
    out = []
    with open(path, encoding="utf-8") as f:
        for ln in f:
            ln = ln.strip()
            if not ln:
                continue
            try:
                out.append(json.loads(ln))
            except json.JSONDecodeError:
                pass
    return out


def split_content(content):
    """把一条 message 的 content 拆成 (texts, images)；thinking/tool_use/tool_result 一律丢弃。
    image 只留占位标记 [图片:media_type]——base64 还原是后续步骤（ADR-0013 待验证）。"""
    texts, images = [], []
    if isinstance(content, str):
        texts.append(content)
    elif isinstance(content, list):
        for b in content:
            if not isinstance(b, dict):
                continue
            bt = b.get("type")
            if bt == "text":
                texts.append(b.get("text", ""))
            elif bt == "image":
                media = (b.get("source") or {}).get("media_type", "image")
                images.append(media)
            # thinking / tool_use / tool_result → 结构层噪音，丢弃
    return texts, images


def has_tool_result(content):
    return isinstance(content, list) and any(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in content
    )


def build_turns(lines, stats):
    """按行序（= 时间序）重建问答轮次。
    真人 user text 开新轮；assistant text 追加到当前轮的答；工具/思考/元数据不开轮。"""
    turns = []
    cur = None
    for o in lines:
        t = o.get("type")
        if t not in ("user", "assistant"):
            stats[f"滤·{t}"] += 1
            continue
        if o.get("isCompactSummary"):
            stats["滤·compact摘要"] += 1
            continue
        m = o.get("message")
        if not isinstance(m, dict):
            continue
        content = m.get("content")
        texts, images = split_content(content)

        if m.get("role") == "user":
            real = [x for x in texts if x.strip() and x.strip() not in INTERRUPT_MARKERS]
            if has_tool_result(content) and not real:
                stats["滤·tool_result"] += 1
                continue
            if not real and not images:
                stats["滤·空/中断user"] += 1
                continue
            cur = {"q": "\n".join(real).strip(), "q_images": images, "a": [], "a_images": []}
            turns.append(cur)
            stats["问答轮"] += 1
        else:  # assistant
            keep = [x for x in texts if x.strip()]
            if not keep and not images:
                stats["滤·assistant非正文"] += 1  # 纯 thinking / tool_use 的行
                continue
            if cur is None:  # 答无对应问（会话开头罕见）
                cur = {"q": "(无对应提问)", "q_images": [], "a": [], "a_images": []}
                turns.append(cur)
            cur["a"].extend(keep)
            cur["a_images"].extend(images)
    return turns


def detect_compaction(lines):
    """本会话是否由压缩续接（前半段原文在前序文件）。返回 True 时需跨文件回溯。"""
    for o in lines[:12]:
        if o.get("isCompactSummary"):
            return True
    return False


def render_md(turns):
    out = []
    for i, turn in enumerate(turns, 1):
        out.append(f"## 〔第 {i} 轮〕")
        q = turn["q"]
        for media in turn["q_images"]:
            q += f"\n\n[图片:{media}]"
        out.append(f"> **问**:{q}")
        out.append("")
        answer = "\n\n".join(turn["a"]).strip()
        for media in turn["a_images"]:
            answer += f"\n\n[图片:{media}]"
        out.append("**答**（逐字）:")
        out.append(answer)
        out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="从 Claude Code 会话 jsonl 逐字扣出问答对（结构层）")
    ap.add_argument("--session", default=os.environ.get("CLAUDE_CODE_SESSION_ID"),
                    help="会话 id，默认取环境变量 CLAUDE_CODE_SESSION_ID")
    ap.add_argument("--projects-dir", default=str(DEFAULT_PROJECTS_DIR),
                    help="Claude projects 目录，默认 ~/.claude/projects")
    ap.add_argument("--format", choices=["md", "json"], default="md")
    ap.add_argument("--out", default=None, help="输出文件，默认 stdout")
    args = ap.parse_args()

    if not args.session:
        sys.exit("致命：未提供 --session，且环境变量 CLAUDE_CODE_SESSION_ID 为空。")
    path = find_session_file(args.session, args.projects_dir)
    if not path:
        sys.exit(f"致命：在 {args.projects_dir} 下未找到 {args.session}.jsonl。")

    lines = load_lines(path)
    stats = Counter()

    if detect_compaction(lines):
        print("⚠ 本会话由上下文压缩续接，前半段原文在前序文件——跨文件回溯尚未实现"
              "（ADR-0013 待验证），当前仅提取本文件。", file=sys.stderr)

    turns = build_turns(lines, stats)

    if args.format == "json":
        payload = json.dumps({"session": args.session, "file": path, "turns": turns},
                             ensure_ascii=False, indent=2)
    else:
        payload = render_md(turns)

    if args.out:
        Path(args.out).write_text(payload, encoding="utf-8")
    else:
        print(payload)

    # 统计打到 stderr，不污染产物
    print(f"\n源文件:{path}", file=sys.stderr)
    print(f"总行数:{len(lines)}  提取问答轮:{stats['问答轮']}", file=sys.stderr)
    print("过滤明细:" + "  ".join(f"{k}={v}" for k, v in sorted(stats.items()) if k != "问答轮"),
          file=sys.stderr)


if __name__ == "__main__":
    main()
