# 第三方 skill 溯源清单

> `skills/third-party/` 存放从 GitHub 等处取回的第三方 skill **原样副本**，用于研究学习与本机安装（`python tools/install.py <name>`，同名冲突用 `--from third-party`）；不参与本仓任何门禁与发布——marketplace 门禁机械保证其进不了分发渠道（ADR-0010）。要改造，走 fork：复制到 `skills/first-party/<name>/` 后按仓库规则迭代（纪律 H）。
>
> **入库边界**：本仓是公开仓，push 即再分发——**有再分发许可（MIT / Apache-2.0 等）才提交内容**；无许可或许可不明的，只在下表记一行（内容入库列填"否"），内容留本机。
>
> **原样纪律**：副本保持逐字节原样、不做任何本地修改——原样才能 diff 上游更新。
>
> **安全提醒**：第三方 skill 是半信任内容（含指令与脚本），安装进 agent 路径前先通读。

| 名称 | 来源 | ref/commit | 取回日期 | license | 内容入库 | 备注 |
|---|---|---|---|---|---|---|
