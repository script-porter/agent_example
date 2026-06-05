import os
import re
from dataclasses import dataclass, field


@dataclass
class Skill:
    name: str
    description: str


@dataclass
class SkillWithContent(Skill):
    content: str = ""


class SkillLoader:
    """从 skills/ 目录加载所有 SKILL.md 文件"""

    SkillDir: str = "skills"
    skills: list[Skill] = field(default_factory=list)
    _map_content: dict[str, SkillWithContent] = field(default_factory=dict)

    def __init__(self):
        self.skills = []
        self._map_content = {}
        self._get_skills()

    def _get_skills(self) -> None:
        """同步加载 skills/ 目录下所有 SKILL.md"""
        # skills 目录在项目根目录
        skills_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            self.SkillDir,
        )

        if not os.path.exists(skills_dir):
            print(f"[SkillLoader] skills 目录不存在: {skills_dir}")
            return

        entries = self._walk_dir(skills_dir)
        entries = [f for f in entries if os.path.basename(f) == "SKILL.md"]

        for entry in entries:
            with open(entry, "r", encoding="utf-8") as f:
                content = f.read()

            name_match = re.search(r"^name:\s*(.*)$", content, re.MULTILINE)
            desc_match = re.search(r"^description:\s*(.*)$", content, re.MULTILINE)

            name = name_match.group(1).strip() if name_match else None
            description = desc_match.group(1).strip() if desc_match else None

            if name and description:
                self.skills.append(Skill(name=name, description=description))
                self._map_content[name] = SkillWithContent(
                    name=name, description=description, content=content
                )

        print(f"[SkillLoader] 加载了 {len(self.skills)} 个技能")

    def _walk_dir(self, directory: str) -> list[str]:
        """递归遍历目录，返回所有文件路径"""
        result: list[str] = []
        for item in os.listdir(directory):
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path):
                result.extend(self._walk_dir(full_path))
            else:
                result.append(full_path)
        return result

    def get_skill_by_name(self, name: str) -> SkillWithContent | None:
        return self._map_content.get(name)
