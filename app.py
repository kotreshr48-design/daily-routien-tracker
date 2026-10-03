import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

# Allow frontend requests
CORS(app)


# ============================================================
# MYSQL DATABASE CONFIGURATION
# ============================================================

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "Daily_Routine_Tracker")

# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    try:

        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )

        return connection

    except Error as error:

        print("Database connection error:", error)

        return None


# ============================================================
# HOME / SERVER TEST
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "Daily Routine Tracker Backend is running."
    })


# ============================================================
# REGISTER
# ============================================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No data received."
        }), 400

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))


    if not name or not email or not password:

        return jsonify({
            "success": False,
            "message": "Name, email and password are required."
        }), 400


    connection = get_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500


    cursor = connection.cursor()


    try:

        # Check existing email

        cursor.execute(
            "SELECT user_id FROM Users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()


        if existing_user:

            return jsonify({
                "success": False,
                "message": "Email already registered."
            }), 409


        # Encrypt password

        hashed_password = generate_password_hash(password)


        # Insert user

        cursor.execute(
            """
            INSERT INTO Users
            (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (
                name,
                email,
                hashed_password
            )
        )


        connection.commit()


        return jsonify({
            "success": True,
            "message": "Registration successful."
        }), 201


    except Error as error:

        connection.rollback()

        print("Registration error:", error)

        return jsonify({
            "success": False,
            "message": "Registration failed."
        }), 500


    finally:

        cursor.close()
        connection.close()


# ============================================================
# LOGIN
# ============================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No data received."
        }), 400


    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))


    if not email or not password:

        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400


    connection = get_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500


    cursor = connection.cursor(dictionary=True)


    try:

        cursor.execute(
            """
            SELECT
                user_id,
                name,
                email,
                password
            FROM Users
            WHERE email = %s
            """,
            (email,)
        )


        user = cursor.fetchone()


        if user is None:

            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401


        password_correct = check_password_hash(
            user["password"],
            password
        )


        if not password_correct:

            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401


        return jsonify({
            "success": True,
            "message": "Login successful.",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200


    except Error as error:

        print("Login error:", error)

        return jsonify({
            "success": False,
            "message": "Login failed."
        }), 500


    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET ALL TASKS
# ============================================================

@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    connection = get_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500


    cursor = connection.cursor(dictionary=True)


    try:

        cursor.execute(
            """
            SELECT
                task_id,
                task_name,
                description
            FROM Tasks
            ORDER BY task_id
            """
        )


        tasks = cursor.fetchall()


        return jsonify({
            "success": True,
            "tasks": tasks
        }), 200


    except Error as error:

        print("Get tasks error:", error)

        return jsonify({
            "success": False,
            "message": "Could not get tasks."
        }), 500


    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET DAILY PROGRESS
# ============================================================

@app.route(
    "/api/progress/<int:user_id>/<string:progress_date>",
    methods=["GET"]
)
def get_daily_progress(user_id, progress_date):

    connection = get_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500


    cursor = connection.cursor(dictionary=True)


    try:

        # Validate date

        datetime.strptime(
            progress_date,
            "%Y-%m-%d"
        )


        cursor.execute(
            """
            SELECT
                t.task_id,
                t.task_name,
                t.description,
                COALESCE(dp.completed, 0) AS completed

            FROM Tasks AS t

            LEFT JOIN Daily_Progress AS dp
                ON t.task_id = dp.task_id
                AND dp.user_id = %s
                AND dp.progress_date = %s

            ORDER BY t.task_id
            """,
            (
                user_id,
                progress_date
            )
        )


        tasks = cursor.fetchall()


        completed_count = 0


        for task in tasks:

            if task["completed"]:

                completed_count += 1


        total_tasks = len(tasks)


        percentage = 0


        if total_tasks > 0:

            percentage = round(
                (completed_count / total_tasks) * 100
            )


        return jsonify({
            "success": True,
            "date": progress_date,
            "completed_count": completed_count,
            "total_tasks": total_tasks,
            "percentage": percentage,
            "tasks": tasks
        }), 200


    except ValueError:

        return jsonify({
            "success": False,
            "message": "Invalid date. Use YYYY-MM-DD."
        }), 400


    except Error as error:

        print("Get progress error:", error)

        return jsonify({
            "success": False,
            "message": "Could not get daily progress."
        }), 500


    finally:

        cursor.close()
        connection.close()


# ============================================================
# SAVE / UPDATE DAILY PROGRESS
# ============================================================

@app.route("/api/progress", methods=["POST"])
def save_progress():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No data received."
        }), 400


    user_id = data.get("user_id")
    task_id = data.get("task_id")
    progress_date = data.get("progress_date")
    completed = data.get("completed")


    if user_id is None or task_id is None:

        return jsonify({
            "success": False,
            "message": "user_id and task_id are required."
        }), 400


    if progress_date is None:

        progress_date = datetime.now().strftime("%Y-%m-%d")


    if completed is None:

        completed = False


    try:

        datetime.strptime(
            progress_date,
            "%Y-%m-%d"
        )

    except ValueError:

        return jsonify({
            "success": False,
            "message": "Invalid date. Use YYYY-MM-DD."
        }), 400


    connection = get_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500


    cursor = connection.cursor()


    try:

        # Insert new record or update existing record

        cursor.execute(
            """
            INSERT INTO Daily_Progress
            (
                user_id,
                task_id,
                progress_date,
                completed
            )

            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )

            ON DUPLICATE KEY UPDATE
                completed = %s
            """,
            (
                user_id,
                task_id,
                progress_date,
                completed,
                completed
            )
        )


        connection.commit()


        return jsonify({
            "success": True,
            "message": "Progress saved successfully."
        }), 200


    except Error as error:

        connection.rollback()

        print("Save progress error:", error)

        return jsonify({
            "success": False,
            "message": "Could not save progress."
        }), 500


    finally:

        cursor.close()
        connection.close()


# ============================================================
# DELETE DAILY PROGRESS
# ============================================================

@app.route("/api/progress", methods=["DELETE"])
def delete_progress():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No data received."
        }), 400


    user_id = data.get("user_id")
    task_id = data.get("task_id")
    progress_date = data.get("progress_date")


    if (
        user_id is None
        or task_id is None
        or progress_date is None
    ):

        return jsonify({
            "success": False,
            "message": "user_id, task_id and progress_date are required."
        }), 400


    connection = get_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500


    cursor = connection.cursor()


    try:

        cursor.execute(
            """
            DELETE FROM Daily_Progress

            WHERE user_id = %s
            AND task_id = %s
            AND progress_date = %s
            """,
            (
                user_id,
                task_id,
                progress_date
            )
        )


        connection.commit()


        return jsonify({
            "success": True,
            "message": "Progress deleted successfully."
        }), 200


    except Error as error:

        connection.rollback()

        print("Delete progress error:", error)

        return jsonify({
            "success": False,
            "message": "Could not delete progress."
        }), 500


    finally:

        cursor.close()
        connection.close()


# ============================================================
# MONTHLY PROGRESS
# ============================================================

# ============================================================
# MONTHLY PROGRESS
# ============================================================

@app.route(
    "/api/monthly-progress/<int:user_id>/<int:year>/<int:month>",
    methods=["GET"]
)
def get_monthly_progress(user_id, year, month):

    if month < 1 or month > 12:
        return jsonify({
            "success": False,
            "message": "Month must be between 1 and 12."
        }), 400

    connection = get_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Could not connect to MySQL."
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Get total number of tasks
        cursor.execute("SELECT COUNT(*) AS total_tasks FROM Tasks")
        task_result = cursor.fetchone()

        total_tasks = task_result["total_tasks"]

        # Get completed tasks for each day of the selected month
        cursor.execute("""
            SELECT
                progress_date,
                SUM(completed) AS completed_tasks
            FROM Daily_Progress
            WHERE user_id = %s
              AND YEAR(progress_date) = %s
              AND MONTH(progress_date) = %s
            GROUP BY progress_date
            ORDER BY progress_date
        """, (user_id, year, month))

        rows = cursor.fetchall()

        progress = []

        for row in rows:

            completed_tasks = int(row["completed_tasks"] or 0)

            if total_tasks > 0:
                percentage = round(
                    (completed_tasks / total_tasks) * 100
                )
            else:
                percentage = 0

            if percentage == 100:
                status = "completed"
            elif percentage > 0:
                status = "partial"
            else:
                status = "pending"

            progress.append({
                "progress_date": str(row["progress_date"]),
                "completed_tasks": completed_tasks,
                "total_tasks": total_tasks,
                "percentage": percentage,
                "status": status
            })

        return jsonify({
            "success": True,
            "year": year,
            "month": month,
            "progress": progress
        }), 200

    except Exception as error:

        print("Monthly progress error:", error)

        return jsonify({
            "success": False,
            "message": "Could not get monthly progress."
        }), 500

    finally:
        cursor.close()
        connection.close()

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print("---------------------------------------------")
    print("Daily Routine Tracker Backend")
    print("---------------------------------------------")
    print("Server: http://127.0.0.1:5000")
    print("Database:", DB_NAME)
    print("---------------------------------------------")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )