# Marine Oil Spill Detection

## Project Overview
This project consists of a Python Flask backend for image processing and a Next.js frontend dashboard.

## Prerequisites
- Python 3.8+
- Node.js 16+

## Getting Started

### 1. Start the Backend
The backend handles the machine learning model and database authentication.

```bash
cd backend
# Create virtual environment (optional)
# python -m venv venv
# source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```
The server will start on `http://localhost:5000`.

### 2. Start the Frontend
The frontend is built with Next.js.

```bash
cd marine-oil-spill-dashboard
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

## Troubleshooting
- **Login Error**: Ensure the backend is running on port 5000.
- **Database**: The SQLite database `users.db` is located in the root directory (or `backend` folder depending on execution).
