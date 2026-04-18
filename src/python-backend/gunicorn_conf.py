"""
Gunicorn Server Configuration for Production Scale
Dynamically calculates the number of workers based on CPU cores.
"""
import multiprocessing
import os

# Render specifically looks for $PORT, defaults to 8000
port = os.getenv("PORT", "8000")
bind = f"0.0.0.0:{port}"

# Gunicorn setup for Uvicorn async workers
worker_class = "uvicorn.workers.UvicornWorker"

# Automatic calculation of safe concurrency limits:
# Number of workers = (Cores * 2) + 1 (Standard formula to combat deadlocks)
# On a 1-core cloud instance, this launches 3 async workers perfectly.
cores = multiprocessing.cpu_count()
workers_per_core = 2
default_web_concurrency = workers_per_core * cores + 1

# Allow override from Env Var
web_concurrency = int(os.getenv("WEB_CONCURRENCY", default_web_concurrency))
workers = web_concurrency

# Prevent zombie worker memory leaks by restarting a worker 
# after it serves 1000 requests. Add a tiny jitter so they don't all restart at once.
max_requests = 1000
max_requests_jitter = 50

# Timeouts
# Gemini calls may take a while, so increase the default 30s timeout
timeout = 120
keepalive = 5

# Logging routing
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
