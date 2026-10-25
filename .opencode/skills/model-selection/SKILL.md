---
name: model-selection
description: Use ONLY when choosing which model drives the primary agent or subagents. Enforces OpenCode Go/Kimi 2.7 code as the main agent and OpenCode Go Muse Spark or DeepSeek for delegated subagent tasks.
---

# Model selection policy

When planning or executing work, assign models according to this policy.

## Primary agent

Use **OpenCode Go/Kimi 2.7 code** as the main agent. It owns:
- Understanding the user's request.
- Planning and sequencing steps.
- Editing, writing, and validating code.
- Driving the conversation and deciding when to delegate.

## Subagents

When delegating work via the `task` tool, prefer one of:
- **OpenCode Go Muse Spark**
- **DeepSeek**

Choose between them based on the subtask:
- Use **Muse Spark** for creative, exploratory, open-ended research, or tasks that benefit from breadth.
- Use **DeepSeek** for deep reasoning, complex analysis, code review, debugging, or tasks that benefit from depth.

## Declaring agents

If the project has an `opencode.json` or agent files, prefer explicit declarations under `agent` with the appropriate model assignment. Agents used for delegation should set `mode: subagent`.

Example shape:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "primary": {
      "description": "Main driver for all tasks",
      "mode": "primary",
      "model": "opencode-go/kimi-k2.7-code"
    },
    "explore": {
      "description": "Subagent for exploratory work",
      "mode": "subagent",
      "model": "opencode-go/muse-spark"
    },
    "analyse": {
      "description": "Subagent for deep analysis",
      "mode": "subagent",
      "model": "opencode-go/deepseek"
    }
  }
}
```

Verify the exact model identifiers against the current provider catalog before relying on them.
