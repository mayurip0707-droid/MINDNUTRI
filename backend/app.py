from pathlib import Path
import sys
import importlib.util

import joblib
import pandas as pd
import numpy as np

import sqlite3
import secrets
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash


from flask import Flask, jsonify, request
from flask_cors import CORS

# ============================================================
# MINDNUTRI / MINDWISEAI FLASK BACKEND
# ============================================================
#
# Local ML + Local NLP
# No External AI APIs
#
# Services:
# 1. Sleep Disorder Prediction
# 2. Stress Prediction
# 3. Mood Journal NLP Analysis
# 4. Nutrition Analysis
#
# Backend:
# Flask
#
# Port:
# 5000
#
# ============================================================


# ============================================================
# PROJECT PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

PROJECT_ROOT = BASE_DIR.parent

ML_DIR = PROJECT_ROOT / "ml"
BACKEND_DIR_STRING = str(BASE_DIR)
if BACKEND_DIR_STRING not in sys.path:
    sys.path.insert(0, BACKEND_DIR_STRING)

MODELS_DIR = ML_DIR / "models"

MOOD_DIR = ML_DIR / "mood"


# ============================================================
# PYTHON PATH
# ============================================================

PROJECT_ROOT_STRING = str(PROJECT_ROOT)

if PROJECT_ROOT_STRING not in sys.path:
    sys.path.insert(0, PROJECT_ROOT_STRING)
from nutrition.nutrition_engine import understand_food


# ============================================================
# CREATE FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# CORS
# ============================================================

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)

# ============================================================
# MINDNUTRI ACCOUNT STORAGE
# SQLite + Hashed Passwords + Per-User Data
# ============================================================

ACCOUNT_DB = BASE_DIR / "mindnutri_accounts.db"


def get_account_db():
    connection = sqlite3.connect(str(ACCOUNT_DB))
    connection.row_factory = sqlite3.Row
    return connection


def init_account_db():
    with get_account_db() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                profile_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS user_data (
                user_id INTEGER NOT NULL,
                data_key TEXT NOT NULL,
                data_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, data_key),
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)


def create_account_session(connection, user_id):
    token = secrets.token_urlsafe(32)

    connection.execute(
        """
        INSERT INTO user_sessions (token, user_id, created_at)
        VALUES (?, ?, ?)
        """,
        (
            token,
            user_id,
            datetime.now(timezone.utc).isoformat()
        )
    )

    return token


def get_authenticated_user():
    authorization = request.headers.get("Authorization", "")
    parts = authorization.split(" ", 1)

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1].strip()

    if not token:
        return None

    with get_account_db() as connection:
        user = connection.execute(
            """
            SELECT users.id, users.email, users.full_name,
                   users.profile_json
            FROM user_sessions
            JOIN users ON users.id = user_sessions.user_id
            WHERE user_sessions.token = ?
            """,
            (token,)
        ).fetchone()

    return dict(user) if user else None


def allowed_account_data_key(key):
    return (
        isinstance(key, str)
        and key.startswith("mindnutri_")
        and key != "mindnutri_user_profile"
    )


# Initialize the account database when Flask starts.
init_account_db()


# ============================================================
# REGISTER
# ============================================================

@app.route("/auth/register", methods=["POST"])
def register_account():
    payload = request.get_json(silent=True) or {}

    full_name = str(payload.get("fullName", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")
    profile = payload.get("profile", {})

    if not full_name or not email or not isinstance(password, str):
        return jsonify({
            "status": "error",
            "message": "Name, email and password are required."
        }), 400

    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return jsonify({
            "status": "error",
            "message": "Please enter a valid email address."
        }), 400

    if len(password) < 6:
        return jsonify({
            "status": "error",
            "message": "Password must contain at least 6 characters."
        }), 400

    if not isinstance(profile, dict):
        return jsonify({
            "status": "error",
            "message": "Invalid profile information."
        }), 400

    profile = {
        **profile,
        "fullName": full_name,
        "email": email
    }

    try:
        with get_account_db() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (
                    full_name, email, password_hash,
                    profile_json, created_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    full_name,
                    email,
                    generate_password_hash(password),
                    __import__("json").dumps(profile),
                    datetime.now(timezone.utc).isoformat()
                )
            )

            user_id = cursor.lastrowid
            token = create_account_session(connection, user_id)

        return jsonify({
            "status": "success",
            "message": "Account created successfully.",
            "token": token,
            "profile": profile
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "status": "error",
            "message": "An account with this email already exists."
        }), 409


# ============================================================
# LOGIN
# ============================================================

@app.route("/auth/login", methods=["POST"])
def login_account():
    payload = request.get_json(silent=True) or {}

    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")

    if not email or not isinstance(password, str) or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required."
        }), 400

    with get_account_db() as connection:
        user = connection.execute(
            """
            SELECT id, full_name, email, password_hash, profile_json
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "status": "error",
                "message": "Incorrect email or password."
            }), 401

        token = create_account_session(connection, user["id"])

        profile = __import__("json").loads(
            user["profile_json"] or "{}"
        )

    return jsonify({
        "status": "success",
        "message": "Login successful.",
        "token": token,
        "profile": profile
    }), 200


# ============================================================
# RESTORE ACCOUNT DATA
# ============================================================

@app.route("/account/data", methods=["GET"])
def get_account_data():
    user = get_authenticated_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Please log in again."
        }), 401

    with get_account_db() as connection:
        rows = connection.execute(
            """
            SELECT data_key, data_json
            FROM user_data
            WHERE user_id = ?
            """,
            (user["id"],)
        ).fetchall()

    data = {}

    for row in rows:
        try:
            data[row["data_key"]] = __import__("json").loads(
                row["data_json"]
            )
        except (ValueError, TypeError):
            continue

    return jsonify({
        "status": "success",
        "profile": __import__("json").loads(
            user["profile_json"] or "{}"
        ),
        "data": data
    }), 200


# ============================================================
# SAVE ACCOUNT DATA
# ============================================================

@app.route("/account/data", methods=["PUT"])
def save_account_data():
    user = get_authenticated_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Please log in again."
        }), 401

    payload = request.get_json(silent=True) or {}
    data = payload.get("data")

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "Data must be a JSON object."
        }), 400

    timestamp = datetime.now(timezone.utc).isoformat()

    with get_account_db() as connection:
        for key, value in data.items():
            if not allowed_account_data_key(key):
                continue

            connection.execute(
                """
                INSERT INTO user_data (
                    user_id, data_key, data_json, updated_at
                )
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, data_key)
                DO UPDATE SET
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at
                """,
                (
                    user["id"],
                    key,
                    __import__("json").dumps(value),
                    timestamp
                )
            )

    return jsonify({
        "status": "success",
        "message": "Account data saved."
    }), 200


# ============================================================
# LOGOUT
# ============================================================

@app.route("/auth/logout", methods=["POST"])
def logout_account():
    authorization = request.headers.get("Authorization", "")
    parts = authorization.split(" ", 1)

    if len(parts) == 2 and parts[0].lower() == "bearer":
        with get_account_db() as connection:
            connection.execute(
                "DELETE FROM user_sessions WHERE token = ?",
                (parts[1].strip(),)
            )

    return jsonify({
        "status": "success",
        "message": "Logged out."
    }), 200


# ============================================================
# PRINT PROJECT INFORMATION
# ============================================================

print("=" * 70)
print("                 MINDNUTRI BACKEND")
print("=" * 70)

print()
print("Backend Directory:")
print(BASE_DIR)

print()
print("Project Root:")
print(PROJECT_ROOT)

print()
print("ML Directory:")
print(ML_DIR)

print()
print("Models Directory:")
print(MODELS_DIR)

print()
print("Mood Engine Directory:")
print(MOOD_DIR)

print("=" * 70)


# ============================================================
# SERVICE STATUS
# ============================================================

MOOD_ENGINE_AVAILABLE = False

SLEEP_MODEL_AVAILABLE = False

STRESS_MODEL_AVAILABLE = False


# ============================================================
# GLOBAL MODELS
# ============================================================

sleep_model = None

stress_model = None

analyze_mood = None


# ============================================================
# MODEL PATHS
# ============================================================

SLEEP_MODEL_PATH = (
    MODELS_DIR / "sleep_disorder_model.pkl"
)

STRESS_MODEL_PATH = (
    MODELS_DIR / "stress_model.pkl"
)


# ============================================================
# MOOD ENGINE LOADER
# ============================================================

def load_mood_engine():

    global analyze_mood
    global MOOD_ENGINE_AVAILABLE

    mood_engine_file = (
        MOOD_DIR / "mood_engine.py"
    )

    print()
    print("-" * 70)
    print("Loading Mood NLP Engine...")
    print("Expected file:")
    print(mood_engine_file)

    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    if not mood_engine_file.exists():

        print()
        print("WARNING: mood_engine.py was not found.")

        print(
            "Expected location:",
            mood_engine_file
        )

        MOOD_ENGINE_AVAILABLE = False

        return False

    # --------------------------------------------------------
    # Method 1: Normal package import
    # --------------------------------------------------------

    try:

        from ml.mood.mood_engine import (
            analyze_mood as mood_function
        )

        analyze_mood = mood_function

        MOOD_ENGINE_AVAILABLE = True

        print()
        print(
            "Mood NLP Engine loaded using package import."
        )

        print("Status: LOADED")

        return True

    except Exception as import_error:

        print()
        print(
            "Normal mood engine import failed:"
        )

        print(import_error)

    # --------------------------------------------------------
    # Method 2: Direct file import
    # --------------------------------------------------------

    try:

        spec = importlib.util.spec_from_file_location(
            "mood_engine",
            str(mood_engine_file)
        )

        if spec is None:

            raise ImportError(
                "Could not create mood engine module specification."
            )

        mood_module = (
            importlib.util.module_from_spec(spec)
        )

        if spec.loader is None:

            raise ImportError(
                "Mood engine module loader is unavailable."
            )

        spec.loader.exec_module(
            mood_module
        )

        if not hasattr(
            mood_module,
            "analyze_mood"
        ):

            raise ImportError(
                "analyze_mood function was not found "
                "inside mood_engine.py."
            )

        analyze_mood = (
            mood_module.analyze_mood
        )

        MOOD_ENGINE_AVAILABLE = True

        print()
        print(
            "Mood NLP Engine loaded using direct file import."
        )

        print("Status: LOADED")

        return True

    except Exception as direct_import_error:

        print()
        print(
            "Direct mood engine import also failed:"
        )

        print(direct_import_error)

        MOOD_ENGINE_AVAILABLE = False

        analyze_mood = None

        return False


# ============================================================
# LOAD MOOD ENGINE
# ============================================================

load_mood_engine()


# ============================================================
# GENERIC MODEL LOADER
# ============================================================

def load_model(model_path, model_name):

    print()
    print("-" * 70)

    print(
        f"Loading {model_name}..."
    )

    print(
        "Path:",
        model_path
    )

    # --------------------------------------------------------
    # Check model file
    # --------------------------------------------------------

    if not model_path.exists():

        print()

        print(
            f"WARNING: {model_name} file does not exist."
        )

        print(
            "Expected:",
            model_path
        )

        return None

    # --------------------------------------------------------
    # Load model
    # --------------------------------------------------------

    try:

        model = joblib.load(
            model_path
        )

        print(
            f"{model_name} loaded successfully!"
        )

        return model

    except Exception as error:

        print()

        print(
            f"ERROR loading {model_name}:"
        )

        print(
            str(error)
        )

        return None


# ============================================================
# LOAD SLEEP MODEL
# ============================================================

sleep_model = load_model(
    SLEEP_MODEL_PATH,
    "Sleep Disorder Model"
)

SLEEP_MODEL_AVAILABLE = (
    sleep_model is not None
)


# ============================================================
# LOAD STRESS MODEL
# ============================================================

stress_model = load_model(
    STRESS_MODEL_PATH,
    "Stress Prediction Model"
)

STRESS_MODEL_AVAILABLE = (
    stress_model is not None
)


# ============================================================
# FINAL SERVICE STATUS
# ============================================================

print()
print("=" * 70)
print("                 SERVICE STATUS")
print("=" * 70)

print()

print(
    "Sleep Disorder Model:",
    "LOADED"
    if SLEEP_MODEL_AVAILABLE
    else "NOT LOADED"
)

print(
    "Stress Prediction Model:",
    "LOADED"
    if STRESS_MODEL_AVAILABLE
    else "NOT LOADED"
)

print(
    "Mood NLP Engine:",
    "LOADED"
    if MOOD_ENGINE_AVAILABLE
    else "NOT LOADED"
)

print()

print("=" * 70)

# ============================================================
# LOCAL NUTRITION DATABASE
# Used by Smart Food Analysis
# No External API
# ============================================================

NUTRITION_DATABASE = {

    "oats": {
        "name": "Oats",
        "calories": 389,
        "protein": 16.9,
        "carbs": 66.3,
        "fat": 6.9,
        "fiber": 10.6
    },

    "vegetable sandwich": {
        "name": "Vegetable Sandwich",
        "calories": 200,
        "protein": 6.0,
        "carbs": 28.0,
        "fat": 7.0,
        "fiber": 3.0
    },
    "paneer curry": {
        "name": "Paneer Curry",
        "calories": 180,
        "protein": 8.0,
        "carbs": 8.0,
        "fat": 12.0,
        "fiber": 1.5
    },

    "sweet potato": {
        "name": "Sweet Potato",
        "calories": 86,
        "protein": 1.6,
        "carbs": 20.1,
        "fat": 0.1,
        "fiber": 3.0
    },

    
    "broccoli": {
        "name": "Broccoli",
        "calories": 34,
        "protein": 2.8,
        "carbs": 6.6,
        "fat": 0.4,
        "fiber": 2.6
    },

    "strawberry": {
        "name": "Strawberry",
        "calories": 32,
        "protein": 0.7,
        "carbs": 7.7,
        "fat": 0.3,
        "fiber": 2.0
    },

    "beetroot": {
        "name": "Beetroot",
        "calories": 43,
        "protein": 1.6,
        "carbs": 9.6,
        "fat": 0.2,
        "fiber": 2.8
    },
    "veg pulao": {
        "name": "Veg Pulao",
        "calories": 150,
        "protein": 3.5,
        "carbs": 25.0,
        "fat": 4.0,
        "fiber": 2.0
    },
    "dal khichdi": {
        "name": "Dal Khichdi",
        "calories": 120,
        "protein": 4.5,
        "carbs": 20.0,
        "fat": 2.5,
        "fiber": 2.0
    },

    "banana": {
        "name": "Banana",
        "calories": 89,
        "protein": 1.1,
        "carbs": 22.8,
        "fat": 0.3,
        "fiber": 2.6
    },

    "apple": {
        "name": "Apple",
        "calories": 52,
        "protein": 0.3,
        "carbs": 13.8,
        "fat": 0.2,
        "fiber": 2.4
    },

    "rice": {
        "name": "Rice",
        "calories": 130,
        "protein": 2.7,
        "carbs": 28.2,
        "fat": 0.3,
        "fiber": 0.4
    },

    "roti": {
        "name": "Roti",
        "calories": 297,
        "protein": 11.0,
        "carbs": 55.0,
        "fat": 4.0,
        "fiber": 11.0
    },

    "chapati": {
        "name": "Chapati",
        "calories": 297,
        "protein": 11.0,
        "carbs": 55.0,
        "fat": 4.0,
        "fiber": 11.0
    },

    "dal": {
        "name": "Dal",
        "calories": 116,
        "protein": 9.0,
        "carbs": 20.0,
        "fat": 0.4,
        "fiber": 7.9
    },
    "dal bati": {
        "name": "Dal Bati",
        "calories": 250,
        "protein": 8.0,
        "carbs": 35.0,
        "fat": 9.0,
        "fiber": 5.0
    },
    "fried rice": {
        "name": "Fried Rice",
        "calories": 160,
        "protein": 3.0,
        "carbs": 28.0,
        "fat": 4.0,
        "fiber": 2.0
    },

    "paneer": {
        "name": "Paneer",
        "calories": 265,
        "protein": 18.3,
        "carbs": 1.2,
        "fat": 20.8,
        "fiber": 0
    },

    "egg": {
        "name": "Egg",
        "calories": 155,
        "protein": 13.0,
        "carbs": 1.1,
        "fat": 11.0,
        "fiber": 0
    },

    "boiled egg": {
        "name": "Boiled Egg",
        "calories": 155,
        "protein": 13.0,
        "carbs": 1.1,
        "fat": 11.0,
        "fiber": 0
    },

    "chicken": {
        "name": "Chicken",
        "calories": 239,
        "protein": 27.3,
        "carbs": 0,
        "fat": 13.6,
        "fiber": 0
    },

    "milk": {
        "name": "Milk",
        "calories": 61,
        "protein": 3.2,
        "carbs": 4.8,
        "fat": 3.3,
        "fiber": 0
    },

    "curd": {
        "name": "Curd",
        "calories": 61,
        "protein": 3.5,
        "carbs": 4.7,
        "fat": 3.3,
        "fiber": 0
    },

    "almonds": {
        "name": "Almonds",
        "calories": 579,
        "protein": 21.2,
        "carbs": 21.6,
        "fat": 49.9,
        "fiber": 12.5
    },

    "poha": {
        "name": "Poha",
        "calories": 180,
        "protein": 4.0,
        "carbs": 30.0,
        "fat": 5.0,
        "fiber": 2.5
    },

    "upma": {
        "name": "Upma",
        "calories": 190,
        "protein": 5.0,
        "carbs": 32.0,
        "fat": 5.0,
        "fiber": 2.5
    },

    "idli": {
        "name": "Idli",
        "calories": 58,
        "protein": 2.0,
        "carbs": 12.0,
        "fat": 0.4,
        "fiber": 0.8
    },

    "dosa": {
        "name": "Dosa",
        "calories": 168,
        "protein": 3.9,
        "carbs": 29.0,
        "fat": 3.7,
        "fiber": 1.5
    }
}

# ============================================================
# HOME ROUTE
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "status": "success",

        "message":
            "MindNutri Backend is running!",

        "available_endpoints": [

            "GET /",

            "GET /health",

            "POST /predict",

            "POST /predict-stress",

            "POST /analyze-mood",

            "POST /nutrition/analyze",

            "GET /nutrition/foods",

            "POST /analyze-food",

        ]

    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health_check():

    return jsonify({

        "status": "success",

        "message":
            "MindNutri Backend is healthy!",

        "services": {

            "sleep_model":
                "loaded"
                if SLEEP_MODEL_AVAILABLE
                else "not loaded",

            "stress_model":
                "loaded"
                if STRESS_MODEL_AVAILABLE
                else "not loaded",

            "mood_engine":
                "loaded"
                if MOOD_ENGINE_AVAILABLE
                else "not loaded"

        }

    })


# ============================================================
# STRESS PREDICTION
# ============================================================
#
# IMPORTANT:
#
# These columns MUST match the columns used in
# train_stress_model.py
#
# ============================================================

@app.route(
    "/predict-stress",
    methods=["POST"]
)
def predict_stress():

    # --------------------------------------------------------
    # Check model
    # --------------------------------------------------------

    if not STRESS_MODEL_AVAILABLE:

        return jsonify({

            "status": "error",

            "message":
                "Stress prediction model is not available.",

            "details":
                "Make sure stress_model.pkl exists in ml/models/."

        }), 500

    # --------------------------------------------------------
    # Get JSON
    # --------------------------------------------------------

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "status": "error",

                "message":
                    "No JSON data was received."

            }), 400

        print()
        print("-" * 70)
        print("Stress Prediction Request")
        print("-" * 70)

        print("Received data:")
        print(data)

        # ----------------------------------------------------
        # Required features
        # ----------------------------------------------------

        required_features = [

            "Gender",

            "Age",

            "Occupation",

            "Sleep Duration",

            "Quality of Sleep",

            "Physical Activity Level",

            "BMI Category",

            "Heart Rate",

            "Daily Steps",

            "Systolic BP",

            "Diastolic BP"

        ]

        # ----------------------------------------------------
        # Check missing features
        # ----------------------------------------------------

        missing_features = [

            feature
            for feature in required_features
            if feature not in data

        ]

        if missing_features:

            return jsonify({

                "status": "error",

                "message":
                    "Required stress assessment fields are missing.",

                "missing_fields":
                    missing_features

            }), 400
        

        # ----------------------------------------------------
        # User-reported stress feeling
        # ----------------------------------------------------

        stress_feeling_score = data.get("Stress Feeling")

        if stress_feeling_score is None:
            return jsonify({
                "status": "error",
                "message": "Stress Feeling is required."
            }), 400

        try:
            stress_feeling_score = float(stress_feeling_score)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "Stress Feeling must be a numeric score."
            }), 400

        if stress_feeling_score not in [3, 4, 6, 8, 9]:
            return jsonify({
                "status": "error",
                "message": "Invalid Stress Feeling score."
            }), 400

        # ----------------------------------------------------
        # Create DataFrame
        # ----------------------------------------------------

        input_data = {

            "Gender":
                data["Gender"],

            "Age":
                float(data["Age"]),

            "Occupation":
                data["Occupation"],

            "Sleep Duration":
                float(data["Sleep Duration"]),

            "Quality of Sleep":
                float(data["Quality of Sleep"]),

            "Physical Activity Level":
                float(data["Physical Activity Level"]),

            "BMI Category":
                data["BMI Category"],

            "Heart Rate":
                float(data["Heart Rate"]),

            "Daily Steps":
                float(data["Daily Steps"]),

            "Systolic BP":
                float(data["Systolic BP"]),

            "Diastolic BP":
                float(data["Diastolic BP"])

        }

        input_df = pd.DataFrame(
            [input_data]
        )

        # ----------------------------------------------------
        # Make prediction
        # ----------------------------------------------------

        prediction = stress_model.predict(
            input_df
        )[0]

        prediction = str(
            prediction
        )

        # ----------------------------------------------------
        # Confidence
        # ----------------------------------------------------

        confidence = 0.0

        try:

            if hasattr(
                stress_model,
                "predict_proba"
            ):

                probabilities = (
                    stress_model.predict_proba(
                        input_df
                    )[0]
                )

                confidence = (
                    float(
                        np.max(
                            probabilities
                        )
                    ) * 100
                )

        except Exception as probability_error:

            print(
                "Confidence calculation warning:",
                probability_error
            )

            confidence = 0.0

        # ----------------------------------------------------
        # Dynamic Stress Score
        # ----------------------------------------------------
        #
        # The ML model predicts Low / Moderate / High,
        # but the stress score is calculated continuously
        # using the model probabilities.
        #
        # This prevents fixed scores such as:
        # Low = 3, Moderate = 6, High = 8
        #
        # ----------------------------------------------------

        stress_score = 5.0

        try:

            if hasattr(
                stress_model,
                "predict_proba"
            ):

                probabilities = (
                    stress_model.predict_proba(
                        input_df
                    )[0]
                )

                classes = stress_model.classes_

                probability_map = {
                    str(cls).lower(): float(prob)
                    for cls, prob in zip(
                        classes,
                        probabilities
                    )
                }

                low_probability = probability_map.get(
                    "low",
                    0.0
                )

                moderate_probability = probability_map.get(
                    "moderate",
                    0.0
                )

                high_probability = probability_map.get(
                    "high",
                    0.0
                )

                # Continuous 1-10 stress scale
                stress_score = (
                    (low_probability * 2.0)
                    + (moderate_probability * 5.0)
                    + (high_probability * 8.0)
                )

                stress_score = max(
                    1.0,
                    min(
                        10.0,
                        stress_score
                    )
                )

        except Exception as score_error:

            print(
                "Dynamic stress score warning:",
                score_error
            )

            # Safe fallback based on prediction
            prediction_lower = prediction.lower()

            if prediction_lower == "low":

                stress_score = 3.0

            elif prediction_lower == "moderate":

                stress_score = 6.0

            elif prediction_lower == "high":

                stress_score = 8.0

            else:

                stress_score = 5.0

        stress_score = round(
            float(stress_score),
            1
        )

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        result = {

            "status": "success",

            "prediction":
                prediction,

            "confidence":
                round(
                    confidence,
                    2
                ),

            "stress_score":
                stress_score,
            "reported_stress_score": stress_feeling_score,

        }

        print()
        print("Stress Prediction Result:")
        print(result)

        print("-" * 70)

        return jsonify(
            result
        ), 200

    # --------------------------------------------------------
    # Invalid number / input error
    # --------------------------------------------------------

    except ValueError as error:

        print()
        print(
            "Stress input validation error:"
        )

        print(error)

        return jsonify({

            "status": "error",

            "message":
                "Invalid numeric value in stress assessment.",

            "details":
                str(error)

        }), 400

    # --------------------------------------------------------
    # General error
    # --------------------------------------------------------

    except Exception as error:

        print()
        print(
            "Stress prediction error:"
        )

        print(error)

        return jsonify({

            "status": "error",

            "message":
                "Unable to generate stress prediction.",

            "details":
                str(error)

        }), 500


# ============================================================
# MOOD JOURNAL NLP
# ============================================================

@app.route(
    "/analyze-mood",
    methods=["POST"]
)
def analyze_mood_route():

    # --------------------------------------------------------
    # Check mood engine
    # --------------------------------------------------------

    if not MOOD_ENGINE_AVAILABLE:

        return jsonify({

            "status": "error",

            "message":
                "Mood NLP engine is not available."

        }), 500

    # --------------------------------------------------------
    # Get request
    # --------------------------------------------------------

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "status": "error",

                "message":
                    "No JSON data was received."

            }), 400

        text = (
            data.get("text")
            or data.get("journal")
            or data.get("entry")
            or ""
        )

        text = str(
            text
        ).strip()

        if not text:

            return jsonify({

                "status": "error",

                "message":
                    "Please provide journal text."

            }), 400

        print()
        print("-" * 70)
        print("Mood Journal Request")
        print("-" * 70)

        print("Text received.")

        # ----------------------------------------------------
        # Call local NLP engine
        # ----------------------------------------------------

        mood_result = analyze_mood(
            text
        )

        # ----------------------------------------------------
        # Ensure dictionary response
        # ----------------------------------------------------

        if isinstance(
            mood_result,
            dict
        ):

            result = mood_result.copy()

        else:

            result = {

                "result":
                    mood_result

            }

        result["status"] = "success"

        print()
        print("Mood Analysis Result:")
        print(result)

        print("MOOD AI SOURCE:", result.get("journal_insight", {}).get("ai_source", "NOT FOUND"))

        return jsonify(
            result
        ), 200

    except Exception as error:

        print()
        print(
            "Mood analysis error:"
        )

        print(error)

        return jsonify({

            "status": "error",

            "message":
                "Unable to analyze mood.",

            "details":
                str(error)

        }), 500


# ============================================================
# GENERIC SLEEP PREDICTION
# ============================================================
#
# NOTE:
# This route is kept so the existing frontend endpoint exists.
# The exact sleep-model input structure depends on the model
# that was used to create sleep_disorder_model.pkl.
#
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict_sleep():

    if not SLEEP_MODEL_AVAILABLE:

        return jsonify({

            "status": "error",

            "message":
                "Sleep disorder model is not available."

        }), 500

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "status": "error",

                "message":
                    "No JSON data was received."

            }), 400

        print()
        print("-" * 70)
        print("Sleep Prediction Request")
        print("-" * 70)

        print(data)

        input_df = pd.DataFrame(
            [data]
        )

        prediction = (
            sleep_model.predict(
                input_df
            )[0]
        )

        confidence = 0.0

        try:

            if hasattr(
                sleep_model,
                "predict_proba"
            ):

                probabilities = (
                    sleep_model.predict_proba(
                        input_df
                    )[0]
                )

                confidence = (
                    float(
                        np.max(
                            probabilities
                        )
                    ) * 100
                )

        except Exception:

            confidence = 0.0

        return jsonify({

            "status": "success",

            "prediction":
                str(prediction),

            "confidence":
                round(
                    confidence,
                    2
                )

        }), 200

    except Exception as error:

        print()
        print(
            "Sleep prediction error:"
        )

        print(error)

        return jsonify({

            "status": "error",

            "message":
                "Unable to generate sleep prediction.",

            "details":
                str(error)

        }), 500


# ============================================================
# NUTRITION ANALYSIS
# ============================================================
#
# This is a safe local calculation endpoint.
#
# It does NOT use an external API.
#
# ============================================================

@app.route(
    "/nutrition/analyze",
    methods=["POST"]
)
def nutrition_analyze():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "status": "error",

                "message":
                    "No nutrition data was received."

            }), 400

        # ----------------------------------------------------
        # Accept common nutrition field names
        # ----------------------------------------------------

        calories = float(
            data.get(
                "calories",
                0
            )
            or 0
        )

        protein = float(
            data.get(
                "protein",
                0
            )
            or 0
        )

        carbs = float(
            data.get(
                "carbs",
                0
            )
            or 0
        )

        fat = float(
            data.get(
                "fat",
                0
            )
            or 0
        )

        water = float(
            data.get(
                "waterIntake",
                data.get(
                    "water",
                    0
                )
            )
            or 0
        )

        # ----------------------------------------------------
        # Simple local wellness scoring
        # ----------------------------------------------------

        nutrition_score = 0

        if calories > 0:
            nutrition_score += 25

        if protein > 40:
            nutrition_score += 25

        elif protein > 20:
            nutrition_score += 15

        if carbs > 100:
            nutrition_score += 15

        if fat > 20:
            nutrition_score += 15

        if water >= 2000:
            nutrition_score += 20

        nutrition_score = min(
            100,
            nutrition_score
        )

        return jsonify({

            "status": "success",

            "nutritionScore":
                nutrition_score,

            "calories":
                calories,

            "protein":
                protein,

            "carbs":
                carbs,

            "fat":
                fat,

            "waterIntake":
                water

        }), 200

    except Exception as error:

        print()
        print(
            "Nutrition analysis error:"
        )

        print(error)

        return jsonify({

            "status": "error",

            "message":
                "Unable to analyze nutrition data.",

            "details":
                str(error)

        }), 500


# ============================================================
# NUTRITION FOODS
# ============================================================
#
# Local food database.
#
# You can expand this later.
#
# ============================================================

@app.route(
    "/nutrition/foods",
    methods=["GET"]
)
def nutrition_foods():

    foods = [

        {
            "name": "Rice",
            "category": "Indian Meals",
            "calories": 130,
            "protein": 2.7,
            "carbs": 28,
            "fat": 0.3
        },

        {
            "name": "Chapati",
            "category": "Indian Meals",
            "calories": 120,
            "protein": 3.5,
            "carbs": 18,
            "fat": 3
        },

        {
            "name": "Dal",
            "category": "Indian Meals",
            "calories": 116,
            "protein": 9,
            "carbs": 20,
            "fat": 0.4
        },

        {
            "name": "Poha",
            "category": "Breakfast",
            "calories": 180,
            "protein": 4,
            "carbs": 30,
            "fat": 5
        },

        {
            "name": "Upma",
            "category": "Breakfast",
            "calories": 190,
            "protein": 5,
            "carbs": 32,
            "fat": 5
        },

        {
            "name": "Idli",
            "category": "Breakfast",
            "calories": 58,
            "protein": 2,
            "carbs": 12,
            "fat": 0.4
        },

        {
            "name": "Dosa",
            "category": "Breakfast",
            "calories": 168,
            "protein": 3.9,
            "carbs": 29,
            "fat": 3.7
        },

        {
            "name": "Dal Bati",
            "category": "Dal & curries",
            "calories": 250,
            "protein": 8.0,
            "carbs": 35.0,
            "fat": 9.0,
            "fiber": 5.0
        },

        {
            "name": "Fried Rice",
            "category": "Rice & Grains",
            "calories": 160,
            "protein": 3.0,
            "carbs": 28.0,
            "fat": 4.0,
            "fiber": 2.0
        },

        {
            "name": "Paneer",
            "category": "Protein",
            "calories": 265,
            "protein": 18,
            "carbs": 6,
            "fat": 20
        },

        {
            "name": "Egg",
            "category": "Protein",
            "calories": 78,
            "protein": 6.3,
            "carbs": 0.6,
            "fat": 5.3
        },

        {
            "name": "Banana",
            "category": "Fruits",
            "calories": 89,
            "protein": 1.1,
            "carbs": 23,
            "fat": 0.3
        },

        {
            "name": "Apple",
            "category": "Fruits",
            "calories": 52,
            "protein": 0.3,
            "carbs": 14,
            "fat": 0.2
        },

        {
            "name": "Curd",
            "category": "Dairy",
            "calories": 61,
            "protein": 3.5,
            "carbs": 4.7,
            "fat": 3.3
        }
    ]

    return jsonify({

        "status": "success",

        "foods": foods

    }), 200


# ============================================================
# 404 HANDLER
# ============================================================

# ============================================================
# SMART FOOD UNDERSTANDING API
# ============================================================

@app.route("/analyze-food", methods=["POST"])
def analyze_food():

    data = request.get_json(silent=True) or {}

    food_name = str(
        data.get("food_name", data.get("food", ""))
    ).strip()

    if not food_name:
        return jsonify({
            "status": "error",
            "message": "Please provide a food_name."
        }), 400

    # Match the submitted food against the local food database.
    available_food_names = list(NUTRITION_DATABASE.keys())

    understanding = understand_food(
        food_name,
        available_food_names=available_food_names
    )

    canonical_name = understanding.get("canonical_name")

    if understanding.get("status") != "success" or not canonical_name:
        return jsonify({
            "status": "needs_more_context",
            "message": (
                "This food could not be matched confidently. "
                "Try another name or provide more details."
            ),
            "food_name": food_name,
            "understanding": understanding,
            "nutrition_available": False
        }), 200

    # Resolve the matched key without inventing nutrition values.
    matched_key = str(canonical_name).strip().lower()

    nutrition = NUTRITION_DATABASE.get(matched_key)

    if nutrition is None:
        return jsonify({
            "status": "success",
            "food_name": food_name,
            "recognized_food": canonical_name,
            "match_type": understanding.get("match_type"),
            "confidence": understanding.get("confidence"),
            "nutrition_available": False,
            "message": (
                "The food was recognized, but nutrition data "
                "is not available in the local nutrition database."
            )
        }), 200

    return jsonify({
        "status": "success",
        "food_name": food_name,
        "recognized_food": nutrition.get("name", canonical_name),
        "match_type": understanding.get("match_type"),
        "confidence": understanding.get("confidence"),
        "nutrition_available": True,
        "nutrition_basis": "local nutrition database",
        "nutrition_per_100g": {
            "calories": nutrition.get("calories"),
            "protein": nutrition.get("protein"),
            "carbs": nutrition.get("carbs"),
            "fat": nutrition.get("fat"),
            "fiber": nutrition.get("fiber")
        }
    }), 200

@app.errorhandler(404)
def page_not_found(error):

    return jsonify({

        "status": "error",

        "message":
            "API endpoint not found.",

        "available_endpoints": [

            "GET /",

            "GET /health",

            "POST /predict",

            "POST /predict-stress",

            "POST /analyze-mood",

            "POST /nutrition/analyze",

            "GET /nutrition/foods"

        ]

    }), 404


# ============================================================
# GLOBAL ERROR HANDLER
# ============================================================

@app.errorhandler(500)
def internal_server_error(error):

    return jsonify({

        "status": "error",

        "message":
            "Internal server error."

    }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("Starting MindNutri Flask Backend...")
    print("Backend URL: http://127.0.0.1:5000")
    print("Health URL: http://127.0.0.1:5000/health")
    print("Stress API: http://127.0.0.1:5000/predict-stress")
    print("Mood API: http://127.0.0.1:5000/analyze-mood")
    print("=" * 70)
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )