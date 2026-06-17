from __future__ import annotations

import argparse
import html
import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd


OBJECT_LABELS = {
    "campaigns": "广告活动",
    "sbCampaigns": "SB广告活动",
    "adGroups": "广告组",
    "productAds": "广告商品",
    "keywords": "关键词",
    "sbKeywords": "SB关键词",
    "negativeKeywords": "否定关键词",
    "sbNegativeKeywords": "SB否定关键词",
    "targets": "商品投放",
    "negativeTargets": "否定商品投放",
    "campaignNegativeKeywords": "活动否定关键词",
    "profiles": "广告账号",
}

VARIABLE_LABELS = {
    "BID_AMOUNT": "竞价",
    "DEFAULT_BID_AMOUNT": "默认竞价",
    "BUDGET_AMOUNT": "预算金额",
    "IN_BUDGET": "是否预算内",
    "STATUS": "状态",
    "NAME": "名称",
    "SMART_BIDDING_STRATEGY": "智能竞价策略",
    "PLACEMENT_TOP": "搜索首页顶部加价",
    "PLACEMENT_REST_OF_SEARCH": "搜索结果其余位置加价",
    "PLACEMENT_PRODUCT_PAGE": "商品页面加价",
    "STRATEGY": "竞价策略",
    "PORTFOLIO_ID": "广告组合ID",
    "START_DATE": "开始日期",
    "(empty)": "无变量明细",
}

CHANGE_TYPE_LABELS = {
    "update": "更新",
    "create": "创建",
    "(empty)": "无操作类型",
}

IGNORED_ANALYSIS_VARIABLE_CODES = {"(empty)", "IN_BUDGET"}

FIELD_HELP = {
    "time": "操作发生时间，来自领星广告操作日志。",
    "ad_type": "广告类型：SP=Sponsored Products，SB=Sponsored Brands，SD=Sponsored Display。",
    "object_type": "被操作的广告对象层级，例如广告活动、广告组、关键词、商品投放。",
    "campaign": "操作所属广告活动名称。",
    "object": "被操作的具体对象。对象类型为关键词时，这里是关键词；对象类型为广告活动时，这里通常等于广告活动。",
    "variable": "本次操作改变的字段，例如竞价、预算金额、状态。",
    "before_after": "变量改动前后的值，来自 operate_before / operate_after。",
    "impact": "按同一广告对象、同一变量的连续变化切分稳定区间。效果窗口展示改前区间和改后区间的广告数据；曝光、点击、花费、订单等量类指标按覆盖日报天数折算为日均，CPC、CTR、CVR、ACOS等率类指标按区间总量加权计算。操作当天默认排除。",
    "trend": "广告活动日报趋势图。只跟随操作日期和广告活动模糊搜索两个控件；最多同时显示3个指标，每个指标独立坐标轴。点击图例或曲线可高亮单条曲线，悬停日期可查看当天全量指标。",
    "date_filter": "筛选操作发生日期。报告仍保留90天数据，只是在前端按日期范围查看。",
}

METRIC_LABELS = {
    "cpc": "CPC",
    "impressions": "曝光量",
    "clicks": "点击",
    "ctr": "CTR",
    "cvr": "CVR",
    "acos": "ACOS",
    "cost": "花费",
    "orders": "广告订单",
    "same_orders": "直接订单",
    "indirect_orders": "间接订单",
    "indirect_order_share": "间接订单占比",
}

REPORT_CONFIGS = {
    "sp/campaigns": {
        "report_type": "sp_campaign_reports",
        "id_field": "campaign_id",
        "perf_id_field": "campaign_id",
    },
    "sp/keywords": {
        "report_type": "sp_keyword_reports",
        "id_field": "object_id",
        "perf_id_field": "keyword_id",
        "fallback_name_field": "keyword_text",
    },
}

RAW_METRIC_KEYS = ["impressions", "clicks", "cost", "sales", "orders", "same_orders"]


def as_text(value: Any, fallback: str = "-") -> str:
    if value is None or value == "":
        return fallback
    return str(value)


def esc(value: Any) -> str:
    return html.escape(as_text(value), quote=True)


def help_icon(key_or_text: str) -> str:
    text = FIELD_HELP.get(key_or_text, key_or_text)
    return f'<span class="help" tabindex="0" data-tip="{esc(text)}">❓</span>'


def parse_time(value: Any) -> pd.Timestamp:
    try:
        return pd.to_datetime(value)
    except Exception:
        return pd.NaT


def parse_date_str(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def fmt_date(date: datetime) -> str:
    return date.strftime("%Y-%m-%d")


def add_days(value: str, days: int) -> str:
    return fmt_date(parse_date_str(value) + timedelta(days=days))


def max_date(left: str, right: str) -> str:
    return left if left >= right else right


def min_date(left: str, right: str) -> str:
    return left if left <= right else right


def date_range_list(start: str, end: str) -> list[str]:
    if not start or not end or start > end:
        return []
    cursor = parse_date_str(start)
    end_date = parse_date_str(end)
    dates: list[str] = []
    while cursor <= end_date:
        dates.append(fmt_date(cursor))
        cursor += timedelta(days=1)
    return dates


def to_number(value: Any) -> float:
    try:
        if value in (None, "", "-"):
            return 0.0
        return float(value)
    except Exception:
        return 0.0


def load_export(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    result = payload.get("result", payload)
    if result.get("ok") is not True:
        raise SystemExit(f"MCP export is not ok: {result.get('error')}")
    return payload


def label_object_type(value: Any) -> str:
    raw = as_text(value)
    return OBJECT_LABELS.get(raw, raw)


def label_variable(value: Any) -> str:
    raw = as_text(value, "(empty)")
    label = VARIABLE_LABELS.get(raw, raw)
    return f"{label} ({raw})" if raw not in {"(empty)", label} else label


def label_change_type(value: Any) -> str:
    raw = as_text(value, "(empty)")
    return CHANGE_TYPE_LABELS.get(raw, raw)


def normalize_rows(records: list[dict[str, Any]]) -> tuple[pd.DataFrame, pd.DataFrame]:
    log_rows: list[dict[str, Any]] = []
    change_rows: list[dict[str, Any]] = []

    for index, record in enumerate(records):
        operate_time = parse_time(record.get("operate_time"))
        operate_type = as_text(record.get("operate_type"))
        change_type = as_text(record.get("change_type"), "(empty)")
        log_row = {
            "row_id": index + 1,
            "operate_time": as_text(record.get("operate_time")),
            "operate_date": operate_time.date().isoformat() if not pd.isna(operate_time) else "-",
            "sponsored_type": as_text(record.get("sponsored_type")).upper(),
            "operate_type": operate_type,
            "operate_type_label": label_object_type(operate_type),
            "campaign_name": as_text(record.get("campaign_name") or record.get("object_name")),
            "campaign_id": as_text(record.get("campaign_id")),
            "ad_group_name": as_text(record.get("ad_group_name")),
            "ad_group_id": as_text(record.get("ad_group_id")),
            "object_name": as_text(record.get("object_name")),
            "object_id": as_text(record.get("object_id")),
            "function_name": as_text(record.get("function_name")),
            "change_type": change_type,
            "change_type_label": label_change_type(change_type),
            "user_name": as_text(record.get("user_name") or record.get("user_id")),
            "profile_id": as_text(record.get("profile_id")),
        }
        log_rows.append(log_row)

        changes = record.get("changes") if isinstance(record.get("changes"), list) else []
        if not changes:
            change_rows.append({**log_row, "variable_code": "(empty)", "variable_label": label_variable("(empty)"), "before": "-", "after": "-"})
            continue
        for change in changes:
            if not isinstance(change, dict):
                continue
            code = as_text(change.get("code"), "(empty)")
            change_rows.append({
                **log_row,
                "variable_code": code,
                "variable_label": label_variable(code),
                "before": as_text(change.get("before")),
                "after": as_text(change.get("after")),
            })

    return pd.DataFrame(log_rows), pd.DataFrame(change_rows)


def filter_analysis_variables(log_df: pd.DataFrame, change_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, int]]:
    if change_df.empty:
        return log_df, change_df, {"removed_change_rows": 0, "removed_log_rows": 0}

    before_change_rows = len(change_df)
    before_log_rows = len(log_df)
    filtered_change_df = change_df[~change_df["variable_code"].isin(IGNORED_ANALYSIS_VARIABLE_CODES)].copy()
    kept_row_ids = set(filtered_change_df["row_id"].tolist()) if not filtered_change_df.empty else set()
    filtered_log_df = log_df[log_df["row_id"].isin(kept_row_ids)].copy() if kept_row_ids else log_df.iloc[0:0].copy()
    return filtered_log_df, filtered_change_df, {
        "removed_change_rows": before_change_rows - len(filtered_change_df),
        "removed_log_rows": before_log_rows - len(filtered_log_df),
    }


def top_counts(frame: pd.DataFrame, column: str, limit: int = 10) -> list[tuple[str, int]]:
    if frame.empty or column not in frame.columns:
        return []
    counts = Counter(as_text(value) for value in frame[column].tolist())
    return counts.most_common(limit)


def format_table(items: list[tuple[str, int]], headers: tuple[str, str]) -> str:
    rows = "\n".join(f"<tr><td>{esc(name)}</td><td>{count:,}</td></tr>" for name, count in items)
    return f"<table><thead><tr><th>{esc(headers[0])}</th><th>{esc(headers[1])}</th></tr></thead><tbody>{rows}</tbody></table>"


def raw_metrics(row: dict[str, Any]) -> dict[str, float]:
    orders = to_number(row.get("orders"))
    same_orders = to_number(row.get("same_orders"))
    return {
        "impressions": to_number(row.get("impressions")),
        "clicks": to_number(row.get("clicks")),
        "cost": to_number(row.get("cost") or row.get("spend")),
        "sales": to_number(row.get("sales")),
        "orders": orders,
        "same_orders": same_orders,
    }


def derive_metrics(raw: dict[str, float]) -> dict[str, float]:
    clicks = raw.get("clicks", 0.0)
    impressions = raw.get("impressions", 0.0)
    cost = raw.get("cost", 0.0)
    sales = raw.get("sales", 0.0)
    orders = raw.get("orders", 0.0)
    same_orders = raw.get("same_orders", 0.0)
    indirect_orders = max(orders - same_orders, 0.0)
    return {
        **raw,
        "indirect_orders": indirect_orders,
        "cpc": cost / clicks if clicks else 0.0,
        "ctr": clicks / impressions if impressions else 0.0,
        "cvr": orders / clicks if clicks else 0.0,
        "acos": cost / sales if sales else 0.0,
        "indirect_order_share": indirect_orders / orders if orders else 0.0,
    }


def empty_raw_metrics() -> dict[str, float]:
    return {key: 0.0 for key in RAW_METRIC_KEYS}


def sum_raw_metrics(rows: list[dict[str, Any]]) -> dict[str, float]:
    total = empty_raw_metrics()
    for row in rows:
        metrics = raw_metrics(row)
        for key in RAW_METRIC_KEYS:
            total[key] += metrics[key]
    return total


def build_performance_index(performance_payload: dict[str, Any] | None) -> dict[tuple[str, str, str, str], list[dict[str, Any]]]:
    index: dict[tuple[str, str, str, str], list[dict[str, Any]]] = defaultdict(list)
    if not performance_payload:
        return index

    rows_by_report = performance_payload.get("rows", {})
    if not isinstance(rows_by_report, dict):
        return index

    for config in REPORT_CONFIGS.values():
        report_type = config["report_type"]
        rows = rows_by_report.get(report_type, [])
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            report_date = as_text(row.get("report_date"), "")
            perf_id = as_text(row.get(config["perf_id_field"]), "")
            if report_date and perf_id:
                index[(report_type, report_date, "id", perf_id)].append(row)
            fallback_name_field = config.get("fallback_name_field")
            if fallback_name_field:
                fallback = "|".join([
                    as_text(row.get("campaign_id"), ""),
                    as_text(row.get("ad_group_id"), ""),
                    as_text(row.get(fallback_name_field), "").strip().lower(),
                ])
                if report_date and fallback.strip("|"):
                    index[(report_type, report_date, "fallback", fallback)].append(row)
    return index


def rows_for_date(index: dict[tuple[str, str, str, str], list[dict[str, Any]]], row: pd.Series, report_date: str) -> list[dict[str, Any]]:
    combo = f"{as_text(row.get('sponsored_type')).lower()}/{as_text(row.get('operate_type'))}"
    config = REPORT_CONFIGS.get(combo)
    if not config:
        return []

    report_type = config["report_type"]
    object_id = as_text(row.get(config["id_field"]), "")
    direct = index.get((report_type, report_date, "id", object_id), [])
    if direct:
        return direct

    fallback_name_field = config.get("fallback_name_field")
    if fallback_name_field:
        fallback = "|".join([
            as_text(row.get("campaign_id"), ""),
            as_text(row.get("ad_group_id"), ""),
            as_text(row.get("object_name"), "").strip().lower(),
        ])
        return index.get((report_type, report_date, "fallback", fallback), [])
    return []


def impact_for_row(
    row: pd.Series,
    index: dict[tuple[str, str, str, str], list[dict[str, Any]]],
    before_dates: list[str],
    after_dates: list[str],
    before_range: tuple[str, str] | None,
    after_range: tuple[str, str] | None,
) -> dict[str, Any]:
    combo = f"{as_text(row.get('sponsored_type')).lower()}/{as_text(row.get('operate_type'))}"
    if combo not in REPORT_CONFIGS:
        return {"status": "unsupported", "message": "该对象暂未接入效果层"}

    if not before_dates and not after_dates:
        return {"status": "no_interval", "message": "前后区间为空"}

    before_rows: list[dict[str, Any]] = []
    after_rows: list[dict[str, Any]] = []
    before_covered: set[str] = set()
    after_covered: set[str] = set()

    for item in before_dates:
        matched = rows_for_date(index, row, item)
        if matched:
            before_covered.add(item)
            before_rows.extend(matched)
    for item in after_dates:
        matched = rows_for_date(index, row, item)
        if matched:
            after_covered.add(item)
            after_rows.extend(matched)

    if not before_rows and not after_rows:
        return {"status": "no_match", "message": "日报无匹配数据"}

    before_raw = sum_raw_metrics(before_rows)
    after_raw = sum_raw_metrics(after_rows)
    return {
        "status": "ready" if before_rows and after_rows else "partial",
        "basis": "stable_interval_excluding_change_day",
        "before_range": list(before_range) if before_range else [],
        "after_range": list(after_range) if after_range else [],
        "before_days_total": len(before_dates),
        "after_days_total": len(after_dates),
        "before_days": len(before_covered),
        "after_days": len(after_covered),
        "before_value": as_text(row.get("before")),
        "after_value": as_text(row.get("after")),
        "before": derive_metrics(before_raw),
        "after": derive_metrics(after_raw),
        "message": "前后稳定区间数据完整" if before_rows and after_rows else "前后稳定区间数据不完整",
    }


def change_group_key(row: pd.Series) -> tuple[str, str, str, str, str, str, str]:
    return (
        as_text(row.get("sponsored_type")).lower(),
        as_text(row.get("operate_type")),
        as_text(row.get("profile_id")),
        as_text(row.get("campaign_id")),
        as_text(row.get("ad_group_id")),
        as_text(row.get("object_id")),
        as_text(row.get("variable_code")),
    )


def attach_impact(change_df: pd.DataFrame, performance_payload: dict[str, Any] | None, window_days: int) -> pd.DataFrame:
    if change_df.empty:
        return change_df
    index = build_performance_index(performance_payload)
    enriched = change_df.copy()
    impacts: list[dict[str, Any]] = [{"status": "unsupported", "message": "该对象暂未接入效果层"} for _ in range(len(enriched))]
    performance_range = (performance_payload or {}).get("date_range", {}) if isinstance(performance_payload, dict) else {}
    performance_start = as_text(performance_range.get("start_date"), "")
    performance_end = as_text(performance_range.get("end_date"), "")

    if not performance_start or not performance_end:
        for pos, (_, row) in enumerate(enriched.iterrows()):
            impacts[pos] = impact_for_row(row, index, [], [], None, None)
    else:
        sortable = enriched.copy()
        sortable["_pos"] = range(len(sortable))
        sortable["_group_key"] = sortable.apply(change_group_key, axis=1)
        sortable["_operate_sort"] = pd.to_datetime(sortable["operate_time"], errors="coerce")

        for _, group in sortable.sort_values(["_group_key", "_operate_sort", "_pos"]).groupby("_group_key", sort=False):
            group_rows = list(group.iterrows())
            for group_index, (_, row) in enumerate(group_rows):
                pos = int(row["_pos"])
                combo = f"{as_text(row.get('sponsored_type')).lower()}/{as_text(row.get('operate_type'))}"
                if combo not in REPORT_CONFIGS:
                    impacts[pos] = {"status": "unsupported", "message": "该对象暂未接入效果层"}
                    continue

                operate_date = as_text(row.get("operate_date"), "")
                if operate_date == "-":
                    impacts[pos] = {"status": "no_date", "message": "缺少操作日期"}
                    continue

                prev_date = as_text(group_rows[group_index - 1][1].get("operate_date"), "") if group_index > 0 else ""
                next_date = as_text(group_rows[group_index + 1][1].get("operate_date"), "") if group_index + 1 < len(group_rows) else ""
                before_start = max_date(performance_start, add_days(prev_date, 1)) if prev_date and prev_date != "-" else performance_start
                before_end = min_date(performance_end, add_days(operate_date, -1))
                after_start = max_date(performance_start, add_days(operate_date, 1))
                after_end_candidate = add_days(next_date, -1) if next_date and next_date != "-" else performance_end
                after_end = min_date(performance_end, after_end_candidate)

                before_dates = date_range_list(before_start, before_end)
                after_dates = date_range_list(after_start, after_end)
                before_range = (before_start, before_end) if before_dates else None
                after_range = (after_start, after_end) if after_dates else None
                impacts[pos] = impact_for_row(row, index, before_dates, after_dates, before_range, after_range)

    enriched["impact"] = impacts
    enriched["impact_status"] = [item["status"] for item in impacts]
    return enriched


def load_performance(path: Path | None) -> dict[str, Any] | None:
    if not path:
        return None
    if not path.exists():
        raise SystemExit(f"Performance context not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def build_html(
    output: Path,
    title: str,
    store_label: str,
    payload: dict[str, Any],
    performance_payload: dict[str, Any] | None,
    log_df: pd.DataFrame,
    change_df: pd.DataFrame,
    filter_summary: dict[str, int],
    window_days: int,
) -> None:
    result = payload.get("result", payload)
    args = payload.get("arguments", {})
    exported_at = payload.get("exported_at", datetime.now(timezone.utc).isoformat())

    total_logs = len(log_df)
    total_changes = int(len(change_df[change_df["variable_code"] != "(empty)"])) if not change_df.empty else 0
    empty_changes = int(len(log_df) - len(change_df[change_df["variable_code"] != "(empty)"]["row_id"].drop_duplicates())) if not change_df.empty else total_logs
    campaigns = int(log_df["campaign_name"].nunique()) if not log_df.empty else 0
    users = int(log_df["user_name"].nunique()) if not log_df.empty else 0
    start_date = args.get("date_range", {}).get("start_date", "-")
    end_date = args.get("date_range", {}).get("end_date", "-")
    impact_ready = int(change_df["impact_status"].isin(["ready", "partial"]).sum()) if "impact_status" in change_df else 0

    variables = top_counts(change_df[change_df["variable_code"] != "(empty)"], "variable_label", 15) if not change_df.empty else []
    campaigns_top = top_counts(log_df, "campaign_name", 12)
    users_top = top_counts(log_df, "user_name", 8)

    detail_records = change_df.fillna("-").to_dict(orient="records") if not change_df.empty else []
    detail_json = json.dumps(detail_records, ensure_ascii=False, separators=(",", ":"))
    safe_detail_json = detail_json.replace("</", "<\\/")
    performance_json = json.dumps(performance_payload or {"rows": {}}, ensure_ascii=False, separators=(",", ":"))
    safe_performance_json = performance_json.replace("</", "<\\/")
    performance_note = "已接入 SP 广告活动与 SP 关键词日报" if performance_payload else "未提供效果数据上下文，仅显示操作日志"

    html_body = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="data:," />
  <title>{esc(title)}</title>
  <style>
    :root {{
      --bg: #f5f7fb;
      --panel: #ffffff;
      --ink: #172033;
      --muted: #5b677a;
      --line: #d7e0ee;
      --blue: #1f6feb;
      --green: #0f766e;
      --amber: #b45309;
      --red: #be123c;
      --soft-blue: #eaf2ff;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: var(--bg); color: var(--ink); font-family: Arial, "Microsoft YaHei", sans-serif; letter-spacing: 0; }}
    header {{ background: var(--panel); border-bottom: 1px solid var(--line); padding: 24px 32px 18px; }}
    main {{ width: 100%; padding: 24px 32px 40px; }}
    h1 {{ margin: 0 0 8px; font-size: 26px; line-height: 1.2; }}
    h2 {{ margin: 0; font-size: 18px; line-height: 1.35; }}
    p {{ color: var(--muted); line-height: 1.6; }}
    .meta {{ color: var(--muted); font-size: 13px; display: flex; gap: 16px; flex-wrap: wrap; }}
    .grid {{ display: grid; gap: 16px; }}
    .cards {{ grid-template-columns: repeat(6, minmax(140px, 1fr)); margin-top: 20px; }}
    .card, section {{ background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }}
    .card {{ padding: 16px; }}
    .metric {{ font-size: 28px; font-weight: 700; margin-top: 8px; }}
    .label {{ color: var(--muted); font-size: 13px; }}
    section {{ padding: 18px; margin-top: 16px; }}
    .two {{ grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }}
    .chart {{ width: 100%; display: block; border: 1px solid var(--line); border-radius: 8px; background: #fff; }}
    .summary-list {{ margin: 0; padding-left: 18px; color: var(--ink); line-height: 1.7; }}
    .trend-section {{ padding-bottom: 14px; }}
    .trend-head {{ display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 12px; }}
    .axis-summary {{ color: var(--muted); font-size: 12px; line-height: 1.5; margin-bottom: 10px; }}
    .trend-controls {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }}
    .metric-toggle {{ display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 1px solid #c7d2e3; border-radius: 999px; background: #fff; font-size: 12px; color: var(--ink); cursor: pointer; }}
    .metric-toggle input {{ width: 14px; height: 14px; padding: 0; }}
    .axis-tag {{ display: inline-block; padding: 1px 5px; border-radius: 999px; font-size: 11px; background: #eef4ff; color: #0b56c5; }}
    .axis-tag.right {{ background: #fff7ed; color: #b45309; }}
    .axis-tag.third {{ background: #fef3c7; color: #92400e; }}
    .axis-tag.auto {{ background: #f1f5f9; color: #64748b; }}
    .trend-frame {{ position: relative; border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 12px; overflow: hidden; }}
    .trend-svg {{ width: 100%; height: 420px; display: block; }}
    .trend-legend {{ display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 10px; font-size: 12px; color: var(--muted); }}
    .legend-item {{ display: inline-flex; align-items: center; gap: 6px; }}
    .legend-item.interactive {{ cursor: pointer; border-radius: 999px; padding: 2px 6px; transition: background .15s ease, opacity .15s ease; }}
    .legend-item.interactive:hover, .legend-item.interactive.active {{ background: #eef4ff; color: var(--ink); }}
    .legend-item.dimmed {{ opacity: .35; }}
    .legend-swatch {{ width: 18px; height: 3px; border-radius: 999px; display: inline-block; }}
    .legend-dot {{ width: 9px; height: 9px; border-radius: 999px; display: inline-block; background: var(--red); box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(190,18,60,.2); }}
    .operation-dot {{ fill: var(--red); stroke: #fff; stroke-width: 2; }}
    .operation-line {{ stroke: rgba(190,18,60,.35); stroke-width: 1; stroke-dasharray: 4 4; }}
    .trend-tooltip {{ position: absolute; min-width: 240px; max-width: 340px; padding: 10px 12px; border-radius: 8px; background: rgba(15,23,42,.96); color: #fff; font-size: 12px; line-height: 1.45; pointer-events: none; z-index: 20; box-shadow: 0 12px 30px rgba(15,23,42,.22); }}
    .trend-tooltip-title {{ font-weight: 700; margin-bottom: 6px; }}
    .trend-tooltip-section {{ margin-top: 8px; }}
    .trend-tooltip-section + .trend-tooltip-section {{ margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(203,213,225,.28); }}
    .trend-tooltip-section-title {{ color: #f8fafc; font-weight: 700; margin-bottom: 5px; }}
    .trend-tooltip-grid {{ display: grid; grid-template-columns: 1fr auto; gap: 3px 12px; }}
    .trend-tooltip-label {{ color: #cbd5e1; }}
    .trend-tooltip-value {{ color: #fff; font-family: Consolas, monospace; text-align: right; }}
    .filters {{ display: grid; grid-template-columns: repeat(7, minmax(130px, 1fr)); gap: 12px; align-items: end; }}
    label {{ display: block; font-weight: 700; font-size: 12px; margin-bottom: 6px; }}
    input, select {{ width: 100%; height: 38px; border: 1px solid #c7d2e3; border-radius: 6px; padding: 0 10px; font-size: 14px; background: #fff; }}
    button {{ height: 38px; border: 1px solid #b9cdf5; background: var(--soft-blue); color: #0b56c5; border-radius: 6px; font-weight: 700; cursor: pointer; }}
    button.primary {{ background: var(--blue); color: #fff; border-color: var(--blue); }}
    .help {{ display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin-left: 4px; border-radius: 999px; background: #eef4ff; color: #0b56c5; font-size: 10px; cursor: help; position: relative; vertical-align: middle; }}
    .help:hover::after, .help:focus::after {{ content: attr(data-tip); position: absolute; left: 50%; bottom: 130%; transform: translateX(-50%); min-width: 220px; max-width: 320px; padding: 8px 10px; border-radius: 6px; background: #111827; color: #fff; font-size: 12px; line-height: 1.45; white-space: normal; z-index: 50; box-shadow: 0 8px 24px rgba(15,23,42,.18); }}
    .date-wrap, .combo-wrap {{ position: relative; }}
    .date-trigger {{ width: 100%; text-align: left; padding: 0 10px; background: #fff; color: var(--ink); border: 1px solid #c7d2e3; font-weight: 400; }}
    .calendar-popover {{ position: absolute; top: calc(100% + 4px); left: 0; width: 760px; max-width: calc(100vw - 64px); background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 0; z-index: 40; box-shadow: 0 18px 45px rgba(15,23,42,.18); overflow: hidden; }}
    .calendar-layout {{ display: grid; grid-template-columns: 118px 1fr; }}
    .quick-ranges {{ border-right: 1px solid var(--line); padding: 10px 0; background: #fbfdff; }}
    .quick-range {{ display: block; width: 100%; height: 32px; border: 0; border-radius: 0; background: transparent; color: var(--ink); text-align: left; padding: 0 12px; font-weight: 400; }}
    .quick-range:hover {{ background: #eef4ff; color: #0b56c5; }}
    .calendar-main {{ padding: 12px; }}
    .calendar-head {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }}
    .nav-group {{ display: flex; gap: 6px; }}
    .nav-group button {{ width: 30px; padding: 0; }}
    .months {{ display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }}
    .month-title {{ text-align: center; font-weight: 700; margin-bottom: 8px; }}
    .calendar-grid {{ display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }}
    .day-name, .day {{ text-align: center; font-size: 12px; padding: 6px 0; border-radius: 5px; }}
    .day-name {{ color: var(--muted); font-weight: 700; }}
    .day {{ border: 1px solid transparent; background: #fff; color: var(--ink); height: 30px; }}
    .day:hover {{ border-color: #9bc1ff; }}
    .day.selected, .day.in-range {{ background: var(--blue); color: #fff; }}
    .calendar-actions {{ display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }}
    .combo-list {{ position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 280px; overflow: auto; background: #fff; border: 1px solid var(--line); border-radius: 8px; z-index: 35; box-shadow: 0 14px 36px rgba(15,23,42,.14); }}
    .combo-option {{ display: block; width: 100%; min-height: 34px; height: auto; border: 0; border-radius: 0; background: #fff; color: var(--ink); text-align: left; padding: 8px 10px; font-weight: 400; line-height: 1.35; }}
    .combo-option:hover, .combo-option.active {{ background: #eef4ff; color: #0b56c5; }}
    .combo-empty {{ padding: 12px; color: var(--muted); font-size: 13px; }}
    .impact-window-cell {{ min-width: 560px; max-width: 720px; }}
    .impact-window {{ display: grid; gap: 8px; font-family: Arial, "Microsoft YaHei", sans-serif; white-space: normal; }}
    .impact-period {{ border: 1px solid var(--line); border-radius: 6px; background: #fbfdff; padding: 8px 10px; }}
    .impact-period-title {{ font-weight: 700; font-size: 12px; margin-bottom: 6px; color: var(--ink); }}
    .impact-metrics {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 12px; }}
    .impact-metric {{ display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--muted); }}
    .impact-value {{ display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; color: var(--ink); font-family: Consolas, monospace; }}
    .impact-arrow {{ display: inline-block; width: 12px; text-align: center; font-weight: 700; }}
    .impact-arrow.good {{ color: var(--green); }}
    .impact-arrow.bad {{ color: var(--red); }}
    .impact-arrow.flat {{ color: var(--muted); }}
    .delta-up {{ color: var(--green); font-weight: 700; }}
    .delta-down {{ color: var(--red); font-weight: 700; }}
    .delta-flat {{ color: var(--muted); font-weight: 700; }}
    .table-wrap {{ overflow: auto; border: 1px solid var(--line); border-radius: 8px; background: #fff; }}
    table {{ border-collapse: collapse; width: 100%; font-size: 13px; }}
    th, td {{ border-bottom: 1px solid #e4ebf5; padding: 10px 12px; text-align: left; vertical-align: top; }}
    th {{ position: sticky; top: 0; background: #f8fafc; z-index: 1; font-size: 12px; white-space: nowrap; }}
    td.mono {{ font-family: Consolas, monospace; white-space: pre-wrap; word-break: break-word; max-width: 320px; }}
    .badge {{ display: inline-block; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 700; }}
    .badge-sp {{ background: #eaf2ff; color: #0b56c5; }}
    .badge-sb {{ background: #ecfdf5; color: #047857; }}
    .badge-sd {{ background: #fff7ed; color: #b45309; }}
    .note {{ font-size: 13px; color: var(--muted); }}
    .mini-tables {{ grid-template-columns: repeat(3, minmax(0, 1fr)); }}
    .hidden {{ display: none; }}
    @media (max-width: 1200px) {{
      .cards {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      .two, .mini-tables {{ grid-template-columns: 1fr; }}
      .filters, .impact-metrics {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      main {{ padding: 18px; }}
    }}
  </style>
</head>
<body>
  <header data-contract-section="title">
    <h1>{esc(title)}</h1>
    <div class="meta">
      <span>{esc(store_label)}</span>
      <span>{esc(start_date)} 至 {esc(end_date)}</span>
      <span>导出时间：{esc(exported_at)}</span>
      <span>数据来源：{esc(payload.get("endpoint", "LingXing MCP"))}</span>
    </div>
  </header>
  <main>
    <div class="grid cards">
      <div class="card"><div class="label">操作日志</div><div class="metric">{total_logs:,}</div></div>
      <div class="card"><div class="label">变量级变更</div><div class="metric">{total_changes:,}</div></div>
      <div class="card"><div class="label">可做效果对比</div><div class="metric">{impact_ready:,}</div></div>
      <div class="card"><div class="label">涉及广告活动</div><div class="metric">{campaigns:,}</div></div>
      <div class="card"><div class="label">操作人</div><div class="metric">{users:,}</div></div>
      <div class="card"><div class="label">缺少改前/改后</div><div class="metric">{empty_changes:,}</div></div>
    </div>

    <section data-contract-section="executive-summary">
      <h2>摘要</h2>
      <ul class="summary-list">
        <li>近90天共抓取 {total_logs:,} 条广告操作日志，展开为 {total_changes:,} 条变量级改动。</li>
        <li>主要调整变量集中在 {esc(", ".join(name for name, _ in variables[:4]) or "-")}，可优先关注预算、状态、竞价和命名变动。</li>
        <li>效果层状态：{esc(performance_note)}；当前可对比 {impact_ready:,} 条变量级记录。</li>
        <li>操作最集中的广告活动是 {esc(campaigns_top[0][0] if campaigns_top else "-")}，共 {campaigns_top[0][1] if campaigns_top else 0:,} 条日志。</li>
      </ul>
    </section>

    <section class="trend-section" data-contract-section="campaign-trend">
      <div class="trend-head">
        <div>
          <h2>广告活动趋势 {help_icon("trend")}</h2>
          <p class="note">趋势图跟随“操作日期”和“广告活动模糊搜索”两个控件；红色标记表示该日期发生过广告操作。</p>
        </div>
      </div>
      <div class="axis-summary" id="axisSummary"></div>
      <div class="trend-controls" id="trendMetricControls"></div>
      <div class="trend-frame">
        <svg class="trend-svg" id="campaignTrendChart" role="img" aria-label="广告活动趋势图"></svg>
        <div class="trend-tooltip hidden" id="trendTooltip"></div>
      </div>
      <div class="trend-legend" id="trendLegend"></div>
      <p class="note" id="trendNote"></p>
    </section>

    <section>
      <h2>筛选明细</h2>
      <div class="filters">
        <div class="date-wrap">
          <label>操作日期 {help_icon("date_filter")}</label>
          <button class="date-trigger" id="dateRangeTrigger">全部日期</button>
          <div class="calendar-popover hidden" id="datePicker">
            <div class="calendar-layout">
              <div class="quick-ranges" id="quickRanges"></div>
              <div class="calendar-main">
                <div class="calendar-head">
                  <div class="nav-group">
                    <button id="prevYear" type="button">«</button>
                    <button id="prevMonth" type="button">‹</button>
                  </div>
                  <strong id="datePickerLabel">日期范围</strong>
                  <div class="nav-group">
                    <button id="nextMonth" type="button">›</button>
                    <button id="nextYear" type="button">»</button>
                  </div>
                </div>
                <div class="months" id="calendarMonths"></div>
                <div class="calendar-actions">
                  <button id="clearDateRange" type="button">清空日期</button>
                  <button class="primary" id="applyDateRange" type="button">应用日期</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div><label for="filterAdType">广告类型 {help_icon("ad_type")}</label><select id="filterAdType"><option value="">全部</option></select></div>
        <div><label for="filterObjectType">对象类型 {help_icon("object_type")}</label><select id="filterObjectType"><option value="">全部</option></select></div>
        <div class="combo-wrap"><label for="filterCampaign">广告活动模糊搜索 {help_icon("campaign")}</label><input id="filterCampaign" autocomplete="off" placeholder="输入或选择广告活动" /><div id="campaignOptions" class="combo-list hidden"></div></div>
        <div><label for="filterVariable">变量 {help_icon("variable")}</label><select id="filterVariable"><option value="">全部</option></select></div>
        <div><label for="filterUser">用户</label><select id="filterUser"><option value="">全部</option></select></div>
        <div><label for="filterChangeType">操作类型</label><select id="filterChangeType"><option value="">全部</option></select></div>
        <button class="primary" id="applyFilters">筛选</button>
        <button id="resetFilters">清空</button>
      </div>
      <p class="note" id="filteredCount"></p>
    </section>

    <section>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>时间 {help_icon("time")}</th>
              <th>广告类型 {help_icon("ad_type")}</th>
              <th>对象类型 {help_icon("object_type")}</th>
              <th>广告活动 {help_icon("campaign")}</th>
              <th>对象 {help_icon("object")}</th>
              <th>变量 {help_icon("variable")}</th>
              <th>改前 {help_icon("before_after")}</th>
              <th>改后 {help_icon("before_after")}</th>
              <th>效果窗口 {help_icon("impact")}</th>
              <th>用户</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="detailBody"></tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>重点排行</h2>
      <div class="grid mini-tables">
        <div>{format_table(variables[:10], ("变量", "变更数"))}</div>
        <div>{format_table(campaigns_top[:10], ("广告活动", "日志数"))}</div>
        <div>{format_table(users_top[:10], ("用户", "日志数"))}</div>
      </div>
    </section>

    <section data-contract-section="caveats">
      <h2>口径说明</h2>
      <p>本报告来自只读 MCP 工具 `lingxing_ad_operation_log_scan`，范围为 {esc(json.dumps(args.get("scope", {}), ensure_ascii=False))}。效果层使用广告日报按同一广告对象、同一变量的连续变化切分稳定区间，比较本次变化前后的两段数据，操作当天默认排除。</p>
      <p>分析口径已默认过滤“无变量明细”和“是否预算内（IN_BUDGET）”，这类记录通常表示暂停/预算状态同步，对评估广告操作收益帮助有限；本次共过滤 {filter_summary.get("removed_change_rows", 0):,} 条变量级记录、{filter_summary.get("removed_log_rows", 0):,} 条操作日志。</p>
      <p>v0.1.2 效果层优先覆盖 SP 广告活动和 SP 关键词，按 `campaign_id`、`keyword_id/object_id` 精确关联；没有日报匹配时显示“日报无匹配数据”。如果相邻两次变化发生在连续日期，可能没有可比较的前置或后置区间。</p>
    </section>
  </main>
  <script id="audit-data" type="application/json">{safe_detail_json}</script>
  <script id="performance-data" type="application/json">{safe_performance_json}</script>
  <script>
    const rows = JSON.parse(document.getElementById('audit-data').textContent);
    const performancePayload = JSON.parse(document.getElementById('performance-data').textContent || '{{"rows":{{}}}}');
    const body = document.getElementById('detailBody');
    const countLabel = document.getElementById('filteredCount');
    const trendSvg = document.getElementById('campaignTrendChart');
    const trendTooltip = document.getElementById('trendTooltip');
    const trendLegend = document.getElementById('trendLegend');
    const trendNote = document.getElementById('trendNote');
    const trendMetricControls = document.getElementById('trendMetricControls');
    const axisSummary = document.getElementById('axisSummary');
    const metricLabels = {json.dumps(METRIC_LABELS, ensure_ascii=False)};
    const rateMetrics = new Set(['ctr', 'cvr', 'acos', 'indirect_order_share']);
    const moneyMetrics = new Set(['cpc', 'cost']);
    const dailyAverageMetrics = new Set(['impressions', 'clicks', 'cost', 'orders', 'same_orders', 'indirect_orders']);
    const effectMetricOrder = ['cpc', 'impressions', 'clicks', 'ctr', 'cvr', 'acos', 'cost', 'orders', 'same_orders', 'indirect_orders', 'indirect_order_share'];
    const lowerIsBetterMetrics = new Set(['cpc', 'acos', 'cost']);
    const higherIsBetterMetrics = new Set(['impressions', 'clicks', 'ctr', 'cvr', 'orders', 'same_orders', 'indirect_orders', 'indirect_order_share']);
    const trendMetricConfig = {{
      impressions: {{ label: '曝光量', family: 'count', unit: 'count', color: '#2563eb', selected: false }},
      clicks: {{ label: '点击', family: 'count', unit: 'count', color: '#0891b2', selected: false }},
      cost: {{ label: '花费', family: 'money_total', unit: 'currency', color: '#dc2626', selected: true }},
      orders: {{ label: '广告订单', family: 'count', unit: 'count', color: '#16a34a', selected: true }},
      same_orders: {{ label: '直接订单', family: 'count', unit: 'count', color: '#65a30d', selected: false }},
      indirect_orders: {{ label: '间接订单', family: 'count', unit: 'count', color: '#0f766e', selected: false }},
      cpc: {{ label: 'CPC', family: 'unit_cost', unit: 'currency', color: '#7c3aed', selected: false }},
      ctr: {{ label: 'CTR', family: 'rate_small', unit: 'rate', color: '#ea580c', selected: false }},
      cvr: {{ label: 'CVR', family: 'rate', unit: 'rate', color: '#d97706', selected: false }},
      acos: {{ label: 'ACOS', family: 'rate', unit: 'rate', color: '#be123c', selected: true }},
      indirect_order_share: {{ label: '间接订单占比', family: 'rate', unit: 'rate', color: '#9333ea', selected: false }}
    }};
    const trendMetricOrder = ['cost', 'orders', 'acos', 'impressions', 'clicks', 'cpc', 'ctr', 'cvr', 'same_orders', 'indirect_orders', 'indirect_order_share'];
    const MAX_TREND_METRICS = 3;
    let trendMetricSelection = trendMetricOrder.filter(key => trendMetricConfig[key]?.selected).slice(0, MAX_TREND_METRICS);
    let trendMetricNotice = '';
    let highlightedTrendMetric = '';
    const fields = {{
      ad: document.getElementById('filterAdType'),
      object: document.getElementById('filterObjectType'),
      campaign: document.getElementById('filterCampaign'),
      variable: document.getElementById('filterVariable'),
      user: document.getElementById('filterUser'),
      change: document.getElementById('filterChangeType')
    }};
    const reportStart = '{esc(start_date)}';
    const reportEnd = '{esc(end_date)}';
    let selectedStart = '';
    let selectedEnd = '';
    let calendarMonth = parseLocalDate(reportStart);
    const baseDate = parseLocalDate(reportEnd);
    const campaignOptionsNode = document.getElementById('campaignOptions');
    function uniq(key) {{
      return [...new Map(rows.filter(r => r[key] && r[key] !== '-').map(r => [r[key], r])).values()]
        .sort((a, b) => String(a[key]).localeCompare(String(b[key])));
    }}
    function fillSelect(select, items, valueKey, labelKey) {{
      items.forEach(item => {{
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[labelKey] || item[valueKey];
        select.appendChild(option);
      }});
    }}
    fillSelect(fields.ad, uniq('sponsored_type'), 'sponsored_type', 'sponsored_type');
    fillSelect(fields.object, uniq('operate_type'), 'operate_type', 'operate_type_label');
    fillSelect(fields.variable, uniq('variable_code'), 'variable_code', 'variable_label');
    fillSelect(fields.user, uniq('user_name'), 'user_name', 'user_name');
    fillSelect(fields.change, uniq('change_type'), 'change_type', 'change_type_label');
    const campaignChoices = [...new Set(rows.map(r => r.campaign_name).filter(v => v && v !== '-'))].sort((a, b) => a.localeCompare(b));
    function cell(value, cls = '') {{
      const td = document.createElement('td');
      td.className = cls;
      td.textContent = value || '-';
      return td;
    }}
    function parseLocalDate(key) {{
      const [year, month, day] = key.split('-').map(Number);
      return new Date(year, month - 1, day);
    }}
    function dateKey(date) {{
      return `${{date.getFullYear()}}-${{String(date.getMonth() + 1).padStart(2, '0')}}-${{String(date.getDate()).padStart(2, '0')}}`;
    }}
    function monthName(date) {{
      return `${{date.getFullYear()}}-${{String(date.getMonth() + 1).padStart(2, '0')}}`;
    }}
    function addDays(date, days) {{
      const next = new Date(date);
      next.setDate(next.getDate() + days);
      return next;
    }}
    function firstDayOfMonth(date) {{
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }}
    function lastDayOfMonth(date) {{
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }}
    function clampDateKey(key) {{
      if (key < reportStart) return reportStart;
      if (key > reportEnd) return reportEnd;
      return key;
    }}
    function setRange(start, end) {{
      selectedStart = clampDateKey(start);
      selectedEnd = clampDateKey(end);
      if (selectedEnd < selectedStart) [selectedStart, selectedEnd] = [selectedEnd, selectedStart];
      calendarMonth = parseLocalDate(selectedStart);
      updateDateTrigger();
      renderCalendar();
      render();
    }}
    const quickRanges = [
      ['今天', () => [dateKey(baseDate), dateKey(baseDate)]],
      ['昨天', () => [dateKey(addDays(baseDate, -1)), dateKey(addDays(baseDate, -1))]],
      ['前7天', () => [dateKey(addDays(baseDate, -7)), dateKey(addDays(baseDate, -1))]],
      ['近7天', () => [dateKey(addDays(baseDate, -6)), dateKey(baseDate)]],
      ['前30天', () => [dateKey(addDays(baseDate, -30)), dateKey(addDays(baseDate, -1))]],
      ['近30天', () => [dateKey(addDays(baseDate, -29)), dateKey(baseDate)]],
      ['本月', () => [dateKey(firstDayOfMonth(baseDate)), dateKey(baseDate)]],
      ['上月', () => {{
        const prev = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
        return [dateKey(firstDayOfMonth(prev)), dateKey(lastDayOfMonth(prev))];
      }}],
    ];
    function renderQuickRanges() {{
      const node = document.getElementById('quickRanges');
      node.replaceChildren();
      for (const [label, getRange] of quickRanges) {{
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-range';
        button.textContent = label;
        button.addEventListener('click', () => {{
          const [start, end] = getRange();
          setRange(start, end);
          document.getElementById('datePicker').classList.add('hidden');
        }});
        node.appendChild(button);
      }}
    }}
    function renderCalendar() {{
      const months = document.getElementById('calendarMonths');
      months.replaceChildren();
      document.getElementById('datePickerLabel').textContent = selectedStart && selectedEnd ? `${{selectedStart}} 至 ${{selectedEnd}}` : '选择日期范围';
      for (let m = 0; m < 2; m++) {{
        const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + m, 1);
        const wrap = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'month-title';
        title.textContent = monthName(current);
        wrap.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        ['日','一','二','三','四','五','六'].forEach(d => {{
          const item = document.createElement('div');
          item.className = 'day-name';
          item.textContent = d;
          grid.appendChild(item);
        }});
        for (let i = 0; i < current.getDay(); i++) grid.appendChild(document.createElement('div'));
        const last = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        for (let day = 1; day <= last; day++) {{
          const d = new Date(current.getFullYear(), current.getMonth(), day);
          const key = dateKey(d);
          const btn = document.createElement('button');
          btn.className = 'day';
          btn.type = 'button';
          btn.textContent = day;
          btn.dataset.date = key;
          btn.title = key;
          if (key === selectedStart || key === selectedEnd) btn.classList.add('selected');
          if (selectedStart && selectedEnd && key > selectedStart && key < selectedEnd) btn.classList.add('in-range');
          btn.addEventListener('click', () => {{
            let completed = false;
            if (!selectedStart || (selectedStart && selectedEnd)) {{
              selectedStart = key; selectedEnd = '';
            }} else if (key < selectedStart) {{
              selectedEnd = selectedStart; selectedStart = key;
              completed = true;
            }} else {{
              selectedEnd = key;
              completed = true;
            }}
            updateDateTrigger();
            renderCalendar();
            if (completed) {{
              document.getElementById('datePicker').classList.add('hidden');
              render();
            }}
          }});
          grid.appendChild(btn);
        }}
        wrap.appendChild(grid);
        months.appendChild(wrap);
      }}
    }}
    function updateDateTrigger() {{
      const trigger = document.getElementById('dateRangeTrigger');
      trigger.textContent = selectedStart && selectedEnd ? `${{selectedStart}} - ${{selectedEnd}}` : selectedStart ? `${{selectedStart}} 起` : '全部日期';
    }}
    function renderCampaignOptions() {{
      const query = fields.campaign.value.trim().toLowerCase();
      const options = campaignChoices
        .filter(name => !query || name.toLowerCase().includes(query))
        .slice(0, 80);
      campaignOptionsNode.replaceChildren();
      if (!options.length) {{
        const empty = document.createElement('div');
        empty.className = 'combo-empty';
        empty.textContent = '没有匹配的广告活动';
        campaignOptionsNode.appendChild(empty);
      }} else {{
        for (const name of options) {{
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'combo-option';
          button.textContent = name;
          button.addEventListener('click', () => {{
            fields.campaign.value = name;
            campaignOptionsNode.classList.add('hidden');
            render();
          }});
          campaignOptionsNode.appendChild(button);
        }}
      }}
      campaignOptionsNode.classList.remove('hidden');
    }}
    function matches(row) {{
      const q = fields.campaign.value.trim().toLowerCase();
      if (selectedStart && selectedEnd && row.operate_date < selectedStart) return false;
      if (selectedStart && selectedEnd && row.operate_date > selectedEnd) return false;
      if (fields.ad.value && row.sponsored_type !== fields.ad.value) return false;
      if (fields.object.value && row.operate_type !== fields.object.value) return false;
      if (fields.variable.value && row.variable_code !== fields.variable.value) return false;
      if (fields.user.value && row.user_name !== fields.user.value) return false;
      if (fields.change.value && row.change_type !== fields.change.value) return false;
      if (q) {{
        const haystack = [row.campaign_name, row.ad_group_name, row.object_name].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }}
      return true;
    }}
    function emptyRaw() {{
      return {{ impressions: 0, clicks: 0, cost: 0, sales: 0, orders: 0, same_orders: 0 }};
    }}
    function addRaw(target, source) {{
      for (const key of Object.keys(target)) target[key] += Number(source?.[key] || 0);
    }}
    function derive(raw) {{
      const indirect = Math.max(raw.orders - raw.same_orders, 0);
      return {{
        ...raw,
        indirect_orders: indirect,
        cpc: raw.clicks ? raw.cost / raw.clicks : 0,
        ctr: raw.impressions ? raw.clicks / raw.impressions : 0,
        cvr: raw.clicks ? raw.orders / raw.clicks : 0,
        acos: raw.sales ? raw.cost / raw.sales : 0,
        indirect_order_share: raw.orders ? indirect / raw.orders : 0
      }};
    }}
    function formatMetric(key, value) {{
      const n = Number(value || 0);
      if (rateMetrics.has(key)) return `${{(n * 100).toFixed(2)}}%`;
      if (moneyMetrics.has(key)) return `$${{n.toFixed(2)}}`;
      return n.toLocaleString(undefined, {{ maximumFractionDigits: 2 }});
    }}
    function deltaClass(delta, key) {{
      if (Math.abs(delta) < 0.000001) return 'delta-flat';
      const lowerIsBetter = new Set(['cpc', 'acos', 'cost']);
      const positive = lowerIsBetter.has(key) ? delta < 0 : delta > 0;
      return positive ? 'delta-up' : 'delta-down';
    }}
    function metricDisplayLabel(key) {{
      const label = metricLabels[key] || key;
      return dailyAverageMetrics.has(key) ? `${{label}}/日` : label;
    }}
    function periodMetrics(impact, side) {{
      const source = impact[side] || {{}};
      const days = Number(impact[`${{side}}_days`] || 0);
      const result = {{}};
      for (const key of effectMetricOrder) {{
        const raw = Number(source[key] || 0);
        result[key] = dailyAverageMetrics.has(key) ? (days ? raw / days : 0) : raw;
      }}
      return result;
    }}
    function effectDirection(key, beforeValue, afterValue) {{
      const delta = Number(afterValue || 0) - Number(beforeValue || 0);
      if (Math.abs(delta) < 0.000001) return {{ symbol: '→', className: 'flat', label: '持平' }};
      const improved = lowerIsBetterMetrics.has(key) ? delta < 0 : delta > 0;
      return {{
        symbol: delta > 0 ? '↑' : '↓',
        className: improved ? 'good' : 'bad',
        label: improved ? '变好' : '变差'
      }};
    }}
    function renderTrendControls() {{
      trendMetricControls.replaceChildren();
      for (const key of trendMetricOrder) {{
        const config = trendMetricConfig[key];
        const label = document.createElement('label');
        label.className = 'metric-toggle';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = key;
        input.checked = trendMetricSelection.includes(key);
        input.addEventListener('change', () => toggleTrendMetric(key));
        const axis = document.createElement('span');
        axis.className = 'axis-tag auto';
        axis.dataset.axisFor = key;
        axis.textContent = '待选';
        const text = document.createElement('span');
        text.textContent = config.label;
        label.appendChild(input);
        label.appendChild(text);
        label.appendChild(axis);
        trendMetricControls.appendChild(label);
      }}
    }}
    function toggleTrendMetric(key) {{
      const exists = trendMetricSelection.includes(key);
      trendMetricNotice = '';
      if (exists) {{
        if (trendMetricSelection.length === 1) {{
          trendMetricNotice = '至少保留一个趋势指标。';
        }} else {{
          trendMetricSelection = trendMetricSelection.filter(item => item !== key);
        }}
      }} else {{
        trendMetricSelection = [...trendMetricSelection, key];
        if (trendMetricSelection.length > MAX_TREND_METRICS) {{
          const removed = trendMetricSelection.shift();
          trendMetricNotice = `最多同时显示 ${{MAX_TREND_METRICS}} 个指标，已自动移除“${{trendMetricConfig[removed]?.label || removed}}”。`;
        }}
      }}
      renderTrend();
    }}
    function selectedTrendMetrics() {{
      return [...trendMetricSelection];
    }}
    function effectiveDateRange() {{
      return selectedStart && selectedEnd ? [selectedStart, selectedEnd] : [reportStart, reportEnd];
    }}
    function dateRangeKeys(start, end) {{
      const keys = [];
      let cursor = parseLocalDate(start);
      const last = parseLocalDate(end);
      while (cursor <= last) {{
        keys.push(dateKey(cursor));
        cursor = addDays(cursor, 1);
      }}
      return keys;
    }}
    function trendCampaignIds(query) {{
      const ids = new Set();
      const q = query.trim().toLowerCase();
      for (const row of rows) {{
        const name = String(row.campaign_name || '').toLowerCase();
        const id = String(row.campaign_id || '');
        if (!id || id === '-') continue;
        if (!q || name.includes(q)) ids.add(id);
      }}
      return ids;
    }}
    function trendOperationRows(query, start, end) {{
      const q = query.trim().toLowerCase();
      return rows.filter(row => {{
        if (row.operate_date < start || row.operate_date > end) return false;
        if (!q) return true;
        return String(row.campaign_name || '').toLowerCase().includes(q);
      }});
    }}
    function rawFromPerformance(row) {{
      return {{
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        cost: Number(row.cost || 0),
        sales: Number(row.sales || 0),
        orders: Number(row.orders || 0),
        same_orders: Number(row.same_orders || 0)
      }};
    }}
    function compactNumber(value) {{
      const n = Number(value || 0);
      if (Math.abs(n) >= 1000000) return `${{(n / 1000000).toFixed(1)}}M`;
      if (Math.abs(n) >= 1000) return `${{(n / 1000).toFixed(1)}}k`;
      return n.toFixed(n < 10 ? 2 : 0);
    }}
    function axisFormat(axis, value) {{
      if (!axis) return '';
      const n = Number(value || 0);
      if (axis.unit === 'rate') {{
        const decimals = axis.max <= 0.02 ? 2 : axis.max <= 0.2 ? 1 : 0;
        return `${{(n * 100).toFixed(decimals)}}%`;
      }}
      if (axis.unit === 'currency') return `$${{compactNumber(n)}}`;
      return compactNumber(n);
    }}
    function metricNames(metrics) {{
      return metrics.map(key => trendMetricConfig[key]?.label || key).join('、');
    }}
    function niceLinearMax(rawMax) {{
      const padded = Math.max(Number(rawMax || 0) * 1.12, 1);
      const magnitude = 10 ** Math.floor(Math.log10(padded));
      const scaled = padded / magnitude;
      const steps = [1, 2, 2.5, 5, 10];
      const step = steps.find(item => scaled <= item) || 10;
      return step * magnitude;
    }}
    function niceRateMax(rawMax) {{
      const padded = Math.max(Number(rawMax || 0) * 1.18, 0.001);
      const steps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 1, 1.5, 2];
      return steps.find(item => padded <= item) || Math.ceil(padded);
    }}
    function niceAxisMax(rawMax, unit) {{
      return unit === 'rate' ? niceRateMax(rawMax) : niceLinearMax(rawMax);
    }}
    function axisPosition(index) {{
      if (index === 0) return 'left';
      if (index === 1) return 'right';
      return 'third';
    }}
    function axisLabel(position) {{
      if (position === 'left') return '左轴';
      if (position === 'right') return '右轴';
      return '右轴2';
    }}
    function buildTrendAxisPlan(selected, daily) {{
      const axes = selected.map((key, index) => {{
        const values = daily
          .map(day => day.metrics ? Number(day.metrics[key] || 0) : null)
          .filter(value => value !== null && Number.isFinite(value));
        const config = trendMetricConfig[key] || {{}};
        const position = axisPosition(index);
        return {{
          id: position,
          key,
          metrics: [key],
          label: config.label || key,
          unit: config.unit || 'number',
          color: config.color || '#64748b',
          max: niceAxisMax(Math.max(0, ...values), config.unit || 'number')
        }};
      }});
      const assignments = {{}};
      axes.forEach(axis => assignments[axis.key] = axis.id);
      const summary = `真实值模式：最多同时显示 ${{MAX_TREND_METRICS}} 个指标；每个指标独立坐标轴，${{axes.map(axis => `${{axis.label}}=${{axisLabel(axis.id)}}`).join('，')}}。`;
      return {{ axes, assignments, summary }};
    }}
    function updateMetricAxisTags(assignments) {{
      for (const tag of trendMetricControls.querySelectorAll('[data-axis-for]')) {{
        const key = tag.dataset.axisFor;
        const input = trendMetricControls.querySelector(`input[value="${{key}}"]`);
        const axis = assignments[key];
        if (input) input.checked = trendMetricSelection.includes(key);
        tag.className = 'axis-tag auto';
        if (!input?.checked || !axis) {{
          tag.textContent = '待选';
          continue;
        }}
        tag.className = `axis-tag ${{axis === 'right' ? 'right' : axis === 'third' ? 'third' : ''}}`;
        tag.textContent = axisLabel(axis);
      }}
    }}
    function svgNode(name, attrs = {{}}, text = '') {{
      const node = document.createElementNS('http://www.w3.org/2000/svg', name);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      if (text) node.textContent = text;
      return node;
    }}
    function setHighlightedTrendMetric(key) {{
      highlightedTrendMetric = highlightedTrendMetric === key ? '' : key;
      renderTrend();
    }}
    function hideTrendTooltip() {{
      trendTooltip.classList.add('hidden');
    }}
    function positionTrendTooltip(event) {{
      const frame = trendSvg.parentElement;
      const rect = frame.getBoundingClientRect();
      const tooltipWidth = trendTooltip.offsetWidth || 260;
      const tooltipHeight = trendTooltip.offsetHeight || 220;
      const left = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, rect.width - tooltipWidth - 8));
      const top = Math.min(Math.max(event.clientY - rect.top + 12, 8), Math.max(8, rect.height - tooltipHeight - 8));
      trendTooltip.style.left = `${{left}}px`;
      trendTooltip.style.top = `${{top}}px`;
    }}
    function appendTooltipRow(grid, labelText, valueText) {{
      const label = document.createElement('div');
      label.className = 'trend-tooltip-label';
      label.textContent = labelText;
      const value = document.createElement('div');
      value.className = 'trend-tooltip-value';
      value.textContent = valueText;
      grid.appendChild(label);
      grid.appendChild(value);
    }}
    function showTrendTooltip(event, day, ops = []) {{
      if (!day) return;
      trendTooltip.replaceChildren();
      const title = document.createElement('div');
      title.className = 'trend-tooltip-title';
      title.textContent = day.date;
      trendTooltip.appendChild(title);
      const metricSection = document.createElement('div');
      metricSection.className = 'trend-tooltip-section';
      const metricTitle = document.createElement('div');
      metricTitle.className = 'trend-tooltip-section-title';
      metricTitle.textContent = '广告指标';
      metricSection.appendChild(metricTitle);
      const grid = document.createElement('div');
      grid.className = 'trend-tooltip-grid';
      for (const key of trendMetricOrder) {{
        const config = trendMetricConfig[key] || {{}};
        const value = day.metrics ? formatMetric(key, day.metrics[key]) : '-';
        appendTooltipRow(grid, config.label || key, value);
      }}
      metricSection.appendChild(grid);
      trendTooltip.appendChild(metricSection);
      if (ops.length) {{
        const opsSection = document.createElement('div');
        opsSection.className = 'trend-tooltip-section';
        const opsTitle = document.createElement('div');
        opsTitle.className = 'trend-tooltip-section-title';
        opsTitle.textContent = '操作记录';
        opsSection.appendChild(opsTitle);
        const opsGrid = document.createElement('div');
        opsGrid.className = 'trend-tooltip-grid';
        appendTooltipRow(opsGrid, '数量', `${{ops.length}} 条`);
        opsSection.appendChild(opsGrid);
        const summary = document.createElement('div');
        summary.style.marginTop = '8px';
        summary.style.color = '#cbd5e1';
        summary.textContent = ops.slice(0, 3).map(op => `${{op.variable_label || op.variable_code}}：${{op.before}}→${{op.after}}`).join('；');
        opsSection.appendChild(summary);
        trendTooltip.appendChild(opsSection);
      }}
      trendTooltip.classList.remove('hidden');
      positionTrendTooltip(event);
    }}
    function trendTickIndexes(dates, plotW) {{
      if (dates.length <= 1) return [0];
      const minGap = plotW >= 1600 ? 52 : plotW >= 1000 ? 60 : 74;
      const maxTicks = Math.max(2, Math.floor(plotW / minGap) + 1);
      if (dates.length <= maxTicks) return dates.map((_, index) => index);
      const step = Math.max(1, Math.ceil((dates.length - 1) / (maxTicks - 1)));
      const indexes = [];
      for (let index = 0; index < dates.length; index += step) indexes.push(index);
      if (indexes[indexes.length - 1] !== dates.length - 1) indexes.push(dates.length - 1);
      return indexes;
    }}
    function renderTrend() {{
      const selected = selectedTrendMetrics();
      if (highlightedTrendMetric && !selected.includes(highlightedTrendMetric)) highlightedTrendMetric = '';
      hideTrendTooltip();
      trendSvg.replaceChildren();
      trendLegend.replaceChildren();
      axisSummary.textContent = '';
      if (!selected.length) {{
        trendNote.textContent = '请选择至少一个趋势指标。';
        updateMetricAxisTags({{}});
        return;
      }}
      const [start, end] = effectiveDateRange();
      const query = fields.campaign.value.trim();
      const campaignIds = trendCampaignIds(query);
      const perfRows = performancePayload?.rows?.sp_campaign_reports || [];
      const rawByDate = new Map();
      for (const row of perfRows) {{
        const date = String(row.report_date || '');
        if (date < start || date > end) continue;
        const campaignId = String(row.campaign_id || '');
        if (query && !campaignIds.has(campaignId)) continue;
        if (!rawByDate.has(date)) rawByDate.set(date, emptyRaw());
        addRaw(rawByDate.get(date), rawFromPerformance(row));
      }}
      const dates = dateRangeKeys(start, end);
      const daily = dates.map(date => {{
        const raw = rawByDate.get(date);
        return {{ date, metrics: raw ? derive(raw) : null }};
      }});
      const markerRows = trendOperationRows(query, start, end);
      const markers = new Map();
      for (const row of markerRows) {{
        const date = row.operate_date;
        if (!markers.has(date)) markers.set(date, []);
        markers.get(date).push(row);
      }}
      const axisPlan = buildTrendAxisPlan(selected, daily);
      updateMetricAxisTags(axisPlan.assignments);
      axisSummary.textContent = axisPlan.summary;
      const height = 420;
      const hasThirdAxis = axisPlan.axes.length >= 3;
      const renderedWidth = Math.round(trendSvg.getBoundingClientRect().width || trendSvg.parentElement?.clientWidth || 1120);
      const width = Math.max(1120, renderedWidth);
      const pad = {{ left: 70, right: hasThirdAxis ? 150 : 78, top: 28, bottom: 54 }};
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;
      const xForIndex = index => dates.length > 1 ? pad.left + (index / (dates.length - 1)) * plotW : pad.left + plotW / 2;
      const axisById = id => axisPlan.axes.find(axis => axis.id === id);
      const xForAxis = axis => axis.id === 'left' ? pad.left : axis.id === 'right' ? width - pad.right : width - pad.right + 72;
      const yForValue = (value, axis) => {{
        const max = axisById(axis)?.max || 1;
        return pad.top + plotH - (Number(value || 0) / max) * plotH;
      }};
      const showNearestTooltip = event => {{
        if (!dates.length) return;
        const rect = trendSvg.getBoundingClientRect();
        const viewX = rect.width ? (event.clientX - rect.left) * width / rect.width : pad.left;
        const ratio = dates.length > 1 ? (viewX - pad.left) / plotW : 0;
        const index = Math.min(dates.length - 1, Math.max(0, Math.round(ratio * (dates.length - 1))));
        showTrendTooltip(event, daily[index], markers.get(dates[index]) || []);
      }};
      trendSvg.onmouseleave = hideTrendTooltip;
      trendSvg.setAttribute('viewBox', `0 0 ${{width}} ${{height}}`);
      trendSvg.appendChild(svgNode('rect', {{ x: 0, y: 0, width, height, fill: '#fff' }}));
      for (let i = 0; i <= 4; i++) {{
        const y = pad.top + (plotH / 4) * i;
        trendSvg.appendChild(svgNode('line', {{ x1: pad.left, y1: y, x2: width - pad.right, y2: y, stroke: '#e4ebf5', 'stroke-width': 1 }}));
        for (const axis of axisPlan.axes) {{
          const x = xForAxis(axis);
          const anchor = axis.id === 'left' ? 'end' : 'start';
          const labelX = axis.id === 'left' ? x - 10 : x + 10;
          trendSvg.appendChild(svgNode('text', {{ x: labelX, y: y + 4, 'text-anchor': anchor, fill: axis.color, 'font-size': 12 }}, axisFormat(axis, axis.max * (1 - i / 4))));
        }}
      }}
      for (const axis of axisPlan.axes) {{
        const x = xForAxis(axis);
        trendSvg.appendChild(svgNode('line', {{ x1: x, y1: pad.top, x2: x, y2: pad.top + plotH, stroke: axis.color, 'stroke-width': axis.id === 'third' ? 1 : 1.2 }}));
      }}
      trendSvg.appendChild(svgNode('line', {{ x1: pad.left, y1: pad.top + plotH, x2: width - pad.right, y2: pad.top + plotH, stroke: '#94a3b8' }}));
      for (const index of trendTickIndexes(dates, plotW)) {{
        const x = xForIndex(index);
        trendSvg.appendChild(svgNode('text', {{ x, y: height - 18, 'text-anchor': 'middle', fill: '#64748b', 'font-size': 12 }}, dates[index].slice(5)));
      }}
      if (dates.length) {{
        const halfBand = dates.length > 1 ? Math.max(6, plotW / (dates.length - 1) / 2) : plotW / 2;
        for (let index = 0; index < dates.length; index++) {{
          const x = xForIndex(index);
          const left = index === 0 ? pad.left : x - halfBand;
          const right = index === dates.length - 1 ? pad.left + plotW : x + halfBand;
          const band = svgNode('rect', {{ x: left, y: pad.top, width: Math.max(1, right - left), height: plotH, fill: 'transparent', 'pointer-events': 'all' }});
          band.addEventListener('mousemove', event => showTrendTooltip(event, daily[index], markers.get(dates[index]) || []));
          trendSvg.appendChild(band);
        }}
      }}
      for (const key of selected) {{
        const config = trendMetricConfig[key];
        const axis = axisPlan.assignments[key] || 'left';
        const isDimmed = highlightedTrendMetric && highlightedTrendMetric !== key;
        const isActive = highlightedTrendMetric === key;
        const points = daily
          .map((day, index) => {{
            if (!day.metrics) return null;
            const value = Number(day.metrics[key] || 0);
            if (!Number.isFinite(value)) return null;
            return {{ x: xForIndex(index), y: yForValue(value, axis), date: day.date, value, day }};
          }})
          .filter(Boolean);
        if (!points.length) continue;
        const path = points.map((point, index) => `${{index ? 'L' : 'M'}}${{point.x.toFixed(1)}},${{point.y.toFixed(1)}}`).join(' ');
        const visiblePath = svgNode('path', {{
          d: path,
          fill: 'none',
          stroke: config.color,
          'stroke-width': isActive ? 3.8 : 2.2,
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
          opacity: isDimmed ? .18 : 1,
          cursor: 'pointer'
        }});
        visiblePath.addEventListener('click', event => {{ event.stopPropagation(); setHighlightedTrendMetric(key); }});
        visiblePath.addEventListener('mousemove', showNearestTooltip);
        trendSvg.appendChild(visiblePath);
        const hitPath = svgNode('path', {{ d: path, fill: 'none', stroke: 'transparent', 'stroke-width': 14, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'pointer-events': 'stroke', cursor: 'pointer' }});
        hitPath.addEventListener('click', event => {{ event.stopPropagation(); setHighlightedTrendMetric(key); }});
        hitPath.addEventListener('mousemove', showNearestTooltip);
        trendSvg.appendChild(hitPath);
        for (const point of points) {{
          const circle = svgNode('circle', {{ cx: point.x, cy: point.y, r: isActive ? 4.6 : 3, fill: config.color, opacity: isDimmed ? .22 : 1, cursor: 'pointer' }});
          circle.addEventListener('click', event => {{ event.stopPropagation(); setHighlightedTrendMetric(key); }});
          circle.addEventListener('mousemove', event => showTrendTooltip(event, point.day, markers.get(point.date) || []));
          trendSvg.appendChild(circle);
        }}
      }}
      for (const [date, ops] of markers.entries()) {{
        const index = dates.indexOf(date);
        if (index < 0) continue;
        const x = xForIndex(index);
        const line = svgNode('line', {{ x1: x, y1: pad.top, x2: x, y2: pad.top + plotH, class: 'operation-line' }});
        line.addEventListener('mousemove', event => showTrendTooltip(event, daily[index], ops));
        trendSvg.appendChild(line);
        const dot = svgNode('circle', {{ cx: x, cy: pad.top + 10, r: 5, class: 'operation-dot' }});
        dot.addEventListener('mousemove', event => showTrendTooltip(event, daily[index], ops));
        trendSvg.appendChild(dot);
      }}
      for (const key of selected) {{
        const config = trendMetricConfig[key];
        const axis = axisPlan.assignments[key] || 'left';
        const item = document.createElement('span');
        item.className = 'legend-item interactive';
        if (highlightedTrendMetric === key) item.classList.add('active');
        if (highlightedTrendMetric && highlightedTrendMetric !== key) item.classList.add('dimmed');
        item.title = highlightedTrendMetric === key ? '点击取消高亮' : '点击高亮该曲线';
        item.addEventListener('click', () => setHighlightedTrendMetric(key));
        const swatch = document.createElement('span');
        swatch.className = 'legend-swatch';
        swatch.style.background = config.color;
        const label = document.createElement('span');
        label.textContent = `${{config.label}}（${{axisLabel(axis)}}）`;
        item.appendChild(swatch);
        item.appendChild(label);
        trendLegend.appendChild(item);
      }}
      const markerLegend = document.createElement('span');
      markerLegend.className = 'legend-item';
      markerLegend.innerHTML = '<span class="legend-dot"></span><span>操作日期标记</span>';
      trendLegend.appendChild(markerLegend);
      const campaignText = query ? `广告活动包含“${{query}}”` : '全部广告活动';
      const notice = trendMetricNotice ? ` ${{trendMetricNotice}}` : '';
      trendNote.textContent = `${{campaignText}}，日期 ${{start}} 至 ${{end}}，日报覆盖 ${{rawByDate.size}} 天，操作标记 ${{markers.size}} 天，真实值坐标轴按指标独立缩放。${{notice}}`;
      trendMetricNotice = '';
    }}
    function appendText(parent, text, className = '') {{
      const node = document.createElement('div');
      if (className) node.className = className;
      node.textContent = text;
      parent.appendChild(node);
      return node;
    }}
    function appendPeriod(parent, title, range, days, daysTotal, metrics, compareMetrics = null) {{
      const block = document.createElement('div');
      block.className = 'impact-period';
      appendText(block, `${{title}}：${{range}}（覆盖 ${{days || 0}}/${{daysTotal || 0}} 天）`, 'impact-period-title');
      const metricGrid = document.createElement('div');
      metricGrid.className = 'impact-metrics';
      for (const key of effectMetricOrder) {{
        const item = document.createElement('div');
        item.className = 'impact-metric';
        const label = document.createElement('span');
        label.textContent = metricDisplayLabel(key);
        const value = document.createElement('span');
        value.className = 'impact-value';
        if (compareMetrics) {{
          const direction = effectDirection(key, compareMetrics[key], metrics[key]);
          const arrow = document.createElement('span');
          arrow.className = `impact-arrow ${{direction.className}}`;
          arrow.textContent = direction.symbol;
          arrow.title = `${{metricDisplayLabel(key)}}${{direction.label}}`;
          value.appendChild(arrow);
        }}
        const amount = document.createElement('span');
        amount.textContent = formatMetric(key, metrics[key]);
        value.appendChild(amount);
        item.appendChild(label);
        item.appendChild(value);
        metricGrid.appendChild(item);
      }}
      block.appendChild(metricGrid);
      parent.appendChild(block);
    }}
    function impactCell(row) {{
      const td = document.createElement('td');
      td.className = 'impact-window-cell';
      const impact = row.impact || {{}};
      if (!['ready', 'partial'].includes(impact.status)) {{
        td.textContent = impact.message || '-';
        return td;
      }}
      const beforeRange = impact.before_range?.length ? impact.before_range.join('~') : '无前置区间';
      const afterRange = impact.after_range?.length ? impact.after_range.join('~') : '无后置区间';
      const wrap = document.createElement('div');
      wrap.className = 'impact-window';
      const beforeMetrics = periodMetrics(impact, 'before');
      const afterMetrics = periodMetrics(impact, 'after');
      const canCompare = Number(impact.before_days || 0) > 0 && Number(impact.after_days || 0) > 0;
      appendPeriod(wrap, '改前区间', beforeRange, impact.before_days, impact.before_days_total, beforeMetrics);
      appendPeriod(wrap, '改后区间', afterRange, impact.after_days, impact.after_days_total, afterMetrics, canCompare ? beforeMetrics : null);
      td.appendChild(wrap);
      return td;
    }}
    function render() {{
      const filtered = rows.filter(matches);
      const page = filtered.slice(0, 500);
      body.replaceChildren();
      for (const row of page) {{
        const tr = document.createElement('tr');
        tr.appendChild(cell(row.operate_time));
        const badge = cell(row.sponsored_type);
        badge.innerHTML = `<span class="badge badge-${{String(row.sponsored_type || '').toLowerCase()}}">${{row.sponsored_type || '-'}}</span>`;
        tr.appendChild(badge);
        tr.appendChild(cell(row.operate_type_label));
        tr.appendChild(cell(row.campaign_name, 'mono'));
        tr.appendChild(cell(row.object_name, 'mono'));
        tr.appendChild(cell(row.variable_label));
        tr.appendChild(cell(row.before, 'mono'));
        tr.appendChild(cell(row.after, 'mono'));
        tr.appendChild(impactCell(row));
        tr.appendChild(cell(row.user_name));
        tr.appendChild(cell(row.change_type_label));
        body.appendChild(tr);
      }}
      countLabel.textContent = `筛选结果：${{filtered.length.toLocaleString()}} 条变量级记录，当前展示前 ${{page.length.toLocaleString()}} 条。`;
      renderTrend();
    }}
    document.getElementById('dateRangeTrigger').addEventListener('click', () => {{
      document.getElementById('datePicker').classList.toggle('hidden');
      renderCalendar();
    }});
    document.getElementById('prevMonth').addEventListener('click', () => {{ calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); }});
    document.getElementById('nextMonth').addEventListener('click', () => {{ calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); }});
    document.getElementById('prevYear').addEventListener('click', () => {{ calendarMonth.setFullYear(calendarMonth.getFullYear() - 1); renderCalendar(); }});
    document.getElementById('nextYear').addEventListener('click', () => {{ calendarMonth.setFullYear(calendarMonth.getFullYear() + 1); renderCalendar(); }});
    document.getElementById('clearDateRange').addEventListener('click', () => {{ selectedStart = ''; selectedEnd = ''; updateDateTrigger(); renderCalendar(); render(); }});
    document.getElementById('applyDateRange').addEventListener('click', () => {{
      if (selectedStart && !selectedEnd) selectedEnd = selectedStart;
      updateDateTrigger();
      renderCalendar();
      document.getElementById('datePicker').classList.add('hidden');
      render();
    }});
    document.addEventListener('click', event => {{
      const wrap = document.querySelector('.date-wrap');
      const path = event.composedPath ? event.composedPath() : [];
      const clickedInsideDate = wrap && (wrap.contains(event.target) || path.includes(wrap));
      if (wrap && !clickedInsideDate) {{
        if (selectedStart && !selectedEnd) {{
          selectedStart = '';
          updateDateTrigger();
          renderCalendar();
        }}
        document.getElementById('datePicker').classList.add('hidden');
      }}
      const combo = document.querySelector('.combo-wrap');
      const clickedInsideCombo = combo && (combo.contains(event.target) || path.includes(combo));
      if (combo && !clickedInsideCombo) campaignOptionsNode.classList.add('hidden');
    }});
    document.getElementById('applyFilters').addEventListener('click', render);
    document.getElementById('resetFilters').addEventListener('click', () => {{
      Object.values(fields).forEach(el => el.value = '');
      selectedStart = ''; selectedEnd = ''; updateDateTrigger();
      render();
    }});
    fields.campaign.addEventListener('focus', renderCampaignOptions);
    fields.campaign.addEventListener('input', () => {{ renderCampaignOptions(); render(); }});
    Object.values(fields).forEach(el => {{
      if (el.tagName === 'SELECT') el.addEventListener('change', render);
    }});
    let trendResizeTimer = null;
    window.addEventListener('resize', () => {{
      clearTimeout(trendResizeTimer);
      trendResizeTimer = setTimeout(renderTrend, 120);
    }});
    updateDateTrigger();
    renderQuickRanges();
    renderTrendControls();
    render();
  </script>
</body>
</html>"""
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html_body, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--title", default="领星广告操作日志审计")
    parser.add_argument("--store-label", default="LingXing store")
    parser.add_argument("--performance-input", type=Path)
    parser.add_argument("--impact-window-days", type=int, default=7)
    args = parser.parse_args()

    payload = load_export(args.input)
    performance_payload = load_performance(args.performance_input)
    result = payload.get("result", payload)
    records = result.get("data") or []
    if not isinstance(records, list):
        raise SystemExit("MCP result data is not a list")

    log_df, change_df = normalize_rows(records)
    log_df, change_df, filter_summary = filter_analysis_variables(log_df, change_df)
    change_df = attach_impact(change_df, performance_payload, args.impact_window_days)

    build_html(args.output, args.title, args.store_label, payload, performance_payload, log_df, change_df, filter_summary, args.impact_window_days)
    print(json.dumps({
        "output": str(args.output),
        "records": len(log_df),
        "change_rows": len(change_df),
        "filtered": filter_summary,
        "impact_rows": int(change_df["impact_status"].isin(["ready", "partial"]).sum()) if "impact_status" in change_df else 0,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
