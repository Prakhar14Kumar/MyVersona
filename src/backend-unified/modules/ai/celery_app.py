"""
Celery Task Queue Configuration
================================

Handles async processing of ML/AI tasks to prevent blocking the main API thread.

Features:
- Async ML model inference
- Result caching with Redis
- Task retries and error handling
- Monitoring and logging

Usage:
    # Start Celery worker
    celery -A modules.ai.celery_app worker --loglevel=info --concurrency=4
    
    # Start Celery beat (for periodic tasks)
    celery -A modules.ai.celery_app beat --loglevel=info
    
    # Monitor tasks
    celery -A modules.ai.celery_app flower
"""

from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure
import logging
from datetime import timedelta

from core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== CELERY APP CONFIGURATION ====================

celery_app = Celery(
    'versona_ai_tasks',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        'modules.ai.tasks.career_tasks',
        'modules.ai.tasks.content_tasks',
        'modules.ai.tasks.resume_tasks',
        'modules.ai.tasks.moderation_tasks',
        'modules.ai.tasks.feed_tasks',
        'modules.ai.tasks.search_tasks',
        'modules.ai.tasks.recommendation_tasks',
        'modules.ai.tasks.advanced_tasks',
    ]
)

# ==================== CELERY CONFIGURATION ====================

celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',  # Indian timezone
    enable_utc=True,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={'master_name': 'mymaster'},
    
    # Task execution settings
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    task_soft_time_limit=240,  # Soft limit at 4 minutes
    
    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Rate limiting
    task_default_rate_limit='100/m',  # 100 tasks per minute
    
    # Broker settings
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    
    # Redis optimization
    redis_socket_keepalive=True,
    redis_socket_timeout=5.0,
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        'cleanup-old-results': {
            'task': 'modules.ai.tasks.maintenance.cleanup_old_results',
            'schedule': timedelta(hours=6),  # Run every 6 hours
        },
        'update-ml-model-cache': {
            'task': 'modules.ai.tasks.maintenance.update_model_cache',
            'schedule': timedelta(hours=24),  # Run daily
        },
    },
)

# ==================== TASK PRIORITY ROUTING ====================

celery_app.conf.task_routes = {
    # High priority tasks (real-time features)
    'modules.ai.tasks.moderation_tasks.*': {'queue': 'high_priority'},
    'modules.ai.tasks.search_tasks.*': {'queue': 'high_priority'},
    
    # Medium priority tasks (user-facing features)
    'modules.ai.tasks.content_tasks.*': {'queue': 'medium_priority'},
    'modules.ai.tasks.feed_tasks.*': {'queue': 'medium_priority'},
    'modules.ai.tasks.recommendation_tasks.*': {'queue': 'medium_priority'},
    
    # Low priority tasks (background processing)
    'modules.ai.tasks.career_tasks.*': {'queue': 'low_priority'},
    'modules.ai.tasks.resume_tasks.*': {'queue': 'low_priority'},
    'modules.ai.tasks.advanced_tasks.*': {'queue': 'low_priority'},
}

# ==================== SIGNAL HANDLERS ====================

@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    """Log when task starts"""
    logger.info(f"🚀 Task started: {task.name} [{task_id}]")


@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    """Log when task completes"""
    logger.info(f"✅ Task completed: {task.name} [{task_id}]")


@task_failure.connect
def task_failure_handler(task_id, exception, *args, **kwargs):
    """Log when task fails"""
    logger.error(f"❌ Task failed: {task_id} - {exception}")


# ==================== HELPER FUNCTIONS ====================

def get_task_info():
    """Get information about registered tasks"""
    return {
        'registered_tasks': list(celery_app.tasks.keys()),
        'active_queues': ['high_priority', 'medium_priority', 'low_priority'],
        'broker': settings.CELERY_BROKER_URL,
        'backend': settings.CELERY_RESULT_BACKEND
    }


def check_worker_health():
    """Check if Celery workers are running"""
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        if not active_workers:
            return {
                'status': 'unhealthy',
                'message': 'No active Celery workers found',
                'workers': 0
            }
        
        return {
            'status': 'healthy',
            'message': f'{len(active_workers)} worker(s) active',
            'workers': len(active_workers),
            'worker_names': list(active_workers.keys())
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Failed to connect to Celery: {str(e)}',
            'workers': 0
        }


# ==================== EXPORT ====================

__all__ = [
    'celery_app',
    'get_task_info',
    'check_worker_health'
]
