# Example: UI Layout Analysis

## Use Case Category
Visual Analysis and Inspection

## Common Tasks
- Analyzing page layout issues (spacing, alignment, responsiveness)
- Extracting and comparing CSS styles
- Taking component screenshots for visual regression testing
- Checking UI element states (hover, focus, disabled)

## Detailed Example: UI Layout Issue Analysis

### Task Description

```
Analyze layout issues in 5 main page regions and provide improvement suggestions.
```

### Delegation from Main Claude Session

````
Task Identified: Visual analysis + requires screenshots.
Assessment: Clear boundaries ✓, Tool-intensive ✓, Simple verification ✓.

Delegate to GLM-4.6 via /glm command:

"Please analyze page layout issues.

**Prerequisites**:
- Page URL: http://localhost:3000/dashboard
- Page is already open in chrome-devtools-mcp
- You have access to chrome-devtools tools

**Target Analysis Regions**:
1. Header navigation (header)
2. Sidebar (sidebar)
3. Main content area (main-content)
4. Data table (data-table)
5. Footer action bar (footer-actions)

**Analysis Steps**:
1. Use mcp__chrome-devtools__take_snapshot to get page structure
2. Use mcp__chrome-devtools__take_screenshot to capture each region separately
3. Analyze each region for layout issues:
   - Is spacing reasonable (padding, margin)?
   - Are elements properly aligned?
   - Is responsive layout correct?
   - Is visual hierarchy clear?
4. Use mcp__chrome-devtools__hover to check hover states
5. Use mcp__chrome-devtools__click to test interaction feedback

**Output Format**:
Generate an analysis report with screenshots:
```markdown
# Dashboard Page Layout Analysis Report

## 1. Header Navigation

**Screenshot**: [Saved to ./analysis/header.png]

**Issues Found**:
- ❌ Spacing between logo and menu items is too large (80px, should be 40px)
- ❌ User avatar on the right is not vertically centered
- ✅ Responsive layout is working properly

**CSS Analysis**:
- padding: 20px 80px (too large)
- align-items: flex-start (should be center)

**Improvement Suggestions**:
1. Reduce horizontal padding to 40px
2. Change flex container's align-items to center
3. Add gap: 24px for consistent child element spacing

## 2. Sidebar
...
```

**Technical Requirements**:
- Use GLM-4.6's visual analysis capabilities to interpret screenshots
- Provide specific CSS property suggestions
- Save all screenshots to ./analysis/ directory

**Acceptance Criteria**:
- Screenshots for all 5 regions have been saved
- At least 2 specific improvement suggestions per region
"
````

### GLM-4.6 Execution Flow

1. `mcp__chrome-devtools__take_snapshot` to get page structure
2. `mcp__chrome-devtools__take_screenshot` for each region
3. Visually analyze each screenshot to identify layout issues
4. Use `mcp__chrome-devtools__hover`/`click` to test interactions
5. Generate an analysis report with screenshots

### GLM-4.6 Report Output

````markdown
# Dashboard Page Layout Analysis Report

Generated: 2025-10-28 14:30
Page: http://localhost:3000/dashboard

## 1. Header Navigation

**Screenshot**: ./analysis/header.png

**Issues Found**:
- ❌ Excessive horizontal padding (80px) creates wasted space
- ❌ User avatar not vertically centered (appears 5px too low)
- ❌ Inconsistent gap between menu items (varies from 16px to 32px)
- ✅ Logo is properly aligned
- ✅ Responsive breakpoints work correctly

**CSS Analysis**:
```css
/* Current */
.header {
  padding: 20px 80px;
  align-items: flex-start;
}

/* Suggested */
.header {
  padding: 20px 40px;
  align-items: center;
  gap: 24px;
}
```

**Improvement Suggestions**:
1. Reduce horizontal padding from 80px to 40px
2. Change `align-items: flex-start` to `align-items: center`
3. Add `gap: 24px` to flex container for consistent spacing
4. Consider using `max-width: 1440px` with `margin: 0 auto` for large screens

## 2. Sidebar

**Screenshot**: ./analysis/sidebar.png

**Issues Found**:
- ❌ Menu items have uneven vertical spacing (12px vs 16px)
- ❌ Active state background extends beyond text (no padding constraint)
- ❌ Icons not vertically aligned with text
- ✅ Hover states work correctly
- ✅ Color contrast meets WCAG AA standards

**CSS Analysis**:
```css
/* Current */
.menu-item {
  padding: 12px;
  gap: 8px;
}

/* Suggested */
.menu-item {
  padding: 16px;
  gap: 12px;
  align-items: center;
}
```

**Improvement Suggestions**:
1. Standardize vertical spacing to 16px
2. Add `align-items: center` to menu item flex containers
3. Constrain active state background with max-width or padding
4. Increase icon-to-text gap from 8px to 12px

## 3. Main Content Area

**Screenshot**: ./analysis/main-content.png

**Issues Found**:
- ❌ Content touches the edge on mobile (no padding)
- ❌ Heading hierarchy unclear (h2 and h3 look too similar)
- ✅ Grid layout is responsive
- ✅ Card spacing is consistent

**CSS Analysis**:
```css
/* Current */
.main-content {
  padding: 0;
}

h2 { font-size: 24px; font-weight: 600; }
h3 { font-size: 22px; font-weight: 600; }

/* Suggested */
.main-content {
  padding: 24px;
}

h2 { font-size: 28px; font-weight: 700; }
h3 { font-size: 20px; font-weight: 600; }
```

**Improvement Suggestions**:
1. Add 24px padding on all sides (mobile-first)
2. Increase h2 font-size to 28px and font-weight to 700
3. Reduce h3 font-size to 20px for better hierarchy
4. Add more vertical spacing between sections (current: 16px, suggested: 32px)

## 4. Data Table

**Screenshot**: ./analysis/data-table.png

**Issues Found**:
- ❌ Table overflows on small screens (not responsive)
- ❌ Column headers not sticky on scroll
- ❌ Row hover state color too subtle (hard to see)
- ✅ Cell padding is appropriate
- ✅ Border colors are subtle and clean

**CSS Analysis**:
```css
/* Current */
.data-table {
  overflow: auto;
}

.table-header {
  position: static;
}

.table-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

/* Suggested */
.data-table {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.table-row:hover {
  background: rgba(0, 0, 0, 0.05);
}
```

**Improvement Suggestions**:
1. Make table scrollable horizontally on small screens
2. Make column headers sticky with `position: sticky; top: 0`
3. Increase hover state background opacity from 0.02 to 0.05
4. Add box-shadow to sticky header for depth perception
5. Consider using `@container` queries for responsive columns

## 5. Footer Action Bar

**Screenshot**: ./analysis/footer-actions.png

**Issues Found**:
- ❌ Buttons too close together (only 8px gap)
- ❌ Primary button doesn't stand out enough
- ✅ Fixed positioning works correctly
- ✅ Z-index prevents content overlap

**CSS Analysis**:
```css
/* Current */
.footer-actions {
  gap: 8px;
}

.btn-primary {
  background: #3B82F6;
}

/* Suggested */
.footer-actions {
  gap: 16px;
}

.btn-primary {
  background: #2563EB;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}
```

**Improvement Suggestions**:
1. Increase button gap from 8px to 16px
2. Darken primary button color for better contrast
3. Add subtle box-shadow to primary button
4. Consider adding a subtle border-top to the footer bar

## Summary

**Total Issues Found**: 15
**Critical Issues**: 3 (table overflow, content edge touching, header padding)
**Minor Issues**: 12

**Priority Fixes** (ordered by impact):
1. Add padding to main content area (mobile usability)
2. Make table scrollable horizontally (data visibility)
3. Fix header padding and alignment (visual balance)
4. Standardize spacing throughout (consistency)
5. Improve heading hierarchy (content structure)

**Screenshots Saved**:
- ./analysis/header.png
- ./analysis/sidebar.png
- ./analysis/main-content.png
- ./analysis/data-table.png
- ./analysis/footer-actions.png
````

### Main Claude Verification

```bash
# Check screenshots are saved
ls -lh ./analysis/*.png

# Quick review of analysis report
cat ./analysis/layout-analysis.md | head -50

# Optionally view screenshots if needed
open ./analysis/header.png
```

Verification complete ✓

## Key Takeaways

### Why This Task is Suitable for Delegation

1. **Tool-Intensive**: 5 `take_snapshot` + 5 `take_screenshot` + multiple `hover`/`click` calls
2. **Clear Boundaries**:
   - Input: Page URL, 5 specific regions
   - Output: Analysis report with screenshots and CSS suggestions
3. **Simple Verification**: Check screenshot files exist, spot-check 1-2 suggestions
4. **Visual Analysis**: GLM-4.6 has multimodal capabilities for screenshot analysis

### Delegation Checklist

✅ **Clear Inputs**: Page URL, specific regions to analyze
✅ **Clear Outputs**: Report format, screenshot locations specified
✅ **Analysis Criteria**: Spacing, alignment, responsiveness defined
✅ **Tool Access**: chrome-devtools-mcp tools available
✅ **Simple Verification**: File existence + spot-check suggestions

### Verification Strategy

**Quick Checks (1 minute)**:
- Screenshots exist: `ls ./analysis/*.png`
- Report is complete: `wc -l ./analysis/layout-analysis.md`
- Spot-check 1-2 CSS suggestions for reasonableness

**Optional Deep Checks**:
- Apply suggested CSS changes to see actual impact
- Use DevTools to verify current CSS values
- Test suggested changes in browser

## Variations

### Visual Regression Testing

```
"Please take screenshots of all components for visual regression testing.

**Inputs**:
- Component list: ./tests/components.txt
- Each line: component name and URL
- Example: Button,http://localhost:6006/?path=/story/button--primary

**Analysis Steps**:
1. Navigate to each component URL
2. Take screenshot of component in default state
3. Take screenshots of all documented states (hover, focus, disabled, etc.)
4. Save with naming pattern: {component}-{state}.png

**Output Requirements**:
- Screenshots in ./screenshots/baseline/
- JSON manifest with file paths and metadata
- Comparison script for future runs

**Acceptance Criteria**:
- All components have baseline screenshots
- JSON manifest is valid
"
```

### CSS Property Extraction

```
"Please extract all CSS custom properties (CSS variables) used in the app.

**Inputs**:
- Page URL: http://localhost:3000
- Scope: All elements in the page

**Analysis Steps**:
1. Take snapshot to get element tree
2. Use evaluate_script to extract computed styles
3. Filter for CSS custom properties (--*)
4. Group by category (colors, spacing, typography, etc.)

**Output Format**:
- Categorized list of CSS variables
- Usage count for each variable
- Unused variables (defined but not referenced)

**Acceptance Criteria**:
- All custom properties listed
- Categorization makes sense
"
```

### Accessibility Audit

```
"Please audit the page for accessibility issues.

**Inputs**:
- Page URL: http://localhost:3000/dashboard
- Focus on: WCAG 2.1 Level AA compliance

**Analysis Steps**:
1. Take snapshot to analyze a11y tree
2. Check for common issues:
   - Missing alt text on images
   - Insufficient color contrast
   - Missing form labels
   - Improper heading hierarchy
   - Missing ARIA attributes where needed
3. Use evaluate_script to check focus management

**Output Format**:
- Issue list categorized by severity
- Screenshots highlighting problem areas
- Specific remediation suggestions

**Acceptance Criteria**:
- All WCAG AA violations identified
- Actionable fix suggestions provided
"
```

## Common Pitfalls to Avoid

❌ **Vague Analysis Criteria**
- Bad: "Check if the layout looks good"
- Good: "Check spacing (padding/margin), alignment, and responsiveness"

❌ **No Screenshot Organization**
- Bad: Screenshots saved with unclear names
- Good: Organized directory with descriptive filenames

❌ **Missing CSS Context**
- Bad: "Make the spacing bigger"
- Good: "Change `padding: 20px` to `padding: 40px`"

❌ **Subjective Suggestions**
- Bad: "The color is ugly"
- Good: "Color contrast ratio is 3.2:1, should be 4.5:1 for WCAG AA"

## Best Practices

### Specify Analysis Dimensions
- Spacing (padding, margin, gap)
- Alignment (flex, grid properties)
- Responsiveness (breakpoints, container queries)
- Visual hierarchy (size, weight, color)

### Request Specific CSS
- Include current CSS values
- Provide suggested CSS changes
- Explain the reasoning

### Make Suggestions Actionable
- Reference specific CSS properties
- Provide before/after values
- Include accessibility or usability rationale

### Organize Screenshots
- Use descriptive filenames
- Save to organized directory structure
- Include screenshots in report for context
