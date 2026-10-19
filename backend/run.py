import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting FrontFix AI Backend Server (Team B)")
    print("📡 Local API Server: http://127.0.0.1:8000")
    print("📖 Swagger API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
