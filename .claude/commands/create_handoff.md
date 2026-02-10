# Create Handoff

You are tasked with writing a handoff document to hand off your work to another agent in a new session. You will create a handoff document that is thorough, but also **concise**. The goal is to compact and summarize your context without losing any of the key details of what you're working on.


## Process
### 1. Note Title & Metadata
Use the following information to understand how to create your handoff note:
    - The note will be created in Bear with tag `#3 projekte/fastmail-mcp-server/handoffs#`
    - Note title format: `YYYY-MM-DD_HH-MM-SS_ENG-ZZZZ_description` or `YYYY-MM-DD_HH-MM-SS_description`, where:
        - YYYY-MM-DD is today's date
        - HH-MM-SS is the hours, minutes and seconds based on the current time, in 24-hour format (i.e. use `13:00` for `1:00 pm`)
        - ENG-ZZZZ is the ticket number (omit if no ticket)
        - description is a brief kebab-case description
    - Gather metadata from git (commit hash, branch, repository name)
    - Examples:
        - With ticket: `2025-01-08_13-55-22_ENG-2166_create-context-compaction`
        - Without ticket: `2025-01-08_13-55-22_create-context-compaction`

### 2. Handoff writing.
using the above conventions, write your handoff note using `bear-create-note`. The tag MUST be the FIRST LINE, followed by the title, then the content with YAML frontmatter:

Use the following template structure for `bear-create-note`:
- `tags` parameter: `"3 projekte/fastmail-mcp-server/handoffs"`
- `title` parameter: The note title (e.g., `"2025-01-08_13-55-22_ENG-2166_create-context-compaction"`)
- `text` parameter: The note content following this markdown structure:

```markdown
---
date: [Current date and time with timezone in ISO format]
researcher: [Researcher name from metadata]
git_commit: [Current commit hash]
branch: [Current branch name]
repository: [Repository name]
topic: "[Feature/Task Name] Implementation Strategy"
yaml_tags: [implementation, strategy, relevant-component-names]
status: complete
last_updated: [Current date in YYYY-MM-DD format]
last_updated_by: [Researcher name]
type: implementation_strategy
---

# Handoff: ENG-XXXX {very concise description}

## Task(s)
{description of the task(s) that you were working on, along with the status of each (completed, work in progress, planned/discussed). If you are working on an implementation plan, make sure to call out which phase you are on. Make sure to reference plan notes (tag: #3 projekte/fastmail-mcp-server/plans#) and/or research notes (tag: #3 projekte/fastmail-mcp-server/research#) you are working from that were provided to you at the beginning of the session, if applicable.}

## Critical References
{List any critical specification documents, architectural decisions, or design docs that must be followed. Include only 2-3 most important file paths or Bear note references. Leave blank if none.}

## Recent changes
{describe recent changes made to the codebase that you made in line:file syntax}

## Learnings
{describe important things that you learned - e.g. patterns, root causes of bugs, or other important pieces of information someone that is picking up your work after you should know. consider listing explicit file paths.}

## Artifacts
{an exhaustive list of artifacts you produced or updated. For files: use file:line references. For Bear notes: reference by title or search terms with their tags (e.g., "Implementation Plan for X" in #3 projekte/fastmail-mcp-server/plans#). List all artifacts that should be read to resume your work.}

## Action Items & Next Steps
{a list of action items and next steps for the next agent to accomplish based on your tasks and their statuses}

## Other Notes
{other notes, references, or useful information - e.g. where relevant sections of the codebase are, where relevant documents are, or other important things you learned that you want to pass on but that don't fall into the above categories}
```
---

### 3. Approve
Ask the user to review and approve the note content. If they request any changes, you should make them and ask for approval again.

Once approved, call `bear-create-note` with the tag, title, and content. Then respond to the user with the template between <template_response></template_response> XML tags. do NOT include the tags in your response.

<template_response>
Handoff created in Bear! You can resume from this handoff in a new session with the following command:

```bash
/resume_handoff [note title or ENG-XXXX]
```
</template_response>

for example (between <example_response></example_response> XML tags - do NOT include these tags in your actual response to the user)

<example_response>
Handoff created in Bear! You can resume from this handoff in a new session with the following command:

```bash
/resume_handoff ENG-2166
```

or by note title:

```bash
/resume_handoff 2025-01-08_13-44-55_ENG-2166_create-context-compaction
```
</example_response>

---
## Additional Notes & Instructions
- **more information, not less**. This is a guideline that defines the minimum of what a handoff should be. Always feel free to include more information if necessary.
- **be thorough and precise**. include both top-level objectives, and lower-level details as necessary.
- **avoid excessive code snippets**. While a brief snippet to describe some key change is important, avoid large code blocks or diffs; do not include one unless it's absolutely necessary. Prefer using `/path/to/file.ext:line` references that an agent can follow later when it's ready, e.g. `src/index.ts:42-58`
- **reference Bear notes by tag**. When referencing plans or research, use their Bear tags:
  - Plans: `#3 projekte/fastmail-mcp-server/plans#`
  - Research: `#3 projekte/fastmail-mcp-server/research#`
  - Handoffs: `#3 projekte/fastmail-mcp-server/handoffs#`
- **internal task tracking**. Use Claude Code's internal TaskCreate/TaskUpdate/TaskList tools to track work progress during the session. These tasks do NOT persist across sessions - handoff notes serve that purpose.
