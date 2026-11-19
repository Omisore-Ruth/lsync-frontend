"""
Turns data/edtech.csv (5,000 students, labelled active / at-risk / dropped) into the small JSON file the
Insights page reads: src/lib/data/edtech-insights.json

Run (needs pandas and scikit-learn):  python scripts/build-insights.py
The website never loads the raw CSV, only these summaries and the model weights.
"""
import json
import pathlib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

root = pathlib.Path(__file__).resolve().parent.parent
d = pd.read_csv(root / "data" / "edtech.csv")
LABELS = ["active", "at-risk", "dropped"]  # label_multiclass 0, 1, 2

def shares(frame):
    c = frame.label_multiclass.value_counts(normalize=True)
    return [round(float(c.get(i, 0)), 4) for i in range(3)]

def buckets(col, edges, names):
    cut = pd.cut(d[col], edges, labels=names, include_lowest=True)
    out = []
    for n in names:
        sub = d[cut == n]
        out.append({"label": n, "n": int(len(sub)), "shares": shares(sub)})
    return out

metrics = {
    "login_frequency": {
        "title": "Logins per week",
        "blurb": "How often a student opens the platform in a week.",
        "buckets": buckets("login_frequency", [0, 1, 2, 4, 6, 100], ["Up to 1", "1 to 2", "2 to 4", "4 to 6", "Over 6"]),
    },
    "completion_rate": {
        "title": "Course completion",
        "blurb": "Share of course work finished.",
        "buckets": buckets("completion_rate", [-0.01, 0.1, 0.2, 0.35, 0.5, 1.0], ["Under 10%", "10 to 20%", "20 to 35%", "35 to 50%", "Over 50%"]),
    },
    "forum_posts_count": {
        "title": "Forum posts",
        "blurb": "Posts in the course community.",
        "buckets": buckets("forum_posts_count", [-1, 0, 2, 5, 100], ["None", "1 to 2", "3 to 5", "More than 5"]),
    },
    "last_activity_days_ago": {
        "title": "Days since last activity",
        "blurb": "How long a student has been silent.",
        "buckets": buckets("last_activity_days_ago", [0, 3, 7, 14, 30, 400], ["1 to 3 days", "4 to 7 days", "8 to 14 days", "15 to 30 days", "Over 30 days"]),
    },
}

# Effect of simple context factors
context = {
    "exam_season": [
        {"label": "Outside exam season", "n": int((d.exam_season == 0).sum()), "shares": shares(d[d.exam_season == 0])},
        {"label": "Exam season", "n": int((d.exam_season == 1).sum()), "shares": shares(d[d.exam_season == 1])},
    ],
    "courses_enrolled": [
        {"label": f"{k} course" + ("s" if k > 1 else ""), "n": int(len(g)), "shares": shares(g)}
        for k, g in d.groupby("courses_enrolled")
    ],
}

# Which columns relate most to dropping out (absolute correlation with the 3-level label)
cols = ["login_frequency", "completion_rate", "completed_assignments", "forum_posts_count", "last_activity_days_ago",
        "exam_season", "courses_enrolled", "age"]
corr = [{"feature": c, "r": round(float(d[c].corr(d.label_multiclass)), 3)} for c in cols]
corr.sort(key=lambda x: -abs(x["r"]))

# A small, readable model for the habit checker: 3 inputs a LSync user can also produce.
feat = ["login_frequency", "completion_rate", "forum_posts_count"]
X = d[feat].astype(float)
mu, sd = X.mean(), X.std()
Z = (X - mu) / sd
model = LogisticRegression(max_iter=3000)
acc = float(cross_val_score(model, Z, d.label_multiclass, cv=5).mean())
model.fit(Z, d.label_multiclass)

out = {
    "source": "EdTech dropout dataset supplied to the group (5,000 students, 10 cities, enrolled 2024)",
    "total": int(len(d)),
    "labels": LABELS,
    "overall": shares(d),
    "means": {l: {c: round(float(d[d.label_multiclass == i][c].mean()), 2) for c in ["login_frequency", "completion_rate", "forum_posts_count", "last_activity_days_ago"]} for i, l in enumerate(LABELS)},
    "metrics": metrics,
    "context": context,
    "correlation": corr,
    "model": {
        "features": feat,
        "mean": [round(float(v), 4) for v in mu],
        "std": [round(float(v), 4) for v in sd],
        "coef": [[round(float(v), 4) for v in row] for row in model.coef_],
        "intercept": [round(float(v), 4) for v in model.intercept_],
        "cvAccuracy": round(acc, 3),
        "ranges": {"login_frequency": [0, 14], "completion_rate": [0, 1], "forum_posts_count": [0, 24]},
    },
}
dest = root / "src" / "lib" / "data" / "edtech-insights.json"
dest.write_text(json.dumps(out, indent=1))
print("wrote", dest, "| model cross-validated accuracy", round(acc, 3))
