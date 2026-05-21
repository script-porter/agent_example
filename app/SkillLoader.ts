import fs from "fs";
import path from "path";

export class Skill {
  constructor(
    public name: string,
    public description: string,
  ) {}
}

export class SkillLoader {
  SkillDir: string = "skills";
  skills: Skill[] = [];
  mapContent: Map<string, Skill & { content: string }> = new Map();

  constructor() {
    this.getSkills();
  }

  /** 同步加载 skills/ 目录下所有 SKILL.md */
  private getSkills() {
    const skillsDir = path.resolve(process.cwd(), this.SkillDir);

    if (!fs.existsSync(skillsDir)) {
      console.warn(`[SkillLoader] skills 目录不存在: ${skillsDir}`);
      return;
    }

    // 递归扫描所有 SKILL.md 文件
    const entries = this.walkDir(skillsDir).filter(
      (f) => path.basename(f) === "SKILL.md",
    );

    for (const entry of entries) {
      const content = fs.readFileSync(entry, "utf-8");

      // 解析 YAML front matter：name 和 description
      const nameMatch = content.match(/^name:\s*(.*)$/m);
      const descMatch = content.match(/^description:\s*(.*)$/m);

      const name = nameMatch?.[1]?.trim() ?? null;
      const description = descMatch?.[1]?.trim() ?? null;

      if (name && description) {
        this.skills.push(new Skill(name, description));
        this.mapContent.set(name, { name, description, content });
      }
    }

    console.log(`[SkillLoader] 加载了 ${this.skills.length} 个技能`);
  }

  /** 递归遍历目录，返回所有文件路径 */
  private walkDir(dir: string): string[] {
    const result: string[] = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        result.push(...this.walkDir(fullPath));
      } else {
        result.push(fullPath);
      }
    }
    return result;
  }

  getSkillByName(name: string) {
    return this.mapContent.get(name);
  }
}
