"""One forecast over the Ephemeris REST API, standard library only.

    EPHEMERIS_API_KEY=pc_live_... python rest_forecast.py
"""

import json
import os
import urllib.request

body = {
    "mode": "ensemble",
    "series": [
        {
            "values": [112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118,
                       115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140],
            "freq": "M",
        }
    ],
    "horizon": 12,
    "quantiles": [0.1, 0.5, 0.9],
}

request = urllib.request.Request(
    "https://ephemeris.cascade.industries/api/v1/forecast",
    data=json.dumps(body).encode(),
    headers={
        "Authorization": f"Bearer {os.environ['EPHEMERIS_API_KEY']}",
        "Content-Type": "application/json",
    },
    method="POST",
)
with urllib.request.urlopen(request, timeout=120) as response:
    result = json.load(response)

quantiles = result["forecasts"][0]["quantiles"]
for step, (low, mid, high) in enumerate(zip(quantiles["0.1"], quantiles["0.5"], quantiles["0.9"]), 1):
    print(f"t+{step:>2}: {mid:8.1f}  (80% interval {low:.1f} to {high:.1f})")
print("models:", ", ".join(result["meta"]["models_used"]))
print("charged:", result["meta"]["billing"]["settled_mc"], "millicredits")
