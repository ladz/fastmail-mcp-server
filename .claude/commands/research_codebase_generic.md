# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning parallel sub-agents and synthesizing their findings.

## Initial Setup:

When this command is invoked, respond with:
```
I'm ready to research the codebase. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
```

Then wait for the user's research query.

## Steps to follow after receiving the research query:

1. **Read any directly mentioned files first:**
   - If the user mentions specific files (tickets, docs, JSON), read them FULLY first
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: Read these files yourself in the main context before spawning any sub-tasks
   - This ensures you have full context before decomposing the research

2. **Analyze and decompose the research question:**
   - Break down the user's query into composable research areas
   - Take time to ultrathink about the underlying patterns, connections, and architectural implications the user might be seeking
   - Identify specific components, patterns, or concepts to investigate
   - Create a research plan using TaskCreate to track all subtasks
   - Consider which directories, files, or architectural patterns are relevant

3. **Spawn parallel sub-agent tasks for comprehensive research:**
   - Create multiple Task agents to research different aspects concurrently

   The key is to use these agents intelligently:
   - Start with locator agents to find what exists
   - Then use analyzer agents on the most promising findings
   - Run multiple agents in parallel when they're searching for different things
   - Each agent knows its job - just tell it what you're looking for
   - Don't write detailed prompts about HOW to search - the agents already know

4. **Wait for all sub-agents to complete and synthesize findings:**
   - IMPORTANT: Wait for ALL sub-agent tasks to complete before proceeding
   - Compile all sub-agent results (both codebase and Bear notes findings)
   - Prioritize live codebase findings as primary source of truth
   - Use Bear notes findings as supplementary historical context
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Highlight patterns, connections, and architectural decisions
   - Answer the user's specific questions with concrete evidence

5. **Gather metadata for the research note:**
   - Collect current date/time with timezone in ISO format
   - Get researcher name from git config: `git config user.name`
   - Get current commit hash: `git rev-parse HEAD`
   - Get current branch: `git branch --show-current`
   - Get repository name from remote URL or directory name
   - Note title format: `Research: [Brief Description]` where description is a concise summary
   - Examples:
     - With ticket: `Research: ENG-1478 Parent-Child Tracking`
     - Without ticket: `Research: Authentication Flow`

6. **Create research note in Bear:**
   - Use the metadata gathered in step 5
   - Use `bear-create-note` with appropriate project tag on FIRST LINE
   - For this project use: `#3 projekte/fastmail-mcp-server/research#`
   - Structure the note content:
     ```markdown
     #3 projekte/fastmail-mcp-server/research#
     # Research: [User's Question/Topic]

     **Date**: [Current date and time with timezone]
     **Researcher**: [Researcher name from metadata]
     **Git Commit**: [Current commit hash]
     **Branch**: [Current branch name]
     **Repository**: [Repository name]

     ## Research Question
     [Original user query]

     ## Summary
     [High-level findings answering the user's question]

     ## Detailed Findings

     ### [Component/Area 1]
     - Finding with reference (file.ext:line)
     - Connection to other components
     - Implementation details

     ### [Component/Area 2]
     ...

     ## Code References
     - `path/to/file.py:123` - Description of what's there
     - `another/file.ts:45-67` - Description of the code block

     ## Architecture Insights
     [Patterns, conventions, and design decisions discovered]

     ## Historical Context (from Bear notes)
     [Relevant insights from other Bear notes with tag references]
     - Note title with tag - Historical decision about X

     ## Related Research
     [References to other research notes with appropriate project tag]

     ## Open Questions
     [Any areas that need further investigation]
     ```

7. **Add GitHub permalinks (if applicable):**
   - Check if on main branch or if commit is pushed: `git branch --show-current` and `git status`
   - If on main/master or pushed, generate GitHub permalinks:
     - Get repo info: `gh repo view --json owner,name`
     - Create permalinks: `https://github.com/{owner}/{repo}/blob/{commit}/{file}#L{line}`
   - Include permalinks in the note alongside local file references

8. **Present findings:**
   - Present a concise summary of findings to the user
   - Include key file references for easy navigation
   - Ask if they have follow-up questions or need clarification

9. **Handle follow-up questions:**
   - If the user has follow-up questions, update the same research note using `bear-add-text`
   - Add a new section at the end: `## Follow-up Research [timestamp]`
   - Include update timestamp and additional context
   - Spawn new sub-agents as needed for additional investigation
   - Continue updating the note with new findings

## Important notes:
- Always use parallel Task agents to maximize efficiency and minimize context usage
- Always run fresh codebase research - never rely solely on existing research notes
- Bear notes provide historical context to supplement live findings
- Focus on finding concrete file paths and line numbers for developer reference
- Research notes should be self-contained with all necessary context
- Each sub-agent prompt should be specific and focused on read-only operations
- Consider cross-component connections and architectural patterns
- Include temporal context (when the research was conducted)
- Link to GitHub when possible for permanent references
- Keep the main agent focused on synthesis, not deep file reading
- Encourage sub-agents to find examples and usage patterns, not just definitions
- Search all relevant Bear tags for the project, not just research tag
- **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
- **Critical ordering**: Follow the numbered steps exactly
  - ALWAYS read mentioned files first before spawning sub-tasks (step 1)
  - ALWAYS wait for all sub-agents to complete before synthesizing (step 4)
  - ALWAYS gather metadata before creating the note (step 5 before step 6)
  - NEVER create the research note with placeholder values
- **Bear note structure**:
  - Tag MUST be on the FIRST LINE (e.g., `#3 projekte/fastmail-mcp-server/research#`)
  - Title comes after the tag
  - Include all metadata fields for consistency
  - Use TaskCreate/TaskUpdate/TaskList for tracking work (not TodoWrite)
