from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.analyze import router as analyze_router
from app.routes.history import router as history_router
from app.routes.chat import router as chat_router

app = FastAPI(title="Medical Report Interpreter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(history_router)
app.include_router(chat_router)
@app.get("/")
def root():
    return {"status": "API is running!"}
