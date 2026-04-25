"""
Train a LightGBM ranker for connection recommendations.

Features per (user, candidate) pair:
  - same_college        : 1 if same college, else 0
  - same_branch         : 1 if same branch, else 0
  - shared_skills_count : number of skills in common
  - shared_interests_count : number of interests in common

Labels:
  - 1 = good match (positive sample)
  - 0 = poor match (negative sample)

Run this script from the backend root:
  python scripts/train_lgbm_recommender.py
"""

import os
import random
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "connection_ranker.txt")
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

COLLEGES = ["IIT Bombay", "IIT Delhi", "NIT Trichy", "BITS Pilani", "VIT Vellore"]
BRANCHES = ["CSE", "ECE", "Mechanical", "Civil", "EEE"]
SKILLS_POOL = ["Python", "Java", "React", "Machine Learning", "Docker", "AWS",
               "SQL", "Node.js", "Kotlin", "Flutter", "Figma", "DevOps"]
INTERESTS_POOL = ["AI/ML", "Web Dev", "Open Source", "Competitive Programming",
                  "Entrepreneurship", "Blockchain", "Data Science", "Gaming"]


def random_profile():
    return {
        "college": random.choice(COLLEGES),
        "branch": random.choice(BRANCHES),
        "skills": random.sample(SKILLS_POOL, k=random.randint(2, 6)),
        "interests": random.sample(INTERESTS_POOL, k=random.randint(1, 4)),
    }


def extract_features(user: dict, candidate: dict) -> list:
    same_college = int(user["college"] == candidate["college"])
    same_branch = int(user["branch"] == candidate["branch"])
    shared_skills = len(set(user["skills"]) & set(candidate["skills"]))
    shared_interests = len(set(user["interests"]) & set(candidate["interests"]))
    return [same_college, same_branch, shared_skills, shared_interests]


def build_dataset(n_users=500, candidates_per_user=20):
    X, y = [], []
    for _ in range(n_users):
        user = random_profile()
        for _ in range(candidates_per_user):
            candidate = random_profile()
            feats = extract_features(user, candidate)
            # Heuristic label: good match if strong overlap on >=2 dimensions
            score = feats[0] * 2 + feats[1] * 1.5 + feats[2] + feats[3]
            label = 1 if score >= 3 else 0
            X.append(feats)
            y.append(label)
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


def main():
    print("Building synthetic training dataset...")
    X, y = build_dataset()

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )

    dtrain = lgb.Dataset(X_train, label=y_train,
                         feature_name=["same_college", "same_branch",
                                       "shared_skills", "shared_interests"])
    dval = lgb.Dataset(X_val, label=y_val, reference=dtrain)

    params = {
        "objective": "binary",
        "metric": "binary_logloss",
        "boosting_type": "gbdt",
        "num_leaves": 15,
        "learning_rate": 0.05,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
        "seed": SEED,
    }

    print("Training LightGBM model...")
    callbacks = [lgb.early_stopping(stopping_rounds=20, verbose=False),
                 lgb.log_evaluation(period=50)]
    model = lgb.train(
        params,
        dtrain,
        num_boost_round=300,
        valid_sets=[dval],
        callbacks=callbacks,
    )

    model.save_model(MODEL_PATH)
    print(f"\n✅ Model trained and saved to: {MODEL_PATH}")
    print(f"   Best iteration : {model.best_iteration}")
    print(f"   Feature importance: {dict(zip(['same_college','same_branch','shared_skills','shared_interests'], model.feature_importance()))}")


if __name__ == "__main__":
    main()
