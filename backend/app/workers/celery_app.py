from celery import Celery
from celery.schedules import crontab

from app.config import settings


celery_app = Celery("algodiary", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.timezone = "Asia/Kolkata"
celery_app.conf.enable_utc = False
celery_app.conf.beat_schedule = {
    "daily-study-reminder": {
        "task": "app.workers.notification_tasks.daily_study_reminder",
        "schedule": crontab(hour=8, minute=0),
    },
    "streak-check": {
        "task": "app.workers.notification_tasks.streak_check",
        "schedule": crontab(hour=0, minute=0),
    },
    "weekly-progress-report": {
        "task": "app.workers.report_tasks.weekly_progress_report",
        "schedule": crontab(hour=9, minute=0, day_of_week="sun"),
    },
}

