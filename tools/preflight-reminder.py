#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/preflight-reminder.py — UserPromptSubmit hook：每回合注入工程纪律 pre-flight 微清单。

背景：常驻大文档里的行为纪律在决策点不会自动触发（生成被"最强局部模式"主导），
本会话实证多次失守（未查证即断言、反复自我推翻；§2 多方案未摆理由）均属此类。
对策：把最高频失守的行为纪律做成每回合注入的微清单，出现在上下文最新位置
（recency 最高、恰在决策点前），机械触发、不靠自觉——A5 哲学的自我应用。

维护约定：清单必须保持极小（≤3 条），一长就重蹈"被无视的 warning"覆辙；
失守模式变化时替换条目，不追加。
"""
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # Windows 默认 GBK 控制台兼容

print("[pre-flight] ①先查证再断言·工具优先于记忆(A1/A4·2)；查不到才标「待验证」(A4·3) ②多方案→摆理由+给推荐(§2) ③落盘前先声明(A2)")
