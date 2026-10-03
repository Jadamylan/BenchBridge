# Two-minute judge mode

From `benchbridge`, run `make demo`. Open http://127.0.0.1:3010/demo. The API is http://127.0.0.1:8000. Space or the right arrow advances. The left arrow goes back. Escape restarts. The presentation does not auto-advance. A presenter can finish the eight steps inside two minutes. Every figure on screen is filled by `GET /api/demo` from the engine. Do not read the demo bench as a live out-of-work list.

| Time | Beat |
| --- | --- |
| 0:00–0:15 | The gap. Context strip: Oakland point-in-time count, share of the county total, California construction jobs year over year. “Oakland has two types of capacity sitting idle.” |
| 0:15–0:30 | One building, BB-001, West Oakland. Modeled potential units, then plumbing, electrical, carpentry, environmental remediation. |
| 0:30–0:50 | Build the crew. Need versus demo supply. The general trades are covered. The specialist line is short. Real bench counts require partner authorization. Not official dispatch. |
| 0:50–1:05 | Modeled blocker: environmental remediation. Modeled funding gap. Asbestos remains unknown. Illustrative firms, union status unknown. |
| 1:05–1:20 | Activate. Ends on modeled units and worker-hours, plus potential benefits to validate with partners. |
| 1:20–1:35 | What if Oakland had $500,000? Three affected candidates, modeled units, worker-hours, three neighborhoods. Hypothetical, not a funding recommendation. |
| 1:35–1:50 | The ask. Demo bench banner. The number we cannot show is the real bench. Three voluntary asks: trades, city and county, and everyone. |
| 1:50–2:00 | BenchBridge. Connect the capacity that's already here. |

The acceptance targets the engine must reproduce are in `tests/test_consistency.py`: featured building, West Oakland block, the $500,000 rule, a bench total of 64, and 148 modeled units across the candidate set.
