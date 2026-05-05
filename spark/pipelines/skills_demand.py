"""
Pipeline: skills_demand
Input:    job_postings table (MySQL)
Transform: explode skills_required array, count frequency per skill,
           compare recent 30 days vs older to assign trend (up/down/stable)
Output:   analytics_skills_demand table (MySQL)

Run locally:
    docker compose run --rm spark python pipelines/skills_demand.py
"""

import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, "/spark")

from dotenv import load_dotenv
load_dotenv("/spark/.env")

from utils.db_connector import get_spark, read_table, write_table
from pyspark.sql import functions as F


def run() -> None:
    started_at = datetime.now(timezone.utc)
    print(f"[skills_demand] started at {started_at.isoformat()}")

    spark = get_spark("skills_demand")

    # --- READ ---
    jobs = read_table(spark, "job_postings")
    total_input = jobs.count()
    print(f"[skills_demand] read {total_input} rows from job_postings")

    # Only active jobs
    active_jobs = jobs.filter(F.col("is_active") == True)

    # --- TRANSFORM ---
    # explode turns ["Python","MySQL","Git"] into three separate rows
    exploded = active_jobs.select(
        F.col("id").alias("job_id"),
        F.col("created_at"),
        F.explode(F.from_json(F.col("skills_required"), "array<string>")).alias("skill")
    )

    # Overall count per skill
    total_counts = (
        exploded
        .groupBy("skill")
        .agg(F.count("*").alias("count"))
    )

    # Recent count — jobs posted in the last 30 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    recent_counts = (
        exploded
        .filter(F.col("created_at") >= cutoff)
        .groupBy("skill")
        .agg(F.count("*").alias("recent_count"))
    )

    # Older count — jobs posted before the last 30 days
    older_counts = (
        exploded
        .filter(F.col("created_at") < cutoff)
        .groupBy("skill")
        .agg(F.count("*").alias("older_count"))
    )

    # Join all three together
    result = (
        total_counts
        .join(recent_counts, on="skill", how="left")
        .join(older_counts, on="skill", how="left")
        .fillna(0, subset=["recent_count", "older_count"])
    )

    # Assign trend: if recent > older → up, recent < older → down, else stable
    result = result.withColumn(
        "trend",
        F.when(F.col("recent_count") > F.col("older_count"), "up")
         .when(F.col("recent_count") < F.col("older_count"), "down")
         .otherwise("stable")
    )

    result = (
        result
        .select("skill", "count", "trend")
        .withColumn("computed_at", F.lit(started_at.strftime("%Y-%m-%d %H:%M:%S")))
        .orderBy(F.col("count").desc())
    )

    total_output = result.count()
    print(f"[skills_demand] writing {total_output} rows to analytics_skills_demand")

    # --- WRITE ---
    write_table(result, "analytics_skills_demand", mode="overwrite")

    finished_at = datetime.now(timezone.utc)
    elapsed = (finished_at - started_at).total_seconds()
    print(f"[skills_demand] finished at {finished_at.isoformat()} ({elapsed:.1f}s)")

    spark.stop()


if __name__ == "__main__":
    run()
