# 图件数据清单

| 图件 | 内容 | 输入 | 当前状态 |
| --- | --- | --- | --- |
| F1 | 控制器数据流与状态转移 | 冻结方法参数 | 待绘制，不依赖结果 |
| F2 | 五方法 ViolationRate 分布 | 正式运行级 CSV/JSON | `WAITING_FOR_FORMAL_DATA` |
| F3 | D2/S2 帧时、请求队列与 SSE 时间序列 | 代表性正式运行遥测 | `WAITING_FOR_FORMAL_DATA` |
| F4 | SSE 档位与六视点 SSIM | `results/quality/quality_ssim.csv` | `WAITING_FOR_CALIBRATION` |
| F5 | 消融效应 | 正式 D2/S2 消融日志 | `WAITING_FOR_FORMAL_DATA` |

任何规划图数据文件必须使用 `mock_` 或 `synthetic_` 前缀，并标注 `PLANNING DATA - replace before submission`。当前不生成模拟性能数值。

