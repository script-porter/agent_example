"""Flow 数据持久化 —— 基于 JSON 文件的 CRUD"""

import json
import os
import time
import random
import string
from datetime import datetime, timezone

from flow import Flow, FlowEdge, FlowNode

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "flow.json")


def _to_flow(item: dict) -> Flow:
    """将 dict 转为 Flow 数据类"""
    nodes = [
        FlowNode(
            id=n["id"],
            type=n["type"],
            position=n.get("position", {}),
            data=n.get("data", {}),
            parentId=n.get("parentId"),
            extent=n.get("extent"),
            style=n.get("style", {}),
        )
        for n in item.get("nodes", [])
    ]
    edges = [
        FlowEdge(
            id=e["id"],
            source=e["source"],
            target=e["target"],
            animated=e.get("animated", False),
            style=e.get("style", {}),
        )
        for e in item.get("edges", [])
    ]
    return Flow(
        id=item["id"],
        name=item["name"],
        description=item.get("description", ""),
        nodes=nodes,
        edges=edges,
        createdAt=item.get("createdAt", ""),
        updatedAt=item.get("updatedAt", ""),
    )


def _from_flow(flow: Flow) -> dict:
    """将 Flow 数据类转为 dict"""
    return {
        "id": flow.id,
        "name": flow.name,
        "description": flow.description,
        "nodes": [
            {
                "id": n.id,
                "type": n.type,
                "position": n.position,
                "data": n.data,
                **({"parentId": n.parentId} if n.parentId else {}),
                **({"extent": n.extent} if n.extent else {}),
                **({"style": n.style} if n.style else {}),
            }
            for n in flow.nodes
        ],
        "edges": [
            {
                "id": e.id,
                "source": e.source,
                "target": e.target,
                **({"animated": e.animated} if e.animated else {}),
                **({"style": e.style} if e.style else {}),
            }
            for e in flow.edges
        ],
        "createdAt": flow.createdAt,
        "updatedAt": flow.updatedAt,
    }


class FlowTable:
    """基于 JSON 文件的 Flow 数据表"""

    def __init__(self, db_path: str | None = None):
        self.db_path = db_path or DEFAULT_DB_PATH
        self._ensure_db()

    # ---------- 文件 I/O ----------

    def _ensure_db(self) -> None:
        if not os.path.exists(self.db_path):
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_db(self) -> list[dict]:
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _write_db(self, data: list[dict]) -> None:
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # ---------- CRUD ----------

    def get_all(self) -> list[Flow]:
        return [_to_flow(item) for item in self._read_db()]

    def get_all_dicts(self) -> list[dict]:
        return self._read_db()

    def get_by_id(self, flow_id: str) -> Flow | None:
        for item in self._read_db():
            if item["id"] == flow_id:
                return _to_flow(item)
        return None

    def search(self, keyword: str) -> list[Flow]:
        kw = keyword.lower()
        return [
            _to_flow(item)
            for item in self._read_db()
            if kw in item.get("name", "").lower()
            or kw in item.get("description", "").lower()
        ]

    def create(self, data: dict) -> Flow:
        flows = self._read_db()
        now = datetime.now(timezone.utc).isoformat()
        flow = {
            "id": self._generate_id(),
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", []),
            "createdAt": now,
            "updatedAt": now,
        }
        flows.append(flow)
        self._write_db(flows)
        return _to_flow(flow)

    def update(self, flow_id: str, data: dict) -> Flow | None:
        flows = self._read_db()
        for i, item in enumerate(flows):
            if item["id"] == flow_id:
                updated = {
                    "id": item["id"],
                    "name": data.get("name", item["name"]),
                    "description": data.get("description", item.get("description", "")),
                    "nodes": data.get("nodes", item["nodes"]),
                    "edges": data.get("edges", item["edges"]),
                    "createdAt": item.get("createdAt", ""),
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                }
                flows[i] = updated
                self._write_db(flows)
                return _to_flow(updated)
        return None

    def save(self, flow: Flow) -> Flow:
        existing = self.get_by_id(flow.id)
        if existing:
            result = self.update(flow.id, _from_flow(flow))
            if result:
                return result
        return self.create(_from_flow(flow))

    def set_flow(
        self, flow_id: str, nodes: list[dict], edges: list[dict]
    ) -> Flow | None:
        return self.update(flow_id, {"nodes": nodes, "edges": edges})

    def delete(self, flow_id: str) -> bool:
        flows = self._read_db()
        filtered = [f for f in flows if f["id"] != flow_id]
        if len(filtered) == len(flows):
            return False
        self._write_db(filtered)
        return True

    def count(self) -> int:
        return len(self._read_db())

    # ---------- 工具 ----------

    @staticmethod
    def _generate_id() -> str:
        suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"flow_{int(time.time() * 1000)}_{suffix}"


# 单例
flow_table = FlowTable()
