"""FastAPI 服务入口"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import setup_config
from router.agent_route import router as flow_router
from router.chat_route import router as chat_router

# 加载环境变量
setup_config()

app = FastAPI(title="Agent Demo", version="1.0.0")

# CORS 跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== 路由挂载 ==========

@app.get("/")
async def root():
    return {"message": "Hello World!"}

app.include_router(flow_router)
app.include_router(chat_router)

# ========== 启动服务 ==========

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info",
    )
