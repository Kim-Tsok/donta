# One workflow for your coding agents

The agent setup feature is available in CLI 0.2.0 and later. From this checkout, run:

```sh
npm run donta -- agents /path/to/your-app
```

With the updated CLI installed:

```sh
donta agents .
donta agents . --dry-run
donta agents . --agents codex,claude,gemini --yes
donta agents . --agents all
```

Default agents are Codex, Claude Code and Gemini CLI. `all` adds Cursor. New projects automatically include the three default adapters; customize creation with `donta create my-app --agents codex,cursor`.

For an existing app, run `donta add .` if you need the backend, then `donta agents .` to set up agent guidance. Agent setup also works in a package-based project that has no donta backend; it detects available scripts and paths rather than inventing them.

## What gets written

- `AGENTS.md`: one shared workflow and detected project context. Existing guidance stays intact; donta adds a managed block.
- `CLAUDE.md`: imports `AGENTS.md` for Claude Code, preserving existing content and imports.
- `GEMINI.md`: imports `AGENTS.md` for Gemini CLI, preserving existing content and imports.
- `.cursor/rules/donta.mdc`: optional project-wide rule directing Cursor to the shared context.
- `.agents/donta/README.md`: task, review and handoff workflow with copyable prompts.
- `.agents/donta/TASK.md`: scope, acceptance criteria, implementation plan and results.
- `.agents/donta/HANDOFF.md`: current state, changed files, checks, remaining work and the next action.

Selecting Claude, Gemini or Cursor still creates AGENTS.md because it is the shared source of truth. If a root AGENTS.override.md exists and Codex is selected, setup preserves it and adds a reference to the shared workflow.

The CLI does not install agents, launch model sessions, configure API keys, change agent permissions or run project scripts. Install and authenticate each agent through its own supported setup. Agent output and instruction-following vary; this is shared project guidance, not an enforcement or orchestration engine.

## Start work

Open Codex, Claude Code, Gemini CLI or Cursor in the configured project directory. Use:

> Read AGENTS.md and .agents/donta/TASK.md. My goal is: [describe the feature]. Inspect the relevant code, record observable acceptance criteria, implement the change, run appropriate checks and leave a handoff.

The workflow asks the agent to preserve unrelated changes, use the project’s actual commands, inspect scripts before running them, protect auth boundaries and credentials, and report verification truthfully. It preserves the agent's own permission controls and the user's authorization scope.

## Switch agents without starting over

Ask the current agent to update `.agents/donta/HANDOFF.md`, then open your next agent in the same worktree:

> Read AGENTS.md, .agents/donta/TASK.md and .agents/donta/HANDOFF.md. Verify the notes against git status and the current code, then continue the next unfinished step.

Keep the objective, decisions, changed files and exact check results in the handoff. A handoff is context, not proof: the receiving agent should verify it. Use separate worktrees and task notes for simultaneous tasks to avoid overwriting each other's work.

## Review a change

> Read AGENTS.md and the current git diff. Review the change against TASK.md. Report concrete bugs and missing verification with file references. Do not edit code during this review unless requested.

## Refresh safely

Rerun `donta agents .` when the project's layout or scripts change. Setup refreshes its managed blocks, preserves surrounding instructions, and never overwrites task or handoff notes. Deselecting an agent does not remove its existing adapter. There is no force-overwrite flag.

`--dry-run` writes nothing. Noninteractive setup requires `--yes`. Files that change after preview, unsafe symlink paths and malformed managed blocks are rejected before writes. Review repository instructions before enabling them in your agent.

## Confirm each agent loaded the workflow

Restart existing sessions after setup and ask the agent to identify its loaded instructions. For Claude, inspect `/memory`; for Gemini, inspect `/memory show`. Nested rules, configured context filenames, Codex overrides, global instructions and agent version differences can affect loading. The wrappers use documented import syntax; they do not modify your global agent configuration.

## Keep notes suitable for the repository

Task notes are normal files and may be committed for handoffs. Do not put secrets, customer data, passwords or tokens in them. Commit only information appropriate to the repository's audience.

## Reference documentation

- [Codex project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Claude Code memory and imports](https://code.claude.com/docs/en/memory)
- [Gemini CLI context files and imports](https://geminicli.com/docs/cli/gemini-md/)
