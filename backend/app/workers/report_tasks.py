import asyncio
import smtplib
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
from celery import shared_task
from sqlalchemy import case, func, select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.notification import NotificationType
from app.models.progress import ProgressLog
from app.models.user import User
from app.services.notification_service import create_notification


@shared_task(name="app.workers.report_tasks.weekly_progress_report")
def weekly_progress_report() -> None:
    asyncio.run(_weekly_progress_report())


async def _weekly_progress_report() -> None:
    async with AsyncSessionLocal() as db:
        start = date.today() - timedelta(days=7)
        users = (await db.scalars(select(User).where(User.is_active.is_(True)))).all()
        for user in users:
            row = (
                await db.execute(
                    select(
                        func.coalesce(func.sum(ProgressLog.problems_solved), 0),
                        func.coalesce(func.avg(ProgressLog.dsa_score), 0),
                        func.coalesce(func.avg(ProgressLog.hld_score), 0),
                        func.coalesce(func.avg(ProgressLog.lld_score), 0),
                        func.coalesce(func.sum(case((ProgressLog.mock_completed.is_(True), 1), else_=0)), 0),
                    ).where(ProgressLog.user_id == user.id, ProgressLog.logged_date >= start)
                )
            ).one()
            subject = "Your Algodiary weekly progress report"
            body = (
                f"Problems solved: {row[0]}\n"
                f"Average DSA/HLD/LLD scores: {float(row[1]):.1f}, {float(row[2]):.1f}, {float(row[3]):.1f}\n"
                f"Mocks completed: {row[4]}\n"
            )
            if settings.brevo_smtp_key:
                message = EmailMessage()
                message["From"] = settings.vapid_claim_email
                message["To"] = user.email
                message["Subject"] = subject
                message.set_content(body)
                with smtplib.SMTP(settings.brevo_smtp_host, settings.brevo_smtp_port) as smtp:
                    smtp.starttls()
                    smtp.login(settings.brevo_smtp_user, settings.brevo_smtp_key)
                    smtp.send_message(message)
            await create_notification(db, user.id, subject, body, NotificationType.system, sent_at=datetime.now(timezone.utc))
