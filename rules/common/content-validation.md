# Content Validation Rules

> **CRITICAL**: Validate all content before writing to any file.

## Mermaid Diagrams

Before creating any file with a Mermaid diagram:

1. Node IDs: alphanumeric + underscore only.
2. Escape special characters in labels: `"` → `\"`, `'` → `\'`.
3. Validate flowchart connections are syntactically correct.
4. Always include a text alternative below the diagram.

If validation fails → use text-based representation instead. Do not block the workflow.

## ASCII Diagrams

1. All lines must be the same width.
2. Allowed characters only: `+` `-` `|` `^` `v` `<` `>` and spaces.
3. No Unicode box-drawing characters.
4. Spaces only — no tabs.

## General Checklist

Before writing any file:
- [ ] Embedded code blocks (Mermaid, JSON, YAML) are syntactically valid
- [ ] Special characters are escaped
- [ ] Markdown syntax is correct
- [ ] Text alternative provided for any complex visual content

## On Validation Failure

1. Log what failed.
2. Use text-based fallback.
3. Continue the workflow — do not block.
4. Inform the user that simplified content was used.
