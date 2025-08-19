from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import json
import joblib
import pandas as pd
import numpy as np
from django.conf import settings
from transactions.models import Transaction
from datetime import datetime, timedelta,date
from django.db.models import Sum, Count, Avg
from django.db import models
from django.db.models.functions import TruncMonth
import os,random
# from django.core.cache import cache


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    # user = request.user
    # cache_key = f'analytics_data_{user.id}'
    # cached_data = cache.get(cache_key)
    # if cached_data:
    #     return Response(cached_data)
    try:
        user = request.user
        
        # Get user's transaction data
        transactions = Transaction.objects.filter(user=user)
        
        if not transactions.exists():
            # Return empty data structure instead of error
            return Response({
                'next_month_prediction': None,
                'category_forecast': {},
                'savings_prediction': None,
                'anomalies': [],
                'monthly_trends': [],
                'current_spending': [],
                'savings_over_time': [],
                'insights': []
            })
        
        # Load ML models
        models_dir = settings.BASE_DIR / 'analytics' / 'ml_models'
        
        # Next month prediction
        next_month_pred = _get_next_month_prediction(user.id, models_dir)
        
        # Category forecast
        category_forecast = _get_category_forecast(user.id, models_dir)
        
        # Savings prediction
        savings_pred = _get_savings_prediction(user.id, models_dir)
        
        # Anomaly detection
        anomalies = _get_anomalies(user.id, models_dir)
        
        # Monthly trends
        monthly_trends = _get_monthly_trends(user.id,models_dir)
        
        # Current month spending by category
        current_spending = _get_current_month_spending(user.id)
        
        # Savings over time
        savings_model = joblib.load(models_dir / 'decision_tree_saving.joblib')
        savings_over_time = _get_savings_over_time(user.id,savings_model)
        
        # Smart insights
        insights = _generate_insights(user.id, anomalies, category_forecast)
        
        response_data = {
            'next_month_prediction': next_month_pred,
            'category_forecast': category_forecast or {},
            'savings_prediction': savings_pred,
            'anomalies': anomalies or [],
            'monthly_trends': monthly_trends or [],
            'current_spending': current_spending or [],
            'savings_over_time': savings_over_time or [],
            'insights': insights or []
        }
        
        # Cache the data for 1 hour
        # cache.set(cache_key, response_data, timeout=3600)

        return Response(response_data)
        
    except Exception as e:
        print(f"Analytics error: {e}")
        # Return default data structure on error
        return Response({
            'next_month_prediction': 35000,
            'category_forecast': {},
            'savings_prediction': 12000,
            'anomalies': [],
            'monthly_trends': [],
            'current_spending': [],
            'savings_over_time': [],
            'insights': []
        })

def _get_next_month_prediction(user_id, models_dir):
    """
    Predicts the total expense for the next month by replicating the training logic.
    """
    try:
        model = joblib.load(models_dir / 'linear_next_month.joblib')
        
        # 1. Fetch the last 4 months of transaction data to calculate 3 lags.
        four_months_ago = datetime.now() - timedelta(days=120)
        qs = Transaction.objects.filter(
            user_id=user_id,
            date__gte=four_months_ago
        ).values('date', 'type', 'amount')

        if not qs:
            return None

        # 2. Process data using pandas, exactly like in the training script.
        df = pd.DataFrame(list(qs))
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
        df['expense'] = df.apply(lambda r: r['amount'] if r['type'] == 'expense' else 0, axis=1)

        monthly = df.groupby('month').agg(
            expense_total=('expense', 'sum'),
            num_tx=('amount', 'count'),
            avg_tx=('amount', 'mean')
        ).reset_index().sort_values('month', ascending=False)
        
        # 3. Check if we have enough historical data (at least 3 previous months).
        if len(monthly) < 3:
            return None

        # 4. Create the feature DataFrame with the aggregated monthly data.
        feature_data = {
            'month_num': [datetime.now().month],
            'lag_exp_1': [monthly.iloc[0]['expense_total']], # Most recent month's total
            'lag_exp_2': [monthly.iloc[1]['expense_total']], # 2nd most recent month's total
            'lag_exp_3': [monthly.iloc[2]['expense_total']], # 3rd most recent month's total
            'num_tx': [monthly.iloc[0]['num_tx']],
            'avg_tx': [monthly.iloc[0]['avg_tx']]
        }
        features_df = pd.DataFrame(feature_data)

        # 5. Predict.
        prediction = model.predict(features_df)[0]
        return max(0, prediction)

    except Exception as e:
        print(f"Error in next month prediction: {e}")
        return None

def _get_category_forecast(user_id, models_dir):
    """
    Predicts the next month's expense for each category.
    """
    try:
        model = joblib.load(models_dir / 'decision_tree_category.joblib')
        four_months_ago = datetime.now() - timedelta(days=120)
        
        # Get all recent transactions to find distinct categories and process them.
        qs = Transaction.objects.filter(
            user_id=user_id,
            type='expense',
            date__gte=four_months_ago
        ).values('date', 'category', 'amount')

        if not qs:
            return {}

        df = pd.DataFrame(list(qs))
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()

        forecasts = {}
        # Loop through each category the user has spent on.
        for category_name in df['category'].unique():
            cat_df = df[df['category'] == category_name]

            # Aggregate monthly data for this specific category.
            monthly_cat = cat_df.groupby('month').agg(
                expense_total=('amount', 'sum'),
                num_tx=('amount', 'count'),
                avg_tx=('amount', 'mean')
            ).reset_index().sort_values('month', ascending=False)
            
            # Check for enough data for this category.
            if len(monthly_cat) < 3:
                continue # Skip if not enough historical data for this category

            # Create features for this category.
            feature_data = {
                'month_num': [datetime.now().month],
                'lag_exp_1': [monthly_cat.iloc[0]['expense_total']],
                'lag_exp_2': [monthly_cat.iloc[1]['expense_total']],
                'lag_exp_3': [monthly_cat.iloc[2]['expense_total']],
                'num_tx': [monthly_cat.iloc[0]['num_tx']],
                'avg_tx': [monthly_cat.iloc[0]['avg_tx']]
            }
            features_df = pd.DataFrame(feature_data)
            
            # Predict and store the forecast for this category.
            prediction = model.predict(features_df)[0]
            forecasts[category_name] = max(0, prediction)

        return forecasts
        
    except Exception as e:
        print(f"Error in category forecast: {e}")
        return {}

def _get_savings_prediction(user_id, models_dir):
    """
    Predicts the savings for the next month.
    """
    try:
        model = joblib.load(models_dir / 'decision_tree_saving.joblib')
        
        four_months_ago = datetime.now() - timedelta(days=120)
        qs = Transaction.objects.filter(
            user_id=user_id,
            date__gte=four_months_ago
        ).values('date', 'type', 'amount')

        if not qs:
            return None

        df = pd.DataFrame(list(qs))
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()

        # Unstack to get income and expense columns.
        monthly = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
        monthly['savings'] = monthly.get('income', 0) - monthly.get('expense', 0)
        monthly = monthly.sort_values('month', ascending=False)

        if len(monthly) < 3:
            return None

        # Create features using monthly savings lags.
        feature_data = {
            'month_num': [datetime.now().month],
            'lag_save_1': [monthly.iloc[0]['savings']],
            'lag_save_2': [monthly.iloc[1]['savings']],
            'lag_save_3': [monthly.iloc[2]['savings']]
        }
        features_df = pd.DataFrame(feature_data)

        prediction = model.predict(features_df)[0]
        return prediction
        
    except Exception as e:
        print(f"Error in savings prediction: {e}")
        return None

def _get_anomalies(user_id, models_dir):
    try:
        model_path = models_dir / 'anomaly_stats.joblib'
        if not os.path.exists(model_path):
            return []
        
        stats = joblib.load(model_path)
        if user_id not in stats:
            return []
        
        user_stats = stats[user_id]
        mean = user_stats['mean']
        std = user_stats['std']
        
        # Get recent transactions
        recent_transactions = Transaction.objects.filter(
            user_id=user_id,
            type='expense'
        ).order_by('-date')[:50]
        
        anomalies = []
        for tx in recent_transactions:
            amount = float(tx.amount)
            z_score = abs((amount - mean) / std) if std > 0 else 0
            
            if z_score > 2:  
                anomalies.append({
                    'category': tx.category,
                    'amount': amount,
                    'date': tx.date.strftime('%Y-%m-%d'),
                    'severity': 'high' if z_score > 3 else 'medium'
                })
        
        return anomalies
        
    except Exception as e:
        print(f"Error in anomaly detection: {e}")
        return []





# def _get_monthly_trends(user_id, models_dir):
#     """
#     Performs a backtest for historical monthly expenses and adds a forecast for the next month.
#     """
#     try:
#         model = joblib.load(models_dir / 'linear_next_month.joblib')
        
#         # 1. Get all historical transactions
#         qs = Transaction.objects.filter(user_id=user_id).values('date', 'type', 'amount')
#         if not qs:
#             return []

#         df = pd.DataFrame(list(qs))
#         df['amount'] = df['amount'].astype(float)
#         df['date'] = pd.to_datetime(df['date'])
#         df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
#         df['expense'] = df.apply(lambda r: r['amount'] if r['type'] == 'expense' else 0, axis=1)

#         # 2. Aggregate into monthly summaries, sorted oldest to newest
#         monthly = df.groupby('month').agg(
#             expense_total=('expense', 'sum'),
#             num_tx=('amount', 'count'),
#             avg_tx=('amount', 'mean')
#         ).reset_index().sort_values('month', ascending=True)
#         monthly['month_num'] = monthly['month'].dt.month
#         monthly.reset_index(drop=True, inplace=True)
        
#         results = []
#         # 3. Loop through ALL historical months to build the backtest
#         for i in range(len(monthly)):
#             month_data = {
#                 'month': monthly.iloc[i]['month'].strftime('%b'),
#                 'actual': monthly.iloc[i]['expense_total'],
#                 'predicted': None  # Default predicted to None
#             }

#             # If we have at least 3 previous months, we can make a prediction for this month
#             if i >= 3:
#                 feature_data = {
#                     'month_num': [monthly.iloc[i]['month_num']],
#                     'lag_exp_1': [monthly.iloc[i-1]['expense_total']],
#                     'lag_exp_2': [monthly.iloc[i-2]['expense_total']],
#                     'lag_exp_3': [monthly.iloc[i-3]['expense_total']],
#                     'num_tx': [monthly.iloc[i-1]['num_tx']],
#                     'avg_tx': [monthly.iloc[i-1]['avg_tx']]
#                 }
#                 features_df = pd.DataFrame(feature_data)
#                 prediction = model.predict(features_df)[0]
#                 month_data['predicted'] = max(0, prediction)
            
#             results.append(month_data)
        
#         # 4. Add the single FORECAST for the NEXT month
#         if len(monthly) >= 3:
#             last_3 = monthly.tail(3)
#             next_month_num = (last_3.iloc[2]['month'].month % 12) + 1 # Get next month's number
            
#             feature_data = {
#                 'month_num': [next_month_num],
#                 'lag_exp_1': [last_3.iloc[2]['expense_total']],
#                 'lag_exp_2': [last_3.iloc[1]['expense_total']],
#                 'lag_exp_3': [last_3.iloc[0]['expense_total']],
#                 'num_tx': [last_3.iloc[2]['num_tx']],
#                 'avg_tx': [last_3.iloc[2]['avg_tx']]
#             }
#             features_df = pd.DataFrame(feature_data)
#             prediction = model.predict(features_df)[0]
            
#             results.append({
#                 'month': datetime(2025, next_month_num, 1).strftime('%b'),
#                 'actual': None,
#                 'predicted': max(0, prediction)
#             })

#         return results
        
#     except Exception as e:
#         print(f"Error in monthly trends backtest: {e}")
#         return []



def _get_monthly_trends(user_id, models_dir):
    try:
        model = joblib.load(models_dir / 'linear_next_month.joblib')
        
        # ... (data fetching and processing logic at the top is the same) ...
        qs = Transaction.objects.filter(user_id=user_id).values('date', 'type', 'amount')
        if not qs: return []
        df = pd.DataFrame(list(qs))
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
        df['expense'] = df.apply(lambda r: r['amount'] if r['type'] == 'expense' else 0, axis=1)
        monthly = df.groupby('month').agg(expense_total=('expense', 'sum'), num_tx=('amount', 'count'), avg_tx=('amount', 'mean')).reset_index().sort_values('month', ascending=True)
        monthly['month_num'] = monthly['month'].dt.month
        monthly.reset_index(drop=True, inplace=True)
        
        results = []
        # The logic now only appends to results if a prediction can be made
        if len(monthly) >= 4:
            for i in range(3, len(monthly)):
                feature_data = {
                    'month_num': [monthly.iloc[i]['month_num']],
                    'lag_exp_1': [monthly.iloc[i-1]['expense_total']],
                    'lag_exp_2': [monthly.iloc[i-2]['expense_total']],
                    'lag_exp_3': [monthly.iloc[i-3]['expense_total']],
                    'num_tx': [monthly.iloc[i-1]['num_tx']],
                    'avg_tx': [monthly.iloc[i-1]['avg_tx']]
                }
                features_df = pd.DataFrame(feature_data)
                prediction = model.predict(features_df)[0]
                
                
                results.append({
                    'month': monthly.iloc[i]['month'].strftime('%b'),
                    'actual': monthly.iloc[i]['expense_total'],
                    'predicted': max(0, prediction)
                })
        
        
        
        return results
        
    except Exception as e:
        print(f"Error in monthly trends backtest: {e}")
        return []


def _get_current_month_spending(user_id):
    try:
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        category_data = Transaction.objects.filter(
            user_id=user_id,
            date__month=current_month,
            date__year=current_year,
            type='expense'
        ).values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        spending_data = []
        colors = [
    '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16',
    '#EC4899', '#3B82F6', '#6366F1', '#F97316'
]
        
        for i, item in enumerate(category_data):
            spending_data.append({
                'name': item['category'],
                'value': float(item['total']),
                'color': colors[i % len(colors)]
            })
        
        return spending_data
        
    except Exception as e:
        print(f"Error in current spending: {e}")
        return []






# def _get_savings_over_time(user_id, model):
#     """
#     Performs a backtest showing the FULL history. The first 3 months will
#     only have 'actual' data, and predictions will start from the 4th month.
#     """
#     try:
#         qs = Transaction.objects.filter(user_id=user_id).values('date', 'type', 'amount')
#         if not qs: return []

#         df = pd.DataFrame(list(qs))
#         df['amount'] = df['amount'].astype(float)
#         df['date'] = pd.to_datetime(df['date'])
#         df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()

#         monthly = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
#         monthly['savings'] = monthly.get('income', 0) - monthly.get('expense', 0)
#         monthly['month_num'] = monthly['month'].dt.month
#         monthly = monthly.sort_values('month', ascending=True).reset_index(drop=True)
        
#         results = []
#         # Loop through ALL historical months
#         for i in range(len(monthly)):
#             month_data = {
#                 'month': monthly.iloc[i]['month'].strftime('%b'),
#                 'actual': monthly.iloc[i]['savings'],
#                 'predicted': None  # Default predicted to None
#             }

#             # If we have at least 3 previous months, we can make a prediction
#             if i >= 3:
#                 feature_data = {
#                     'month_num': [monthly.iloc[i]['month_num']],
#                     'lag_save_1': [monthly.iloc[i-1]['savings']],
#                     'lag_save_2': [monthly.iloc[i-2]['savings']],
#                     'lag_save_3': [monthly.iloc[i-3]['savings']]
#                 }
#                 features_df = pd.DataFrame(feature_data)
#                 prediction = model.predict(features_df)[0]
#                 month_data['predicted'] = prediction
            
#             results.append(month_data)
        
#         return results
        
#     except Exception as e:
#         print(f"Error in savings over time backtest: {e}")
#         return []


def _get_savings_over_time(user_id, model):
    """
    Performs a backtest to show historical actual savings vs. predicted savings.
    """
    try:
        qs = Transaction.objects.filter(user_id=user_id).values('date', 'type', 'amount')
        if not qs:
            return []

        df = pd.DataFrame(list(qs))
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()

        monthly = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
        monthly['savings'] = monthly.get('income', 0) - monthly.get('expense', 0)
        monthly['month_num'] = monthly['month'].dt.month
        monthly = monthly.sort_values('month', ascending=True).reset_index(drop=True)
        
        results = []
        if len(monthly) >= 4:
            for i in range(3, len(monthly)):
                feature_data = {
                    'month_num': [monthly.iloc[i]['month_num']],
                    'lag_save_1': [monthly.iloc[i-1]['savings']],
                    'lag_save_2': [monthly.iloc[i-2]['savings']],
                    'lag_save_3': [monthly.iloc[i-3]['savings']]
                }
                features_df = pd.DataFrame(feature_data)
                
                prediction = model.predict(features_df)[0]
                

                results.append({
                    'month': monthly.iloc[i]['month'].strftime('%b'),
                    'actual': monthly.iloc[i]['savings'],
                    'predicted': prediction
                })
        
        return results
        
    except Exception as e:
        print(f"Error in savings over time backtest: {e}")
        return []



# in analytics/views.py

def _generate_insights(user_id, anomalies, category_forecast):
    try:
        # We will generate all possible insights first, then intelligently select them.
        potential_warnings = []
        potential_positives = []
        potential_info = []

        models_dir = settings.BASE_DIR / 'analytics' / 'ml_models'

        # --- Generate Potential Warnings ---
        # 1. Anomalies
        if anomalies:
            for anomaly in anomalies[:2]:
                potential_warnings.append({
                    'type': 'warning', 'title': f'Unusual Spending in {anomaly["category"]}',
                    'description': f'A transaction of ₹{anomaly["amount"]:,.0f} was much higher than your usual spending in this category.',
                    
                })
        
        # 2. Savings Rate
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        recent_expenses = Transaction.objects.filter(user_id=user_id, type='expense', date__gte=thirty_days_ago).aggregate(total=Sum('amount'))['total'] or 0
        recent_income = Transaction.objects.filter(user_id=user_id, type='income', date__gte=thirty_days_ago).aggregate(total=Sum('amount'))['total'] or 0
        
        if recent_income > 0:
            savings_rate = ((recent_income - recent_expenses) / recent_income) * 100
            if savings_rate < 10:
                potential_warnings.append({
                    'type': 'warning', 'title': 'Low Savings Rate',
                    'description': f'Your savings rate in the last 30 days was only {savings_rate:.1f}%. Consider reviewing your budget to increase this.',
                    
                })
            elif savings_rate > 20:
                potential_positives.append({
                    'type': 'positive', 'title': 'Excellent Savings Rate',
                    'description': f'Great job! Your savings rate in the last 30 days was {savings_rate:.1f}%. You are building a strong financial foundation.',
                    
                })

        # --- Generate Potential Positives & Info ---
        # 3. Budget Discipline
        try:
            slopes_model = joblib.load(models_dir / 'spending_pattern_slopes.joblib')
            user_slope = slopes_model.get(user_id, 0)
            if user_slope > 5:
                potential_info.append({ # A rising trend is informational
                    'type': 'info', 'title': 'Spending Trend',
                    'description': 'Your overall spending has been trending upwards recently. Keep an eye on your budget.',
                    
                })
            elif user_slope < -5:
                 potential_positives.append({
                    'type': 'positive', 'title': 'Great Discipline',
                    'description': 'Your spending has been trending downwards. Excellent work on managing your budget!',
                    
                })
        except Exception:
            pass

        # 4. Forecasts
        if category_forecast:
            sorted_forecast = sorted(category_forecast.items(), key=lambda item: item[1], reverse=True)
            for category, prediction in sorted_forecast[:1]: # Show only the top forecast
                potential_info.append({
                    'type': 'info', 'title': f'Forecast: {category}',
                    'description': f'We predict your spending on {category} next month will be around ₹{prediction:,.0f}.',
                    
                })

        # --- Assemble the Final Insights List ---
        final_insights = []
        
        # 1. Add all warnings first. They are the most important.
        final_insights.extend(potential_warnings)
        
        # 2. ONLY if there are NO warnings, add the positive insights.
        if not potential_warnings:
            final_insights.extend(potential_positives)
        
        # 3. Fill the remaining space with informational insights.
        slots_left = 6 - len(final_insights)
        if slots_left > 0:
            final_insights.extend(potential_info[:slots_left])

        # 4. If there's still space, add a generic tip.
        if len(final_insights) < 6:
            final_insights.append({
                'type': 'info', 'title': 'Savings Opportunity',
                'description': 'Consider setting aside 20% of your income for an emergency fund.',
                
            })

        return final_insights[:6]
        
    except Exception as e:
        print(f"Error in generating insights: {e}")
        return []






# def _get_investment_plan(user_id, models_dir):
#     """
#     Generates a personalized investment plan using existing ML models.
#     """
#     try:
#         # Step 1: Predict the user's investable surplus using the savings model
#         investable_surplus = _get_savings_prediction(user_id, models_dir)
#         if investable_surplus is None or investable_surplus <= 0:
#             return {'error': 'No investable surplus predicted.'}

#         # Step 2: Infer the user's risk profile using the spending pattern model
#         slopes_model = joblib.load(models_dir / 'spending_pattern_slopes.joblib')
#         user_slope = slopes_model.get(user_id, 0)
        
#         risk_profile = "Moderate"
#         if user_slope > 5: # Threshold for increasing spending
#             risk_profile = "Aggressive"
#         elif user_slope < -5: # Threshold for decreasing spending
#             risk_profile = "Conservative"

#                 six_months_ago = datetime.now() - timedelta(days=180)
#         qs = Transaction.objects.filter(user_id=user_id, date__gte=six_months_ago).values('date', 'type', 'amount')
#         df = pd.DataFrame(list(qs))
        
#         justification = f"Your spending patterns suggest a '{risk_profile}' risk profile. "
#         dynamic_adjustment = 0.0 # This will shift allocation towards higher or lower risk

#         if not df.empty and len(df) > 10:
#             df['amount'] = df['amount'].astype(float)
#             df['date'] = pd.to_datetime(df['date'])
#             df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
#             monthly = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
#             monthly['savings'] = monthly.get('income', 0) - monthly.get('expense', 0)
            
#             # Analyze savings trend
#             if len(monthly) >= 3:
#                 recent_savings = monthly['savings'].tail(3).mean()
#                 older_savings = monthly['savings'].head(3).mean()
#                 if recent_savings > older_savings * 1.1: # 10% increase
#                     dynamic_adjustment += 0.05 # Shift 5% towards higher risk
#                     justification += "Because your savings have been increasing, we've suggested a more growth-focused portfolio. "

#             # Analyze expense-to-income ratio
#             total_income = monthly['income'].sum()
#             total_expense = monthly['expense'].sum()
#             if total_income > 0:
#                 ratio = total_expense / total_income
#                 if ratio < 0.5: # Spending less than 50% of income
#                     dynamic_adjustment += 0.05 # Shift 5% towards higher risk
#                     justification += "Your low expense-to-income ratio allows for more growth opportunities. "
#                 elif ratio > 0.8: # Spending more than 80% of income
#                     dynamic_adjustment -= 0.05 # Shift 5% towards lower risk
#                     justification += "Your high expense-to-income ratio suggests a more cautious approach for now. "

#         # Step 4: Define base allocations and apply dynamic adjustment
#         allocations = {
#             "Conservative": {'Low Risk': 0.7, 'Medium Risk': 0.2, 'High Risk': 0.1},
#             "Moderate": {'Low Risk': 0.4, 'Medium Risk': 0.4, 'High Risk': 0.2},
#             "Aggressive": {'Low Risk': 0.2, 'Medium Risk': 0.4, 'High Risk': 0.4},
#         }
        
#         final_allocation = allocations[risk_profile].copy()
#         # Apply the adjustment, ensuring bounds are respected
#         final_allocation['High Risk'] = min(max(0, final_allocation['High Risk'] + dynamic_adjustment), 1)
#         final_allocation['Low Risk'] = min(max(0, final_allocation['Low Risk'] - dynamic_adjustment), 1)

#         # Step 5: Generate the portfolio
#         investment_options = { ... } # Same as before
#         recommended_portfolio = []
#         for risk_level, percentage in final_allocation.items():
#             if percentage > 0:
#                 # ... same logic as before to choose an option and create the recommendation ...

#         return {
#             'investable_surplus': investable_surplus,
#             'risk_profile': risk_profile,
#             'justification': justification, # <-- NEW: Add the justification text
#             'recommended_portfolio': recommended_portfolio
#         }

#         # Step 3: Define investment options and recommend a portfolio
#         investment_options = {
#             'Low Risk': [
#                 {'name': 'Fixed Deposit (FD)', 'return_pa': (6.5, 7.5)},
#                 {'name': 'Public Provident Fund (PPF)', 'return_pa': (7.0, 7.5)},
#             ],
#             'Medium Risk': [
#                 {'name': 'Mutual Funds (SIP)', 'return_pa': (12.0, 18.0)},
#                 {'name': 'Real Estate', 'return_pa': (8.0, 14.0)},
#             ],
#             'High Risk': [
#                 {'name': 'Direct Equity (Stocks)', 'return_pa': (15.0, 25.0)},
#                 {'name': 'Cryptocurrency', 'return_pa': (20.0, 100.0)},
#             ]
#         }
        
#         # Define portfolio allocations based on risk profile
#         allocations = {
#             "Conservative": {'Low Risk': 0.7, 'Medium Risk': 0.2, 'High Risk': 0.1},
#             "Moderate": {'Low Risk': 0.4, 'Medium Risk': 0.4, 'High Risk': 0.2},
#             "Aggressive": {'Low Risk': 0.2, 'Medium Risk': 0.4, 'High Risk': 0.4},
#         }

#         user_allocation = allocations[risk_profile]
#         recommended_portfolio = []
        
#         for risk_level, percentage in user_allocation.items():
#             amount_to_invest = investable_surplus * percentage
#             options_for_level = investment_options[risk_level]
            
#             # Simple logic to pick one option from each level for the recommendation
#             if options_for_level:
#                 chosen_option = random.choice(options_for_level)
#                 recommended_portfolio.append({
#                     'name': chosen_option['name'],
#                     'risk_level': risk_level,
#                     'expected_return': f"{chosen_option['return_pa'][0]}% - {chosen_option['return_pa'][1]}% p.a.",
#                     'allocated_amount': amount_to_invest
#                 })

#         return {
#             'investable_surplus': investable_surplus,
#             'risk_profile': risk_profile,
#             'recommended_portfolio': recommended_portfolio
#         }

#     except Exception as e:
#         print(f"Error in investment plan generation: {e}")
#         return {'error': 'Could not generate investment plan.'}

# This is the updated function for generating the investment plan structure.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import json
import joblib
import pandas as pd
import numpy as np
from django.conf import settings
from transactions.models import Transaction
from datetime import datetime, timedelta
from django.db.models import Sum
import os,random


def _get_savings_prediction(user_id, models_dir):
    """A helper function to predict savings. Ensure this is in your views.py."""
    try:
        model = joblib.load(models_dir / 'decision_tree_saving.joblib')
        four_months_ago = datetime.now() - timedelta(days=120)
        qs = Transaction.objects.filter(user_id=user_id, date__gte=four_months_ago).values('date', 'type', 'amount')
        if not qs: return 50000.0 # Default for demonstration
        df = pd.DataFrame(list(qs))
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M').dt.to_timestamp()
        monthly = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0).reset_index()
        monthly['savings'] = monthly.get('income', 0) - monthly.get('expense', 0)
        monthly = monthly.sort_values('month', ascending=False)
        if len(monthly) < 3: return 50000.0 # Default for demonstration
        feature_data = {
            'month_num': [datetime.now().month],
            'lag_save_1': [monthly.iloc[0]['savings']],
            'lag_save_2': [monthly.iloc[1]['savings']],
            'lag_save_3': [monthly.iloc[2]['savings']]
        }
        features_df = pd.DataFrame(feature_data)
        prediction = model.predict(features_df)[0]
        return prediction if prediction > 0 else 50000.0
    except Exception as e:
        print(f"Error in savings prediction: {e}")
        return 50000.0 # Default for demonstration

def _get_investment_plan(user_id, models_dir):
    """
    Generates a personalized investment plan with ALL available options for the user to choose from.
    """
    try:
        predicted_surplus = _get_savings_prediction(user_id, models_dir)
        if predicted_surplus <= 0:
            return {'error': 'Your predicted savings are not positive.'}

        slopes_model_path = models_dir / 'spending_pattern_slopes.joblib'
        risk_profile = "Moderate"
        if os.path.exists(slopes_model_path):
            slopes_model = joblib.load(slopes_model_path)
            user_slope = slopes_model.get(user_id, 0)
            if user_slope > 5: risk_profile = "Aggressive"
            elif user_slope < -5: risk_profile = "Conservative"

        justification = f"Based on your habits, we've identified your risk profile as '{risk_profile}'."

        # This dictionary now contains ALL options that will be sent to the frontend
        all_investment_options = {
            'Low Risk': [
                {'name': 'Fixed Deposit (FD)', 'return_pa': (6.5, 7.5), 'description': 'A safe option offered by banks with guaranteed returns. Good for capital preservation.'},
                {'name': 'Public Provident Fund (PPF)', 'return_pa': (7.0, 7.5), 'description': 'A long-term, government-backed savings scheme with tax benefits. Ideal for retirement planning.'},
            ],
            'Medium Risk': [
                {'name': 'Mutual Funds (SIP)', 'return_pa': (12.0, 18.0), 'description': 'Invest in a diversified portfolio of stocks or bonds managed by experts. SIPs allow for regular, disciplined investing.'},
                {'name': 'Real Estate', 'return_pa': (8.0, 14.0), 'description': 'Investing in property can provide rental income and long-term appreciation, but requires significant capital.'},
            ],
            'High Risk': [
                {'name': 'Direct Equity (Stocks)', 'return_pa': (15.0, 25.0), 'description': 'Buying shares of individual companies. Offers high growth potential but comes with higher volatility and risk.'},
                {'name': 'Gold', 'return_pa': (8.0, 12.0), 'description': 'A traditional safe-haven asset. Can be held physically or through Gold ETFs and Bonds to hedge against inflation.'},
            ]
        }
        
        # Define portfolio allocation percentages based on risk profile
        allocation_percentages = {
            "Conservative": {'Low Risk': 0.7, 'Medium Risk': 0.2, 'High Risk': 0.1},
            "Moderate": {'Low Risk': 0.4, 'Medium Risk': 0.4, 'High Risk': 0.2},
            "Aggressive": {'Low Risk': 0.2, 'Medium Risk': 0.4, 'High Risk': 0.4},
        }

        # The backend now sends the full list of options and the allocation rules
        return {
            'predicted_surplus': predicted_surplus,
            'risk_profile': risk_profile,
            'justification': justification,
            'allocation_percentages': allocation_percentages[risk_profile],
            'investment_options': all_investment_options 
        }

    except Exception as e:
        print(f"Error in investment plan generation: {e}")
        return {'error': 'Could not generate an investment plan at this time.'}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def investment_plan_view(request):
    user = request.user
    models_dir = settings.BASE_DIR / 'analytics' / 'ml_models'
    plan = _get_investment_plan(user.id, models_dir)
    
    if 'error' in plan:
        return Response(plan, status=400)
    
    return Response(plan)

