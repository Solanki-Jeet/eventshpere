import os
import sys
from urllib.parse import urlparse
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_database():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL is not set in the environment or .env file.")
        sys.exit(1)
        
    try:
        # Parse the connection string
        result = urlparse(database_url)
        username = result.username
        password = result.password
        database_name = result.path[1:]
        host = result.hostname
        port = result.port or 5432
        
        print(f"Connecting to PostgreSQL server at {host}:{port} as user '{username}'...")
        
        # Connect to the default 'postgres' database first to perform database administration tasks
        conn = psycopg2.connect(
            dbname='postgres',
            user=username,
            password=password,
            host=host,
            port=port
        )
        conn.autocommit = True
        
        cursor = conn.cursor()
        
        # Check if database already exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s;", (database_name,))
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Database '{database_name}' does not exist. Creating it...")
            cursor.execute(f'CREATE DATABASE "{database_name}";')
            print(f"Database '{database_name}' created successfully!")
        else:
            print(f"Database '{database_name}' already exists.")
            
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print("\nConnection Error: Unable to connect to PostgreSQL server.")
        print(e)
        print("\nPlease ensure:")
        print("1. PostgreSQL service is running.")
        print("2. The username and password in '.env' under DATABASE_URL are correct.")
        print("3. The host and port are correct.")
        sys.exit(1)
    except Exception as e:
        print("An unexpected error occurred:")
        print(e)
        sys.exit(1)

if __name__ == '__main__':
    create_database()
