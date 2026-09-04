# 论文表格数据契约

| 表格 | 用途 | 行 | 指标 | 数据源 | 回填责任 |
| --- | --- | --- | --- | --- | --- |
| T1 | 设备与软件环境 | PC-A、PC-B、Android-A | CPU/SoC、GPU、RAM、Chrome、刷新率、连接、服务器拓扑 | RunManifest 与人工核验 | 正式采集人 |
| T2 | 六方法主对照 | 方法×桌面设备×数据集×S3 场景 | ViolationRate、P95、P99、加权 SSE、切换率 | `descriptive_*.csv` | `analyze_results.py` |
| T3 | 配对统计 | planned comparison | Wilcoxon p、Holm p、HL 差、秩二列、bootstrap CI | `paired_tests.csv` | `analyze_results.py` |
| T4 | 质量标定 | 数据集×SSE 档位 | 六视点 SSIM 及相对差 | `quality_ssim.csv` | `quality_analysis.py` |
| T5 | 消融实验 | proposed 与四项消融 | ViolationRate、加权 SSE、切换率、恢复时间 | PC-A D1/S3 confirmatory-ablation 日志 | `analyze_results.py` |

重复运行以运行级摘要作为统计样本。正式表格报告中位数与四分位距，并按协议补充效应量和置信区间；不得将帧或重叠窗口视作独立样本。
