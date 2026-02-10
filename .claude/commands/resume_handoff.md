# Resume work from a handoff note

You are tasked with resuming work from a handoff note through an interactive process. These handoffs contain critical context, learnings, and next steps from previous work sessions that need to be understood and continued.

## Initial Response

When this command is invoked:

1. **If a specific handoff note title was provided**:
   - Skip the default message
   - Use `bear-search-notes` with `tag: "handoffs"` and `term: "[provided title]"` to find the note
   - If found, use `bear-open-note` with the note identifier to read it FULLY
   - Immediately read any research or plan notes referenced using `bear-search-notes` with appropriate tags (`#3 projekte/fastmail-mcp-server/plans#` or `#3 projekte/fastmail-mcp-server/research#`). do NOT use a sub-agent to read these critical notes.
   - Begin the analysis process by ingesting relevant context from the handoff note, reading additional files and notes it mentions
   - Then propose a course of action to the user and confirm, or ask for clarification on direction.

2. **If a ticket number (like ENG-XXXX) was provided**:
   - Use `bear-search-notes` with `tag: "handoffs"` and `term: "ENG-XXXX"` to find all handoffs for that ticket
   - Sort results by date (most recent first based on the YYYY-MM-DD_HH-MM-SS prefix in titles)
   - If no notes found: tell the user: "I'm sorry, I can't seem to find that handoff note. Can you please provide a note title or different search term?"
   - If only one note found: proceed with that handoff
   - If multiple notes found: proceed with the most recent handoff (based on date/time in title)
   - Use `bear-open-note` with the note identifier to read the handoff FULLY
   - Immediately read any research or plan notes referenced using `bear-search-notes` with appropriate tags; do NOT use a sub-agent to read these critical notes.
   - Begin the analysis process by ingesting relevant context from the handoff note, reading additional files and notes it mentions
   - Then propose a course of action to the user and confirm, or ask for clarification on direction.

3. **If no parameters provided**, respond with:
```
I'll help you resume work from a handoff note. Let me find the available handoffs in Bear.

Which handoff would you like to resume from?

Tip: You can invoke this command directly with a ticket number: `/resume_handoff ENG-XXXX`

or with a note title: `/resume_handoff 2025-01-08_13-44-55_ENG-2166_create-context-compaction`
```

Then wait for the user's input.

## Process Steps

### Step 1: Read and Analyze Handoff

1. **Read handoff note completely**:
   - Use `bear-open-note` with the note identifier (obtained from search)
   - Extract all sections:
     - Task(s) and their statuses
     - Recent changes
     - Learnings
     - Artifacts
     - Action items and next steps
     - Other notes

2. **Spawn focused research tasks**:
   Based on the handoff content, spawn parallel research tasks to verify current state:

   ```
   Task 1 - Verify recent changes:
   Check if the recent changes mentioned in the handoff still exist.
   1. Verify files mentioned in "Recent changes" section
   2. Check if the described changes are still present
   3. Look for any subsequent modifications
   4. Identify any conflicts or regressions
   Use tools: Read, Grep, Glob
   Return: Current state of recent changes with file:line references
   ```

   ```
   Task 2 - Validate current codebase state:
   Verify the current state against what's described in the handoff.
   1. Check files mentioned in "Learnings" section
   2. Verify patterns and implementations still exist
   3. Look for any breaking changes since handoff
   4. Identify new related code added since handoff
   Use tools: Read, Grep, Glob
   Return: Validation results and any discrepancies found
   ```

   ```
   Task 3 - Gather artifact context:
   Read all artifacts mentioned in the handoff.
   1. For files: Use Read tool
   2. For Bear notes: Use bear-search-notes with appropriate tags, then bear-open-note
   3. Read implementation plans (tag: #3 projekte/fastmail-mcp-server/plans#)
   4. Read research notes (tag: #3 projekte/fastmail-mcp-server/research#)
   5. Extract key requirements and decisions
   Use tools: Read, bear-search-notes, bear-open-note
   Return: Summary of artifact contents and key decisions
   ```

3. **Wait for ALL sub-tasks to complete** before proceeding

4. **Read critical files and notes identified**:
   - Read files from "Learnings" section completely
   - Read files from "Recent changes" to understand modifications
   - Read any Bear notes referenced (plans, research)
   - Read any new related files discovered during research

### Step 2: Synthesize and Present Analysis

1. **Present comprehensive analysis**:
   ```
   I've analyzed the handoff from [date] by [researcher]. Here's the current situation:

   **Original Tasks:**
   - [Task 1]: [Status from handoff] → [Current verification]
   - [Task 2]: [Status from handoff] → [Current verification]

   **Key Learnings Validated:**
   - [Learning with file:line reference] - [Still valid/Changed]
   - [Pattern discovered] - [Still applicable/Modified]

   **Recent Changes Status:**
   - [Change 1] - [Verified present/Missing/Modified]
   - [Change 2] - [Verified present/Missing/Modified]

   **Artifacts Reviewed:**
   - [File or Bear Note 1]: [Key takeaway]
   - [File or Bear Note 2]: [Key takeaway]

   **Recommended Next Actions:**
   Based on the handoff's action items and current state:
   1. [Most logical next step based on handoff]
   2. [Second priority action]
   3. [Additional tasks discovered]

   **Potential Issues Identified:**
   - [Any conflicts or regressions found]
   - [Missing dependencies or broken code]

   Shall I proceed with [recommended action 1], or would you like to adjust the approach?
   ```

2. **Get confirmation** before proceeding

### Step 3: Create Action Plan

1. **Use TaskCreate to create task list**:
   - Convert action items from handoff into tasks using TaskCreate
   - Add any new tasks discovered during analysis
   - Prioritize based on dependencies and handoff guidance
   - Use TaskUpdate to set up dependencies between tasks if needed

2. **Present the plan**:
   ```
   I've created a task list based on the handoff and current analysis:

   [Show task list using TaskList]

   Ready to begin with the first task: [task description]?
   ```

### Step 4: Begin Implementation

1. **Start with the first approved task** (update its status to in_progress with TaskUpdate)
2. **Reference learnings from handoff** throughout implementation
3. **Apply patterns and approaches documented** in the handoff
4. **Update progress** as tasks are completed (use TaskUpdate to mark as completed)

## Guidelines

1. **Be Thorough in Analysis**:
   - Read the entire handoff note first using bear-open-note
   - Verify ALL mentioned changes still exist
   - Check for any regressions or conflicts
   - Read all referenced artifacts (both files and Bear notes)

2. **Be Interactive**:
   - Present findings before starting work
   - Get buy-in on the approach
   - Allow for course corrections
   - Adapt based on current state vs handoff state

3. **Leverage Handoff Wisdom**:
   - Pay special attention to "Learnings" section
   - Apply documented patterns and approaches
   - Avoid repeating mistakes mentioned
   - Build on discovered solutions

4. **Track Continuity**:
   - Use TaskCreate/TaskUpdate/TaskList to maintain task continuity during the session
   - Reference the handoff note in commits
   - Document any deviations from original plan
   - Consider creating a new handoff when done (using /create_handoff command)

5. **Validate Before Acting**:
   - Never assume handoff state matches current state
   - Verify all file references still exist
   - Verify all Bear note references are still accessible
   - Check for breaking changes since handoff
   - Confirm patterns are still valid

## Common Scenarios

### Scenario 1: Clean Continuation
- All changes from handoff are present
- No conflicts or regressions
- Clear next steps in action items
- Proceed with recommended actions

### Scenario 2: Diverged Codebase
- Some changes missing or modified
- New related code added since handoff
- Need to reconcile differences
- Adapt plan based on current state

### Scenario 3: Incomplete Handoff Work
- Tasks marked as "in_progress" in handoff
- Need to complete unfinished work first
- May need to re-understand partial implementations
- Focus on completing before new work

### Scenario 4: Stale Handoff
- Significant time has passed
- Major refactoring has occurred
- Original approach may no longer apply
- Need to re-evaluate strategy

## Example Interaction Flow

```
User: /resume_handoff ENG-2166
Assistant: Let me search for and read that handoff note...

[Uses bear-search-notes to find handoff]
[Uses bear-open-note to read handoff completely]
[Spawns research tasks]
[Waits for completion]
[Reads identified files and notes]

I've analyzed the handoff from [date]. Here's the current situation...

[Presents analysis]

Shall I proceed with implementing the webhook validation fix, or would you like to adjust the approach?

User: Yes, proceed with the webhook validation
Assistant: [Uses TaskCreate to create task list and begins implementation]
```
