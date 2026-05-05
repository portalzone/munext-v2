"""
Pipeline: hiring_trends
Input:    job_postings + applications tables (MySQL)
Transform: count jobs posted and applications submitted per month,
           join into a single monthly timeline
Output:   analytics_hiring_trends table (MySQL)

Run locally:
    docker compose run --rm spark python pipelines/hiring_trends.py
"""

import sys
from datetime import datetime, timezone

sys.path.insert(0, "/spark")

from dotenv import load_dotenv
load_dotenv("/spark/.env")

from utils.db_connector import get_spark, read_table, write_table
from pyspark.sql import functions as F


def run() -> None:
    started_at = datetime.now(timezone.utc)
    print(f"[hiring_trends] started at {started_at.isoformat()}")

    spark = get_spark("hiring_trends")

    # --- READ ---
    jobs = read_table(spark, "job_postings")
    applications = read_table(spark, "applications")
    print(f"[hiring_trends] read {jobs.count()} jobs, {applications.count()} applications")

    # --- TRANSFORM ---
    # Jobs posted per month — date_format extracts "2026-04" from a timestamp
    jobs_by_month = (
        jobs
        .withColumn("month", F.date_format(F.col("created_at"), "yyyy-MM"))
        .groupBy("month")
        .agg(F.count("*").alias("job_count"))
    )

    # Applications submitted per month
    apps_by_month = (
        applications
        .withColumn("month", F.date_format(F.col("created_at"), "yyyy-MM"))
        .groupBy("month")
        .agg(F.count("*").alias("application_count"))
    )

    # Left join — keep all months that had jobs, even if no applications
    result = (
        jobs_by_month
        .join(apps_by_month, on="month", how="left")
        .fillna(0, subset=["application_count"])
        .withColumn("computed_at", F.lit(started_at.strftime("%Y-%m-%d %H:%M:%S")))
        .orderBy(F.col("month").asc())
    )

    total_output = result.count()
    print(f"[hiring_trends] writing {total_output} rows to analytics_hiring_trends")

    # --- WRITE ---
    write_table(result, "analytics_hiring_trends", mode="overwrite")

    finished_at = datetime.now(timezone.utc)
    elapsed = (finished_at - started_at).total_seconds()
    print(f"[hiring_trends] finished at {finished_at.isoformat()} ({elapsed:.1f}s)")

    spark.stop()


if __name__ == "__main__":
    run()
