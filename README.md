# 🍲 WasteLess AI — Food-Waste Prevention & Surplus Recovery Platform

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-13%20Passed-brightgreen?style=for-the-badge&logo=pytest)](https://docs.pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**An intelligent food-waste prevention, staged batch cooking, and surplus recovery platform engineered for institutional dining halls, college messes, hostel cafeterias, and high-volume commercial kitchens.**

[Overview](#-executive-overview) •
[Architecture](#-system-architecture--tech-stack) •
[ML Benchmark](#-machine-learning-benchmark--integrity) •
[Features](#-operational-modules--features) •
[Quickstart](#-quickstart-guide) •
[API Reference](#-backend-api-reference) •
[Repository](https://github.com/MDADILIFTEKHAR/WESTLESS-AI.git)

</div>

---

## 📋 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Machine Learning Benchmark & Integrity](#-machine-learning-benchmark--integrity)
  - [Dataset & Feature Engineering](#dataset--feature-engineering)
  - [Zero-Temporal-Leakage Guarantee](#zero-temporal-leakage-guarantee)
  - [Model Evaluation Results](#model-evaluation-results)
- [Operational Modules & Features](#-operational-modules--features)
  - [1. Overview Dashboard](#1-overview-dashboard)
  - [2. AI Waste Predictor & Staged Batch Cooking](#2-ai-waste-predictor--staged-batch-cooking)
  - [3. Kitchen Scale Waste Logs](#3-kitchen-scale-waste-logs)
  - [4. Inventory & Shelf-Life Tracker](#4-inventory--shelf-life-tracker)
  - [5. Audited Surplus Rescue & Pickup Workflow](#5-audited-surplus-rescue--pickup-workflow)
  - [6. Model Insights & Distribution Analytics](#6-model-insights--distribution-analytics)
  - [7. System Settings & Seed Diagnostics](#7-system-settings--seed-diagnostics)
- [Project Directory Structure](#-project-directory-structure)
- [Quickstart Guide](#-quickstart-guide)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Install Backend Dependencies](#2-install-backend-dependencies)
  - [3. Train & Evaluate ML Pipeline](#3-train--evaluate-ml-pipeline)
  - [4. Run Automated Backend Tests](#4-run-automated-backend-tests)
  - [5. Launch FastAPI Backend Service](#5-launch-fastapi-backend-service)
  - [6. Launch React + Vite Frontend UI](#6-launch-react--vite-frontend-ui)
- [Backend API Reference](#-backend-api-reference)
- [Environment Configuration](#-environment-configuration)
- [Integrity & Data Provenance Commitments](#-integrity--data-provenance-commitments)
- [Contributing & License](#-contributing--license)

---

## 🌟 Executive Overview

Institutional dining environments (college messes, corporate cafeterias, hostel pantries) grapple with a persistent dilemma:
- **Overpreparation**: Preparing excess food out of fear of running out, producing metric tons of unconsumed food sent directly to landfills.
- **Shortage Risk**: Cutting preparation too aggressively risks running short during peak meal service, resulting in hungry diners and operational crises.
- **Perishable Spoilage**: Ingredients sitting silently past their shelf-life due to lack of visibility.

**WasteLess AI solves this challenge through an integrated three-layer defense:**
1. **Predictive Analytics ($R^2 = 0.920$, MAE $= 4.72$ kg)**: Estimates unconsumed food before preparation begins, with $90\%$ confidence interval bounds.
2. **Staged Batch Cooking & Safety Buffer**: Prescribes split-batch cooking ($65\%$ initial prep, $35\%$ contingent midpoint prep) with a mandatory $+5\%$ safety margin so kitchens never run short while slashing waste by up to $30\%$.
3. **Audit-Trail Surplus Recovery**: Automates food-safety verified donation tracking from dining hall leftovers to verified local charities and NGOs.

---

## 🏗️ System Architecture & Tech Stack

```
[ Dining Hall Director / Mess Supervisor / Kitchen Chef ]
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│        Frontend Client (React 18 + TypeScript + Vite)        │
│  - Tailwind CSS UI with High-Contrast Dark Theme             │
│  - 7 Operational Views (Dashboard, Predict, Logs, Stock...)   │
│  - Recharts Visualizations & Lucide Icons                    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON (via Vite Reverse Proxy)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│               FastAPI High-Performance Backend               │
│  - Asynchronous Uvicorn Service (Python 3.10+)               │
│  - Pydantic v2 Schema Validation & Comprehensive Routing     │
│  - CORS Middleware & Automatic Swagger /docs OpenAPI Spec    │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    SQLite Database (ORM)     │ │  Scikit-Learn ML Pipeline   │
│  - waste_logs                │ │  - Ridge Regression (L2)    │
│  - inventory_items           │ │  - Robust Scaler & Imputer  │
│  - surplus_listings          │ │  - 90% Confidence Estimator │
│  - prediction_logs           │ │  - models/food_waste_...    │
└──────────────────────────────┘ └─────────────────────────────┘
```

### Technology Highlights
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React.
- **Backend**: FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, SQLite.
- **Machine Learning**: Scikit-Learn, Pandas, NumPy, Joblib.
- **Testing**: Pytest, HTTPX TestClient (13/13 passing automated test suite).

---

## 🔬 Machine Learning Benchmark & Integrity

### Dataset & Feature Engineering
Trained on the **Kaggle Messy Food Waste Prediction Dataset** (`data/raw/train.csv`, 911 historical service records):
- **Target Variable**: `food_waste_kg` (Continuous non-negative float: 10.8 kg to 274.3 kg).
- **Engineered Features**:
  - `meals_served`: Planned diner headcount (pre-meal register booking count).
  - `kitchen_staff`: Number of cooks and assistants on shift ($5$ to $19$).
  - `temperature_C` & `humidity_percent`: Environmental kitchen weather readings.
  - `day_of_week`: Day index ($0 =$ Monday, $\dots$, $6 =$ Sunday).
  - `special_event`: Binary flag ($0 =$ Standard meal, $1 =$ Feast/Festival).
  - `past_waste_kg`: Historic unconsumed baseline for the recipe.
  - `staff_experience`: Categorical skill level (`Beginner`, `Intermediate`, `Expert`).
  - `waste_category`: Primary food group (`Dairy`, `Grains`, `Meat`, `Vegetables`).

### Zero-Temporal-Leakage Guarantee
> [!IMPORTANT]
> In real kitchen operations, the exact number of meals consumed cannot be known before service. WasteLess AI strictly operationalizes this feature as **Expected Planned Diners** from hostel registers. The training partition strictly uses past chronological records (80%, Jan 2022 – Feb 2024), evaluated on an unseen future held-out test partition (20%, Mar 2024 – Sep 2024).

### Model Evaluation Results
Evaluated on **183 chronologically held-out future records**:

| Estimator Model | Test MAE (kg) | Test RMSE (kg) | Test $R^2$ Score | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline (Median Dummy)** | 12.699 kg | 25.576 kg | -0.005 | ❌ Benchmark |
| **Ridge Regression (L2, $\alpha=10$)** 🏆 | **4.718 kg** | **7.222 kg** | **0.920** | ✅ **Selected Production Model** |
| **Random Forest Regressor** | 5.174 kg | 7.937 kg | 0.903 | 🥈 Runner-up |
| **HistGradientBoosting** | 5.792 kg | 8.902 kg | 0.878 | 🥉 Baseline |

#### Breakdown by Food Category (Ridge Model)
| Food Category | Samples Tested | Mean Actual (kg) | Mean Predicted (kg) | Category MAE (kg) |
| :--- | :---: | :---: | :---: | :---: |
| **Grains** | 40 | 39.91 kg | 41.27 kg | **3.999 kg** |
| **Vegetables** | 44 | 44.60 kg | 44.60 kg | **4.101 kg** |
| **Meat** | 67 | 43.43 kg | 44.00 kg | **5.186 kg** |
| **Dairy** | 32 | 47.19 kg | 50.25 kg | **5.485 kg** |

---

## ⚡ Operational Modules & Features

### 1. Overview Dashboard
- **Executive KPI Cards**: Total Food Prepared (kg), Measured Waste Rate (%), Estimated Cost Loss ($), and Rescued Surplus (kg).
- **Critical Expiry Banner**: High-priority alert banner dynamically signaling ingredients expiring in $\le 72$ hours.
- **Historical Trends Chart**: 10-day interactive area chart showing planned prep vs unconsumed leftovers.
- **Transparent Provenance Badges**: Explicitly marks which statistics stem from verified scale logs, machine learning models, or local rescue workflows.

### 2. AI Waste Predictor & Staged Batch Cooking
- **Scenario Simulator**: Input diner counts, staff, weather, recipe category, and past waste benchmark.
- **90% Confidence Interval**: Provides an upper and lower bound (`[lower, upper]`) representing uncertainty.
- **Smart Staged Cooking**:
  - **Batch 1 (Initial)**: $65\%$ of planned preparation cooked at service launch.
  - **Batch 2 (Contingent)**: $35\%$ cooked midway based on actual footfall.
  - **Safety Margin Buffer**: Configurable $+5\%$ standard margin to eliminate kitchen shortage risk.
- **Manager Override Ledger**: Records kitchen supervisor adjustments with reason logging in SQLite for continuous auditability.

### 3. Kitchen Scale Waste Logs
- Direct physical logging of meal services: planned diners, prepared weight, served weight, and remaining leftovers.
- Automated calculation of leftover weight and percentage waste without double counting.
- Root cause attribution: Overpreparation, Low Attendance, Quality Spoilage, or Portion Size.

### 4. Inventory & Shelf-Life Tracker
- Deterministic automated classification:
  - 🔴 **Expired**: Past use-by date.
  - 🟠 **Expiring Soon**: $\le 3$ days remaining.
  - 🟡 **Low Stock**: Quantity $\le$ minimum safety threshold.
  - 🟢 **Safe**: Healthy operational inventory.
- One-click $+10$ kg restock and $-5$ kg consumption adjustment buttons.

### 5. Audited Surplus Rescue & Pickup Workflow
- Multi-step donation state machine:
  $$\text{Pending Review} \longrightarrow \text{Available} \longrightarrow \text{Claimed} \longrightarrow \text{Collected}$$
- Mandatory food safety verification sign-off by duty chef before publishing.
- Verified recipient NGO logging and pickup verification codes.

### 6. Model Insights & Distribution Analytics
- Side-by-side ML benchmark model leaderboard (Dummy vs Ridge vs Random Forest vs Boosting).
- Food waste distribution by recipe category and meal service (Breakfast, Lunch, Dinner, Snacks).
- Operational root-cause breakdown charts.

### 7. System Settings & Seed Diagnostics
- Dining facility profile, capacity ceilings, and safety buffer margin customization.
- **Seed Realistic Demo Data**: Instantly populates the database with realistic mess records.
- **Factory Reset Database**: Cleanses local SQLite storage for fresh deployments.

---

## 📂 Project Directory Structure

```
WASTELESS-AI/
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules (DB, node_modules, cache)
├── LICENSE                     # MIT Open Source License
├── README.md                   # Project overview & complete documentation
├── requirements.txt            # Python backend & ML requirements
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, lifespan & CORS
│   │   ├── config.py           # Pydantic Settings configuration
│   │   ├── database.py         # SQLAlchemy engine & SQLite session
│   │   ├── models.py           # Database ORM models
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── routers/            # Modular API routers
│   │   │   ├── health.py       # Health check & system status
│   │   │   ├── prediction.py   # AI waste prediction & override ledger
│   │   │   ├── waste_logs.py   # Kitchen scale logs CRUD
│   │   │   ├── inventory.py    # Ingredient inventory & shelf-life CRUD
│   │   │   ├── surplus.py      # Audited surplus donation workflow
│   │   │   └── dashboard.py    # Aggregated metrics, charts & insights
│   │   └── services/           # Business logic & demo seed data
│   └── tests/
│       └── test_backend.py     # 13 comprehensive automated Pytest tests
├── data/
│   └── raw/                    # Kaggle Messy Food Waste dataset CSVs
│       ├── train.csv           # 911 rows historical kitchen records
│       ├── test.csv            # Unlabeled evaluation records
│       └── submission.csv      # Sample submission template
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable scorecards, badges, modals
│   │   ├── views/              # 7 Primary operational views
│   │   ├── services/           # Typed API client services
│   │   ├── types/              # TypeScript interfaces & types
│   │   ├── App.tsx             # Root application shell & navigation
│   │   └── index.css           # Tailwind CSS directives
│   ├── package.json            # Frontend dependencies & scripts
│   ├── tailwind.config.js      # Tailwind design configuration
│   └── vite.config.ts          # Vite bundler & API reverse proxy
├── ml/
│   ├── train_model.py          # Model training pipeline with cross-validation
│   ├── evaluate_model.py       # Held-out evaluation & category breakdown
│   ├── inspect_dataset.py      # Exploratory dataset analysis utility
│   └── predict.py              # Standalone inference & staged batch engine
├── models/
│   └── food_waste_pipeline.joblib # Serialized scikit-learn Ridge model
└── reports/
    └── model_metrics.json      # Complete held-out evaluation report
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.10, 3.11, 3.12, or 3.13
- **Node.js**: 18.x or later (with npm 9+)
- **Git**: Installed and configured

### 1. Clone Repository
```bash
git clone https://github.com/MDADILIFTEKHAR/WESTLESS-AI.git
cd WESTLESS-AI
```

### 2. Install Backend Dependencies
```bash
# Optional: create and activate a virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
# source venv/bin/activate

# Install required Python packages
pip install -r requirements.txt
```

### 3. Train & Evaluate ML Pipeline
*(Pre-trained model is already included in `models/`, but you can re-run at any time):*
```bash
# Train Ridge model with zero-leakage chronological split
python ml/train_model.py

# Evaluate on held-out test data
python ml/evaluate_model.py
```

### 4. Run Automated Backend Tests
Verify all 13 backend and ML tests pass:
```bash
python -m pytest backend/tests -v
```

### 5. Launch FastAPI Backend Service
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```
- API will be accessible at: `http://127.0.0.1:8001`
- Interactive Swagger documentation at: `http://127.0.0.1:8001/docs`

### 6. Launch React + Vite Frontend UI
Open a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Web dashboard will be live at: `http://localhost:5173/`

---

## 📡 Backend API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, DB connectivity, and ML model loaded status |
| `GET` | `/api/dashboard/summary` | Aggregated executive KPIs (prep, waste rate, cost, rescued) |
| `GET` | `/api/dashboard/insights` | Category, meal type, and trend statistics |
| `POST` | `/api/predict-waste` | ML waste prediction with uncertainty bounds & staged batching |
| `POST` | `/api/predict-waste/override` | Log kitchen supervisor floor override with audit note |
| `GET` | `/api/waste-logs` | Retrieve historical physical kitchen scale logs |
| `POST` | `/api/waste-logs` | Record new meal service scale measurement |
| `DELETE`| `/api/waste-logs/{id}` | Delete waste log entry |
| `GET` | `/api/inventory` | List tracked ingredient batches with computed expiry status |
| `POST` | `/api/inventory` | Add new ingredient shipment |
| `PATCH`| `/api/inventory/{id}` | Adjust stock quantity or update expiry parameters |
| `DELETE`| `/api/inventory/{id}` | Remove inventory record |
| `GET` | `/api/surplus-listings` | List surplus food donations |
| `POST` | `/api/surplus-listings` | Submit surplus food for rescue review |
| `PATCH`| `/api/surplus-listings/{id}/status` | Advance status (`available`, `claimed`, `collected`) |
| `GET` | `/api/model/metrics` | Retrieve complete ML benchmark evaluation metrics |
| `POST` | `/api/demo/seed` | Seed realistic operational mess data |
| `POST` | `/api/demo/reset` | Clear operational tables |

### Sample Prediction Request (`POST /api/predict-waste`)
```json
{
  "meals_served": 450,
  "kitchen_staff": 12,
  "temperature_C": 28.5,
  "humidity_percent": 65.0,
  "day_of_week": 4,
  "special_event": 0,
  "past_waste_kg": 38.0,
  "staff_experience": "Intermediate",
  "waste_category": "Grains"
}
```

### Sample Prediction Response
```json
{
  "predicted_waste_kg": 39.42,
  "confidence_interval": {
    "lower_bound_kg": 27.54,
    "upper_bound_kg": 51.30,
    "confidence_level": 0.90
  },
  "staged_batch_recommendation": {
    "target_preparation_kg": 202.5,
    "batch_1_prep_kg": 131.6,
    "batch_2_prep_kg": 70.9,
    "safety_buffer_margin_percent": 5.0,
    "operational_directive": "Cook 65% upfront; hold remaining 35% contingent on diner check-ins 45 minutes into service."
  }
}
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` to customize settings:
```ini
# Backend SQLite Database URL
DATABASE_URL=sqlite:///./wasteless.db

# Backend Port and Host
PORT=8001
HOST=127.0.0.1

# Environment
ENVIRONMENT=development

# Frontend Proxy Target (configured in frontend/vite.config.ts)
VITE_API_URL=http://127.0.0.1:8001
```

---

## 🛡️ Integrity & Data Provenance Commitments

1. **Transparent Data Provenance**: In the dashboard, all metric displays explicitly indicate their underlying data source:
   - 🟢 **Verified Scale Measurements**: Real food weights logged at kitchen scales.
   - 🔵 **Predictive Intelligence**: Scikit-Learn regression outputs with uncertainty bounds.
   - 🟣 **Simulated Rescue Protocol**: Local multi-stage donation ledger with mandatory food safety sign-offs.
2. **Shortage Protection Guarantee**: Machine learning predictions never directly reduce meal preparation without the mandatory $+5\%$ safety buffer margin and manager review.
3. **Data Privacy & Local Operation**: WasteLess AI functions entirely on local infrastructure with SQLite; no proprietary operational kitchen data is transmitted externally.

---

## 👥 Contributing & License

Contributions, bug reports, and feature proposals are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by [Md Adil Iftekhar](https://github.com/MDADILIFTEKHAR).
