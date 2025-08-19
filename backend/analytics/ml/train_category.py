import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
from django.conf import settings
from transactions.models import Transaction

def train_and_save():
    
    qs = Transaction.objects.all().values('user_id', 'date', 'type', 'category', 'amount')
    df = pd.DataFrame(qs)
    if df.empty:
        print("No transaction data found.")
        return
    df['amount'] = df['amount'].astype(float)
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
    df['expense'] = df.apply(lambda r: r['amount'] if r['type'] == 'expense' else 0, axis=1)

    
    monthly_cat = df.groupby(['user_id', 'month', 'category']).agg(
        expense_total=('expense', 'sum'),
        num_tx=('amount', 'count'),
        avg_tx=('amount', 'mean')
    ).reset_index()

    
    monthly_cat = monthly_cat.sort_values(['user_id', 'category', 'month'])
    for lag in (1, 2, 3):
        monthly_cat[f'lag_exp_{lag}'] = monthly_cat.groupby(['user_id', 'category'])['expense_total'].shift(lag)

    monthly_cat['month_num'] = monthly_cat['month'].dt.month
    monthly_cat = monthly_cat.dropna()

    if monthly_cat.empty:
        print("Not enough data for training category-wise forecast.")
        return

    X = monthly_cat[['month_num', 'lag_exp_1', 'lag_exp_2', 'lag_exp_3', 'num_tx', 'avg_tx']]
    y = monthly_cat['expense_total']

 
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

   
    path = settings.BASE_DIR / 'analytics' / 'ml_models' / 'decision_tree_category.joblib'
    joblib.dump(model, path)
    print(f"Category forecast model saved to {path}")
