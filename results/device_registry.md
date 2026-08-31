# Device Registry

Protocol: `2.0.0`  
Recorded: 2026-08-25  
Status: preparation; neither device has entered confirmatory collection.

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

## Android-A

| Field | Recorded value |
| --- | --- |
| Device ID | `android-a` |
| Model | vivo X200 Pro mini (V2419A) |
| SoC | MediaTek Dimensity 9400, octa-core |
| RAM | 12 GB physical + 12 GB memory expansion |
| Operating system | Android 16 |
| Browser | Chrome 151.0.7922.171 |
| Display refresh rate | Standard mode, maximum 60 Hz |
| Battery before collection | 100%, not charging |
| Network | 5 GHz Wi-Fi |

The battery threshold is satisfied. Before collection, keep the device unplugged,
disable battery saver, wait 10 minutes for thermal stabilization after opening the
benchmark, and use landscape orientation at 60 Hz. Do not charge during a measured run.
The physical Chrome renderer reports a stable `959 x 540` drawing buffer at the
`960 x 540` target; this is within the frozen one-pixel browser-rounding tolerance and
is recorded in every telemetry row.

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
