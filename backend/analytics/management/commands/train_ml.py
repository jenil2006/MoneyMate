from django.core.management.base import BaseCommand
from analytics.ml.train_next_month import train_and_save as train_next_month
from analytics.ml.train_category import train_and_save as train_category
from analytics.ml.train_saving import train_and_save as train_saving
from analytics.ml.train_anomalies import train_and_save as train_anomalies
from analytics.ml.train_spending_pattern import train_and_save as train_spending_pattern
class Command(BaseCommand):
    help = "Train ML models for analytics"

    def handle(self, *args, **kwargs):
        train_next_month()
        train_category()
        train_saving()
        train_anomalies()
        train_spending_pattern()
        self.stdout.write(self.style.SUCCESS("ML models trained successfully"))
