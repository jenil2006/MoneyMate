import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
from django.conf import settings
from transactions.models import Transaction

def train_and_save():
    qs = Transaction.objects.all().values('user_id', 'date', 'type', 'amount')
    df = pd.DataFrame(qs)
    if df.empty:
        print("No transaction data found.")
        return
    df['amount'] = df['amount'].astype(float)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['user_id', 'date'])
    slopes = {}

    for user_id, group in df.groupby('user_id'):
        if len(group) < 6:
            continue

        
        group = group.reset_index(drop=True)
        X = np.array(range(len(group))).reshape(-1, 1)
        y = group['amount'].values

        model = LinearRegression()
        model.fit(X, y)
        slopes[user_id] = model.coef_[0]

    if not slopes:
        print("Not enough data for training.")
        return

    path = settings.BASE_DIR / 'analytics' / 'ml_models' / 'spending_pattern_slopes.joblib'
    joblib.dump(slopes, path)
    print(f"Spending pattern slopes saved to {path}")
