# Device Registry

Protocol: current benchmark route `v2.3.6`
Recorded: 2026-08-25; Android-A pilot-condition reconfirmation added 2026-09-01; PC-B registered 2026-09-02
Status: preparation; no device has entered confirmatory collection.

## PC-A

| Field | Recorded value |
| --- | --- |
| Device ID | `pc-a` |
| CPU | 11th Gen Intel Core i5-1155G7 @ 2.50 GHz |
| GPU | Intel Iris Xe Graphics; NVIDIA GeForce MX450 |
| RAM | 16.0 GB (15.8 GB usable) |
| Operating system | Windows 11 Home, 25H2 |
| Browser | Chrome 151.0.7922.174 (64-bit) |
| Display refresh rate | 60 Hz |
| Network | Wi-Fi |
| Final collection power mode | Best performance |

`chrome://gpu` evidence recorded 2026-08-25: Canvas, WebGL, and WebGPU are hardware
accelerated; software rendering is disabled; GPU process crash count is zero. The active
WebGL renderer is `ANGLE (NVIDIA GeForce MX450, Direct3D11)` with driver
`31.0.15.2656`. Keep the Best performance power profile and AC power connection fixed
for every PC-A calibration, pilot, and confirmatory run. Record the Wi-Fi SSID in the
run notes.

## PC-B

| Field | Recorded value |
| --- | --- |
| Device ID | `pc-b` |
| CPU | Intel(R) Core(TM) Ultra 7 258V @ 2.20 GHz |
| GPU | Intel(R) Arc(TM) 140V GPU (16 GB) |
| RAM | 32.0 GB (31.6 GB usable), 8533 MT/s |
| Operating system | Windows 11 Home Chinese edition, 25H2 |
| Browser | Chrome 150.0.7871.115 (official build, 64-bit) |
| Display refresh rate | 60 Hz |
| Network | Wi-Fi |
| Wi-Fi SSID for collection | TP318 |
| Power mode | Best performance |
| AC / battery state for collection | Plugged in |
| Benchmark drawing buffer | `960 x 540` |

PC-B was registered on 2026-09-02 as the second desktop candidate for the current
desktop efficacy route. Run-day conditions recorded on 2026-09-02: plugged in, Wi-Fi
SSID `TP318`, Best performance power mode, Chrome 150.0.7871.115, and benchmark
drawing buffer `960 x 540`.

`chrome://gpu` evidence recorded from the supplied screenshot on 2026-09-02: Canvas,
Compositing, Rasterization, WebGL, and WebGPU are hardware accelerated; OpenGL is
enabled; Multiple Raster Threads are enabled. The report was exported at
`2026-09-02T06:19:47.933Z` and lists GPU0 as
`Intel(R) Arc(TM) 140V GPU (16GB)` with `DRIVER_VERSION=32.0.101.8860` and `*ACTIVE*`.
Keep the same power mode, browser foreground state, Wi-Fi SSID, and `960 x 540` target
across PC-B runs.

## Android-A

| Field | Recorded value |
| --- | --- |
| Device ID | `android-a` |
| Model | vivo X200 Pro mini (V2419A) |
| SoC | MediaTek Dimensity 9400, octa-core |
| RAM | 12 GB physical + 12 GB memory expansion |
| Operating system | Android 16 |
| Browser | Chrome 151.0.7922.173 for the v2.3.6 pilot-condition reconfirmation; earlier readiness record used Chrome 151.0.7922.171 |
| Display refresh rate | Standard mode, maximum 60 Hz |
| Battery before v2.3.6 Android-A pilot setup | 50%, charging |
| Network | 5 GHz Wi-Fi |

The 2026-09-01 Android-A v2.3.6 pilot-condition reconfirmation records: landscape
orientation, 50% battery while charging, cooled / thermally stabilized state with exact
device temperature `[待填]`, 5 GHz Wi-Fi, Chrome 151.0.7922.173, hardware acceleration
enabled, and a `960 x 540` drawing-buffer target. Keep this power/charging state fixed
through the v2.3.6 Android-A pilot and do not mix it with the earlier unplugged
readiness condition when interpreting results.

The earlier 2026-08-25 readiness condition used 100% battery, not charging, and Chrome
151.0.7922.171. For any future confirmatory collection, reconfirm the Android-A
physical conditions immediately before the confirmatory block and record whether the
device is charging or unplugged. The physical Chrome renderer previously reported a
stable `959 x 540` drawing buffer at the `960 x 540` target; this is within the frozen
one-pixel browser-rounding tolerance and must be recorded in telemetry rows.

The Android-A v2.3.6 D1/S3 `pressureBurst` pilot was collected on 2026-09-01 under the
recorded pilot setup conditions. Raw manifests report `deviceId=android-a`,
`protocolVersion=2.3.6`, `networkProfile=lan`, Chrome mobile user-agent
`Chrome/151.0.0.0`, and `renderWidth=960`, `renderHeight=540`.

The true Android-A v2.3.6 D2/S3 `pressureBurst` pilot was also collected on 2026-09-01
with the new D2/S3 UI button. It produced 24 valid `bagRotterdam + pressureBurst`
records in four complete six-method pilot blocks and no invalid attempts. Interpret it
under the same recorded Android-A pilot setup conditions; it is not confirmatory
evidence.

Android readiness passed on 2026-08-25 with run
`android-a-acceptance2-publicStress-burst-proposed-r1-mt8e8tcc`: 78 valid windows,
0% window violation rate, 85 loaded tiles, no tile failures, and 86 resource-timing
entries. This run is a readiness record, not confirmatory evidence.

## Collection Controls

- Use the same Wi-Fi access point and do not run measurements on both devices at the
  same time.
- Keep the benchmark tab foregrounded, preserve the 960 x 540 drawing buffer, and do
  not resize or lock the screen during a run.
- Treat any run with focus loss, resize, resource failure, or invalid status as an
  invalid run; retain its raw JSON for the audit trail.
