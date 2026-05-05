"""
Pipeline: jobs_analytics
Input:    job_postings table (MySQL)
Transform: count jobs grouped by category, job_type, and experience_level
Output:   analytics_jobs_summary table (MySQL)

Run locally:
    docker compose run spark python pipelines/jobs_analytics.py
"""

import sys
import os
from datetime import datetime, timezone

# Works both inside Docker (/spark) and on GitHub Actions (repo/spark/)
SPARK_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SPARK_ROOT)

from dotenv import load_dotenv
load_dotenv(os.path.join(SPARK_ROOT, ".env"))

from utils.db_connector import get_spark, read_table, write_table
from pyspark.sql import functions as F


def run() -> None:
    started_at = datetime.now(timezone.utc)
    print(f"[jobs_analytics] started at {started_at.isoformat()}")

    spark = get_spark("jobs_analytics")

    # --- READ ---
    jobs = read_table(spark, "job_postings")
    total_input = jobs.count()
    print(f"[jobs_analytics] read {total_input} rows from job_postings")

    # Only process active jobs
    active_jobs = jobs.filter(F.col("is_active") == True)

    # --- TRANSFORM ---
    # Group by category + job_type + experience_level and count
    summary = (
        active_jobs
        .groupBy("category", "job_type", "experience_level")
        .agg(
            F.count("*").alias("job_count"),
            F.avg("salary_min").alias("avg_salary_min"),
            F.avg("salary_max").alias("avg_salary_max"),
        )
        .withColumn("avg_salary_min", F.round(F.col("avg_salary_min"), 0).cast("integer"))
        .withColumn("avg_salary_max", F.round(F.col("avg_salary_max"), 0).cast("integer"))
        .withColumn("computed_at", F.lit(started_at.strftime("%Y-%m-%d %H:%M:%S")))
        .orderBy(F.col("job_count").desc())
    )

    total_output = summary.count()
    print(f"[jobs_analytics] writing {total_output} rows to analytics_jobs_summary")

    # --- WRITE ---
    write_table(summary, "analytics_jobs_summary", mode="overwrite")

    finished_at = datetime.now(timezone.utc)
    elapsed = (finished_at - started_at).total_seconds()
    print(f"[jobs_analytics] finished at {finished_at.isoformat()} ({elapsed:.1f}s)")

    spark.stop()


if __name__ == "__main__":
    run()
