# in analytics/management/commands/export_transactions.py

import csv
from django.core.management.base import BaseCommand
from transactions.models import Transaction # Make sure this import path is correct

class Command(BaseCommand):
    help = 'Exports all transactions from the database to a CSV file.'

    def add_arguments(self, parser):
        # Add an argument to specify the output file path
        parser.add_argument('output_path', type=str, help='D:/transactions.csv')

    def handle(self, *args, **kwargs):
        output_path = kwargs['output_path']
        self.stdout.write(f"Starting export of transactions to {output_path}...")

        # Fetch all transaction objects from the database
        transactions = Transaction.objects.all()
        
        # Check if there are any transactions
        if not transactions.exists():
            self.stdout.write(self.style.WARNING("No transactions found in the database."))
            return

        # Open the file for writing
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)

            # Write the header row
            writer.writerow(['id', 'user_id', 'date', 'type', 'category', 'amount', 'description'])

            # Write data rows
            for tx in transactions:
                formatted_date = tx.date.strftime('%Y-%m-%d') if tx.date else ''
                writer.writerow([
                    tx.id,
                    tx.user.id,
                    formatted_date,
                    tx.type,
                    tx.category,
                    tx.amount,
                    tx.description
                ])

        self.stdout.write(self.style.SUCCESS(f"Successfully exported {transactions.count()} transactions to {output_path}"))