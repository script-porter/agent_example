"""Flow CRUD + Execute 路由"""

from fastapi import APIRouter, HTTPException, Request
from db.flow_table import flow_table

router = APIRouter(prefix="/flow", tags=["flow"])


@router.get("/")
async def get_all_flows():
    """获取所有流程列表"""
    flows = flow_table.get_all_dicts()
    return {"code": 0, "data": flows, "total": len(flows)}


@router.get("/search/{keyword}")
async def search_flows(keyword: str):
    """搜索流程"""
    flows = flow_table.search(keyword)
    return {
        "code": 0,
        "data": [flow_table.get_all_dicts()[i] for i, _ in enumerate(flows)],
        "total": len(flows),
    }


@router.get("/{flow_id}")
async def get_flow(flow_id: str):
    """按 ID 获取单个流程"""
    flow = flow_table.get_by_id(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail={"code": 404, "message": "流程不存在"})
    # 返回原始 dict
    flows = flow_table._read_db()
    item = next((f for f in flows if f["id"] == flow_id), None)
    return {"code": 0, "data": item}


@router.post("/")
async def create_flow(request: Request):
    """新建流程"""
    try:
        body = await request.json()
        flow = flow_table.create(body)
        return {"code": 0, "data": flow, "message": "创建成功"}
    except Exception as e:
        raise HTTPException(status_code=400, detail={"code": 400, "message": str(e)})


@router.put("/{flow_id}")
async def update_flow(flow_id: str, request: Request):
    """更新流程"""
    body = await request.json()
    flow = flow_table.update(flow_id, body)
    if not flow:
        raise HTTPException(status_code=404, detail={"code": 404, "message": "流程不存在"})
    return {"code": 0, "data": flow, "message": "更新成功"}


@router.delete("/{flow_id}")
async def delete_flow(flow_id: str):
    """删除流程"""
    ok = flow_table.delete(flow_id)
    if not ok:
        raise HTTPException(status_code=404, detail={"code": 404, "message": "流程不存在"})
    return {"code": 0, "message": "删除成功"}


@router.post("/execute")
async def execute_flow(request: Request):
    """执行编排"""
    body = await request.json()
    print(body)
    return {"message": "execute flow", "data": body}
