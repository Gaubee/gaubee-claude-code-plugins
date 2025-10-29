# Example: Website Documentation Scraping

## Use Case Category

Batch Data Collection and Transformation

## Common Tasks

- Batch scraping website documentation and converting formats
- Collecting and aggregating data from APIs
- Fetching and consolidating content from multiple sources
- Downloading and organizing online resources

## Detailed Example: Website Documentation Scraping

### Task Description

```
Scrape all documentation pages from https://example.com/docs, convert them to Markdown, and save them to the ./crawled-docs directory.
```

### Delegation from Main Claude Session

```
Task Identified: Batch web scraping + format conversion + file saving.
Assessment: Clear boundaries ✓, Tool-intensive ✓, Simple verification ✓.

Delegate to GLM-4.6 via /glm command:

"Please scrape the website documentation and convert it to Markdown.

**Inputs**:
- Starting URL: https://example.com/docs
- Crawl all sub-pages discovered via links.
- Maximum crawl depth: 3 levels.

**Output Requirements**:
- Save each page as a separate .md file.
- Filename: Use a slugified version of the page title (e.g., getting-started.md).
- Preserve a reasonable directory structure.
- Remove non-content elements like navigation bars and footers.
- Retain code blocks and image links.

**Acceptance Criteria**:
- Provide a list of all generated .md files (path, size, creation time).
- Provide crawl statistics: number of successes, failures, and total time taken.

**Error Handling**:
- Page crawl failure: Log the URL and error, then continue with other pages.
- Timeout: Skip any page that takes longer than 30 seconds to fetch.
"
```

### GLM-4.6 Execution Flow

1. Use `mcp__chrome-devtools__new_page` to open the starting page in browser
2. Use `mcp__chrome-devtools__take_snapshot` to get the page's accessibility tree content
3. Parse the snapshot to extract all documentation links
4. Iterate through each link:
   - Use `mcp__chrome-devtools__navigate_page` to open the page
   - Use `mcp__chrome-devtools__take_snapshot` to get the page content
   - Convert the snapshot content (accessibility tree) to Markdown format
   - `Write` the Markdown to a file in the `./crawled-docs/` directory
5. Generate a final report

### GLM-4.6 Report Output

```
✅ Crawl complete.

Generated File List:
./crawled-docs/getting-started.md       12KB  2025-10-28 10:30
./crawled-docs/installation.md          8KB   2025-10-28 10:30
./crawled-docs/configuration.md         15KB  2025-10-28 10:31
./crawled-docs/api/overview.md          20KB  2025-10-28 10:31
./crawled-docs/api/authentication.md    18KB  2025-10-28 10:32
... (23 files total)

Statistics:
- Succeeded: 23 pages
- Failed: 2 pages
  - https://example.com/docs/deprecated-page (404)
  - https://example.com/docs/old-api (404)
- Total Time: 2 minutes 15 seconds
```

### Main Claude Verification

```bash
# Quickly verify that files were generated
ls -lh ./crawled-docs/*.md | head -5

# Spot-check the content of one file
head -20 ./crawled-docs/getting-started.md
```

Verification complete ✓

## Key Takeaways

### Why This Task is Suitable for Delegation

1. **Tool-Intensive**: 23+ `navigate_page` calls + 23+ `take_snapshot` calls + 23+ `Write` calls
2. **Clear Boundaries**:
   - Input: Starting URL, crawl depth
   - Output: Markdown files with specific structure
3. **Simple Verification**: Check file count, spot-check 1-2 files
4. **Low Cost**: Verification takes seconds vs. minutes of direct execution

### Delegation Checklist

✅ **Clear Inputs**: Starting URL, crawl depth specified
✅ **Clear Outputs**: File format, naming, structure specified
✅ **Simple Verification**: File list + spot-check
✅ **Self-Contained**: All requirements in prompt
✅ **Tool-Intensive**: 70+ tool calls total (navigate_page + take_snapshot + Write per page)
✅ **Error Handling**: Failure strategy defined

### Verification Strategy

**Quick Checks (30 seconds)**:

- File count: `ls ./crawled-docs/*.md | wc -l`
- File sizes: `ls -lh ./crawled-docs/*.md`
- Sample content: `head -20 ./crawled-docs/getting-started.md`

**Optional Deep Checks**:

- Validate Markdown syntax: `mdl ./crawled-docs/`
- Check for broken links: `markdown-link-check ./crawled-docs/*.md`

## Variations

### API Data Scraping

```
"Please fetch data from the GitHub API for repositories in the 'facebook' org.

**Inputs**:
- GitHub API base: https://api.github.com
- Organization: facebook
- Endpoint: /orgs/facebook/repos

**Output Requirements**:
- Save each repo's data as JSON file
- Filename: {repo-name}.json
- Include: name, description, stars, forks, language

**Acceptance Criteria**:
- File list with repo count
- Total stars across all repos
"
```

### Multi-Source Content Consolidation

```
"Please consolidate blog posts from multiple sources.

**Inputs**:
- Source URLs: ./sources.txt (one URL per line, 50 URLs total)

**Output Requirements**:
- Convert each to Markdown
- Extract: title, author, date, content
- Save to ./posts/ directory
- Filename: {date}-{slugified-title}.md

**Acceptance Criteria**:
- File list sorted by date
- Statistics: posts per source
"
```

## Common Pitfalls to Avoid

❌ **Vague Acceptance Criteria**

- Bad: "Make sure the files are good quality"
- Good: "Verify code blocks are preserved with syntax highlighting"

❌ **Missing Error Handling**

- Bad: No mention of failures
- Good: "Skip 404 pages and log them in the error report"

❌ **Ambiguous Output Format**

- Bad: "Save the content somewhere"
- Good: "Save to ./crawled-docs/ with slugified filenames"

❌ **No Verification Strategy**

- Bad: Expecting GLM to self-verify
- Good: "Provide file list for main agent to spot-check"
