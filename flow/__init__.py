from dataclasses import dataclass, field
from typing import Any


@dataclass
class FlowNode:
    id: str
    type: str
    position: dict[str, float]
    data: dict[str, Any] = field(default_factory=dict)
    parentId: str | None = None
    extent: str | None = None
    style: dict[str, Any] = field(default_factory=dict)


@dataclass
class FlowEdge:
    id: str
    source: str
    target: str
    animated: bool = False
    style: dict[str, Any] = field(default_factory=dict)


@dataclass
class Flow:
    id: str
    name: str
    description: str
    nodes: list[FlowNode]
    edges: list[FlowEdge]
    createdAt: str
    updatedAt: str
