"""
Database connection helper for PySpark JDBC.

Reads credentials from environment variables — never hardcode them.
The MySQL JDBC driver JAR must be present in spark/jars/ before use.
Download from: https://dev.mysql.com/downloads/connector/j/ (Platform Independent)
"""

import os
from pyspark.sql import SparkSession, DataFrame


JDBC_DRIVER_PATH = "/spark/jars/mysql-connector-j-9.7.0.jar"


def get_spark(app_name: str) -> SparkSession:
    """Create and return a SparkSession with the MySQL JDBC driver loaded."""
    return (
        SparkSession.builder
        .appName(app_name)
        .config("spark.jars", JDBC_DRIVER_PATH)
        .config("spark.sql.shuffle.partitions", "4")  # small dataset — no need for 200
        .getOrCreate()
    )


def jdbc_url() -> str:
    host = os.environ["DB_HOST"]
    port = os.environ.get("DB_PORT", "3306")
    db   = os.environ["DB_DATABASE"]
    return f"jdbc:mysql://{host}:{port}/{db}?useSSL=false&allowPublicKeyRetrieval=true"


def jdbc_props() -> dict:
    return {
        "user":   os.environ["DB_USERNAME"],
        "password": os.environ["DB_PASSWORD"],
        "driver": "com.mysql.cj.jdbc.Driver",
    }


def read_table(spark: SparkSession, table: str) -> DataFrame:
    """Read a full table from MySQL into a Spark DataFrame."""
    return spark.read.jdbc(url=jdbc_url(), table=table, properties=jdbc_props())


def write_table(df: DataFrame, table: str, mode: str = "overwrite") -> None:
    """Write a Spark DataFrame to a MySQL table. Default mode overwrites the table."""
    df.write.jdbc(url=jdbc_url(), table=table, mode=mode, properties=jdbc_props())
