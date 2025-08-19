import pandas as pd
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
    df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
    df['expense'] = df.apply(lambda r: r['amount'] if r['type'] == 'expense' else 0, axis=1)
    monthly = df.groupby(['user_id', 'month']).agg(
        expense_total=('expense', 'sum'),
        num_tx=('amount', 'count'),
        avg_tx=('amount', 'mean')
    ).reset_index()

    
    monthly = monthly.sort_values(['user_id', 'month'])
    for lag in (1, 2, 3):
        monthly[f'lag_exp_{lag}'] = monthly.groupby('user_id')['expense_total'].shift(lag)

    monthly['month_num'] = monthly['month'].dt.month
    monthly = monthly.dropna()

    if monthly.empty:
        print("Not enough data for training.")
        return

    X = monthly[['month_num', 'lag_exp_1', 'lag_exp_2', 'lag_exp_3', 'num_tx', 'avg_tx']]
    y = monthly['expense_total']

    
    model = LinearRegression()
    model.fit(X, y)

    
    path = settings.BASE_DIR / 'analytics' / 'ml_models' / 'linear_next_month.joblib'
    joblib.dump(model, path)
    print(f"Model saved to {path}")
