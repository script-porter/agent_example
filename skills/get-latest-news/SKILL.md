---
name: get-latest-news
description: 通过网络各种渠道实时获取最新新闻时政科技相关的消息。
---

# news - 最新新闻时政科技相关信息查询

## 如何使用

当用户查询新闻、时政科技、财经等新闻相关的信息时调用。

## 输出示例

### 1. 输出Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "description": "最新的新闻时政科技相关的消息。",
  "properties": {
    "title": {
      "type": "string",
      "description": "新闻标题。"
    },
    "content": {
      "type": "string",
      "description": "新闻内容。"
    },
    "source": {
      "type": "string",
      "description": "新闻来源。"
    },
    "date": {
      "type": "string",
      "description": "新闻日期。"
    }
  }
}
```

### 2. 输出结果示例

```json
{
  "title": "普京访华",
  "content": "2026年5月19日-20日，俄罗斯总统普京访华......",
  "source": "俄罗斯新闻",
  "date": "2026-05-19 10:00:00"
}
```

## 执行流程

1. 调用内置的`searchTool`工具，查询用户输入的新闻时政科技相关的信息。
2. 获取到结果后，从内置的`searchTool`工具结果列表中提取最新的新闻时政科技相关消息。
3. 对返回的新闻列表按 `date（日期时间）` 降序排列，选取日期最新的第一条且与 `query` 语义匹配的新闻。
4. 若无匹配结果，返回空内容并按错误处理。
