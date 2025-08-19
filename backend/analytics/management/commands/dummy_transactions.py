import random
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.db import connection
from transactions.models import Transaction
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'A brief description of what this command does.'

    def handle(self, *args, **kwargs):
    # --- Configuration ---
    # Change this ID to match the user you are testing with
        USER_ID = 3 
    # -------------------

        User = get_user_model()
        try:
            user = User.objects.get(pk=USER_ID)
        except User.DoesNotExist:
            print(f"ERROR: User with ID {USER_ID} not found. Please change the USER_ID variable.")
            exit()


        # 1. --- Deleting old data and resetting the ID counter for PostgreSQL ---
        print(f"Resetting all transactions for user: {user.username}...")
        with connection.cursor() as cursor:
            # This single command deletes all rows and resets the auto-incrementing ID.
            cursor.execute("TRUNCATE TABLE transactions_transaction RESTART IDENTITY CASCADE;")
        print("All old transactions have been deleted and the ID counter is reset to 1.")


        # 2. --- Creating new sample data ---
        print("Creating new sample data from January to August...")
        expense_categories = ["Bills & Utilities", "Entertainment", "Food", "Health", "Shopping", "Transportation", "Other"]
        today = date.today()
        current_year = today.year

        # Loop from January (1) up to the current month
        for month_num in range(1, today.month + 1): 
            # Add one 'Salary' (income) transaction on the 1st of each month
            Transaction.objects.create(
                user=user,
                date=date(current_year, month_num, 1),
                type='income',
                category='Salary',
                amount=random.randint(50000, 75000),
                description='Monthly Salary'
            )
    
            # Determine the last day to generate expenses for
            last_day_for_expenses = today.day - 1 if month_num == today.month else 28

            if last_day_for_expenses >= 1:
                # Add 15-20 random expense transactions per month
                for _ in range(random.randint(15, 20)):
                    random_day = random.randint(1, last_day_for_expenses)
                    Transaction.objects.create(
                        user=user,
                        date=date(current_year, month_num, random_day),
                        type='expense',
                        category=random.choice(expense_categories),
                        amount=random.randint(500, 5000),
                        description='Sample expense'
                    )
            print(f"Generated data for month: {month_num}/{current_year}")
            print("\nSUCCESS: Sample data has been created.")
            print("You can now retrain your models and check the analytics page.")

            self.stdout.write(self.style.SUCCESS('Successfully completed the task.'))