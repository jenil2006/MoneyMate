import pandas as pd
from sklearn.ensemble import RandomForestRegressor
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
    df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()

    
    monthly = df.groupby(['user_id', 'month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
    monthly['savings'] = monthly.get('income', 0) - monthly.get('expense', 0)
    monthly['month_num'] = monthly['month'].dt.month

    
    monthly = monthly.sort_values(['user_id', 'month'])
    for lag in (1, 2, 3):
        monthly[f'lag_save_{lag}'] = monthly.groupby('user_id')['savings'].shift(lag)

    monthly = monthly.dropna()

    if monthly.empty:
        print("Not enough data for training saving estimation.")
        return

    X = monthly[['month_num', 'lag_save_1', 'lag_save_2', 'lag_save_3']]
    y = monthly['savings']

    model = RandomForestRegressor(n_estimators=50, max_depth=4, random_state=42)
    model.fit(X, y)

    
    path = settings.BASE_DIR / 'analytics' / 'ml_models' / 'decision_tree_saving.joblib'
    joblib.dump(model, path)
    print(f"Saving estimation model saved to {path}")
