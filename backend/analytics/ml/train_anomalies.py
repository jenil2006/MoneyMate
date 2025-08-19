import pandas as pd
import joblib
from django.conf import settings
from transactions.models import Transaction

def train_and_save():
    qs = Transaction.objects.filter(type='expense').values('user_id', 'date', 'amount')
    df = pd.DataFrame(qs)

    if df.empty:
        print("No transaction data found.")
        return

    
    df['amount'] = df['amount'].astype(float)

    
    stats = {}
    for user_id, group in df.groupby('user_id'):
        if len(group) < 3:  
            continue
        mean = group['amount'].mean()
        std = group['amount'].std()
        if pd.isna(std) or std == 0:
            continue
        stats[user_id] = {'mean': mean, 'std': std}

    if not stats:
        print("Not enough data for training.")
        return

    path = settings.BASE_DIR / 'analytics' / 'ml_models' / 'anomaly_stats.joblib'
    joblib.dump(stats, path)
    print(f"Anomaly stats saved to {path}")
