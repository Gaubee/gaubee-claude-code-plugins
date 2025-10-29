# Example: Architecture Pattern Research

## Use Case Category

Documentation Processing and Research

## Common Tasks

- Batch reading and summarizing technical documentation
- Researching architecture and design patterns
- Organizing and comparing best practices
- Conducting technology selection research

## Detailed Example: Microservices Architecture Pattern Research

### Task Description

```
Read 30 articles by Martin Fowler on microservices and summarize the key architectural patterns and trade-offs.
```

### Delegation from Main Claude Session

````
Task Identified: Large-scale document reading + summarization.
Assessment: Clear boundaries ✓, Tool-intensive ✓, Simple verification ✓.

Delegate to GLM-4.6 via /glm command:

"Please research microservices architecture patterns and provide a summary.

**Inputs**:
- Article list: ./research/microservices-reading-list.md
  Contains URLs for 30 articles by Martin Fowler

**Research Objectives**:
1. Read all 30 articles (using chrome-devtools-mcp: navigate + snapshot)
2. Extract key microservices architecture patterns
3. Summarize the pros/cons and use cases for each pattern
4. Compare the trade-offs between different patterns

**Output Requirements**:
Generate a structured research report:
```markdown
# Microservices Architecture Pattern Research Report

## Executive Summary
- Articles researched: 30
- Patterns identified: X
- Research time: Y minutes

## Core Architecture Patterns

### 1. Service Decomposition Patterns

#### 1.1 Decompose by Business Capability
**Source**: [List referenced articles]

**Core Concept**:
...

**Advantages**:
- ✅ Clear business boundaries
- ✅ High team autonomy

**Disadvantages**:
- ❌ Potential data consistency issues
- ❌ Complex cross-service transactions

**Use Cases**:
- Large organizations with team sizes > 50
- Clear business domain boundaries

**Trade-offs vs. Other Patterns**:
- vs. Decompose by Subdomain: Better suited for clear organizational structures
- vs. Monolithic: Increases operational complexity but improves scalability

#### 1.2 Decompose by Subdomain
...

### 2. Data Management Patterns
...

## Key Trade-offs Summary

| Dimension | Microservices | Monolithic |
|-----------|---------------|------------|
| Development Efficiency (Initial) | Low | High |
| Scalability | High | Low |
| Operational Complexity | High | Low |
| Team Independence | High | Low |

## Implementation Recommendations
...
```

**Quality Requirements**:
- Each pattern must cite specific article sources
- Pros/cons must be based on article content, not speculation
- Trade-off comparisons must be supported by data or case studies

**Acceptance Criteria**:
- Report structure is complete with all required sections
- Spot-check 2-3 patterns to confirm the cited articles actually discuss them
"
````

### GLM-4.6 Execution Flow

1. Read `./research/microservices-reading-list.md` to get URL list
2. Iterate through each URL:
   - Use `mcp__chrome-devtools__navigate_page` to open the article
   - Use `mcp__chrome-devtools__take_snapshot` to capture the content
   - Convert the snapshot to structured text
3. Extract architectural patterns discussed in each article
4. Aggregate and categorize patterns
5. Compare trade-offs between different patterns
6. Generate a structured report

### GLM-4.6 Report Output

```markdown
# Microservices Architecture Pattern Research Report

Generated: 2025-10-28 15:45
Source: 30 articles by Martin Fowler
Research Duration: 8 minutes 32 seconds

## Executive Summary

- Articles researched: 30 (100% success rate)
- Patterns identified: 12 major patterns across 4 categories
- Key insight: Pattern selection depends heavily on organization maturity and team size

## Core Architecture Patterns

### 1. Service Decomposition Patterns

#### 1.1 Decompose by Business Capability

**Sources**:

- "Microservices Guide" (martinfowler.com/microservices)
- "Bounded Context" (martinfowler.com/bliki/BoundedContext.html)
- "Microservice Prerequisites" (martinfowler.com/bliki/MicroservicePrerequisites.html)

**Core Concept**:
Organize services around business capabilities rather than technical layers. Each service owns a complete business function (e.g., Order Management, Inventory, Shipping) rather than being split into UI/Logic/Data layers.

**Advantages**:

- ✅ Clear business boundaries align with organizational structure
- ✅ High team autonomy - each team owns a complete business domain
- ✅ Easier to understand from business perspective
- ✅ Natural fit for Conway's Law

**Disadvantages**:

- ❌ Requires deep domain knowledge to identify proper boundaries
- ❌ Potential data consistency challenges across services
- ❌ Complex cross-service transactions may need distributed sagas
- ❌ Difficult to change boundaries once established

**Use Cases**:

- Large organizations (team size > 50 people)
- Clear business domain boundaries exist
- Organization structured around business units
- Long-term strategic initiatives (not short-term projects)

**Prerequisites** (per Fowler):

- Rapid provisioning infrastructure
- Basic monitoring capabilities
- DevOps culture
- Mature continuous delivery practices

**Trade-offs vs. Other Patterns**:

- **vs. Decompose by Subdomain (DDD)**: Business capability is coarser-grained, easier to identify but less technically precise
- **vs. Monolithic**: 3x higher operational overhead but enables independent team scaling
- **vs. SOA**: Lighter-weight, more focused services with stronger ownership

**Real-world Example** (from articles):
Amazon's two-pizza teams, each owning a complete business capability from UI to database.

#### 1.2 Decompose by Subdomain (Domain-Driven Design)

**Sources**:

- "Bounded Context" (martinfowler.com/bliki/BoundedContext.html)
- "Domain-Driven Design" references across 5 articles

**Core Concept**:
Use Domain-Driven Design (DDD) to identify bounded contexts. Each microservice represents one bounded context with its own ubiquitous language.

**Advantages**:

- ✅ More precise boundaries based on domain model
- ✅ Clear linguistic boundaries (ubiquitous language)
- ✅ Better alignment with complex domains
- ✅ Supports strategic and tactical DDD patterns

**Disadvantages**:

- ❌ Requires DDD expertise (steep learning curve)
- ❌ Harder to explain to non-technical stakeholders
- ❌ May create smaller services than business capability approach
- ❌ Risk of over-fragmentation if bounded contexts too small

**Use Cases**:

- Complex domains with rich business logic
- Teams with DDD experience
- Systems where domain model is central
- Domains with complex invariants and business rules

**Trade-offs vs. Other Patterns**:

- **vs. Business Capability**: More precise but requires DDD knowledge
- **vs. Technical Layers**: Avoids the "distributed monolith" anti-pattern

### 2. Data Management Patterns

#### 2.1 Database per Service

**Sources**:

- "Microservices Guide" - Data Management section
- "Database per Service" pattern discussions across 8 articles

**Core Concept**:
Each microservice has its own database, invisible to other services. Data sharing happens only through service APIs.

**Advantages**:

- ✅ Service independence - schema changes don't affect others
- ✅ Technology flexibility - choose best database per service
- ✅ Scalability - scale data stores independently
- ✅ Fault isolation - database failure affects only one service

**Disadvantages**:

- ❌ Data consistency challenges (eventual consistency)
- ❌ Cross-service queries require aggregation layer
- ❌ Increased storage costs (data duplication)
- ❌ Complex distributed transactions

**Use Cases**:

- Services with different data access patterns
- Need for polyglot persistence
- Independent scaling requirements
- Strong service autonomy requirements

**Trade-offs**:

- **vs. Shared Database**: Higher isolation but more complexity
- CAP theorem: Sacrificing strong consistency for availability and partition tolerance

#### 2.2 Saga Pattern

**Sources**:

- "Patterns of Enterprise Application Architecture"
- Multiple references to distributed transactions

**Core Concept**:
Manage distributed transactions across services using a sequence of local transactions. Each local transaction updates its service's database and publishes an event or message to trigger the next step.

**Advantages**:

- ✅ Enables distributed transactions without 2PC
- ✅ Maintains data consistency across services
- ✅ Can be implemented as choreography or orchestration
- ✅ Supports long-running transactions

**Disadvantages**:

- ❌ Complexity in error handling and compensation
- ❌ Lack of isolation between sagas
- ❌ Debugging distributed sagas is difficult
- ❌ Need careful design of compensating transactions

**Implementation Approaches**:

1. **Choreography**: Each service publishes events that trigger next steps
2. **Orchestration**: Central coordinator manages saga workflow

### 3. Communication Patterns

#### 3.1 API Gateway

**Sources**:

- "Microservices Guide" - API Gateway section
- 4 articles discussing client communication patterns

**Core Concept**:
Single entry point for all client requests. The gateway routes requests to appropriate services, may aggregate results from multiple services, and handles cross-cutting concerns.

**Advantages**:

- ✅ Simplified client interface
- ✅ Reduced round trips (aggregation)
- ✅ Centralized cross-cutting concerns (auth, rate limiting)
- ✅ Protocol translation (REST to gRPC, etc.)

**Disadvantages**:

- ❌ Potential bottleneck
- ❌ Single point of failure
- ❌ Can become a god object if not careful
- ❌ Additional network hop

**Trade-offs**:

- **vs. Direct Client-Service Communication**: Adds latency but improves maintainability
- **vs. Backend for Frontend (BFF)**: API Gateway is more generic, BFF is client-specific

### 4. Deployment Patterns

#### 4.1 Containerization

**Sources**:

- "Microservice Prerequisites"
- Infrastructure discussions across 6 articles

**Core Concept**:
Package each service with its dependencies in containers. Enables consistent deployment across environments.

**Advantages**:

- ✅ Environment consistency
- ✅ Rapid provisioning
- ✅ Resource isolation
- ✅ Easy scaling

**Disadvantages**:

- ❌ Learning curve for container orchestration
- ❌ Monitoring complexity
- ❌ Security considerations

## Key Trade-offs Summary

| Dimension                 | Microservices | Monolithic | Source                   |
| ------------------------- | ------------- | ---------- | ------------------------ |
| Initial Development Speed | Low           | High       | "Microservices Guide"    |
| Scalability (Technical)   | High          | Low        | Multiple articles        |
| Scalability (Team)        | High          | Low        | "Monolith First"         |
| Operational Complexity    | High          | Low        | "Microservice Premium"   |
| Deployment Flexibility    | High          | Low        | Multiple articles        |
| Data Consistency          | Eventual      | Strong     | Data management articles |
| Debugging Difficulty      | High          | Low        | "Testing Strategies"     |
| Technology Diversity      | High          | Low        | "Polyglot Persistence"   |

## Fowler's Key Recommendations

### 1. Monolith First

**Source**: "Monolith First" article

Start with a monolith, extract microservices later when boundaries become clear. Premature microservices lead to wrong boundaries.

**Reasoning**:

- Unknown domains make it hard to identify correct service boundaries
- Refactoring across services is much harder than within a monolith
- Microservices should be "second system" after learning the domain

### 2. Microservice Prerequisites

**Source**: "Microservice Prerequisites" article

Don't adopt microservices unless you have:

1. ✅ Rapid provisioning (< 1 hour to provision new service)
2. ✅ Basic monitoring (know when services are up/down)
3. ✅ DevOps culture (teams own deployment and operations)
4. ✅ Continuous delivery (automated deployment pipeline)

### 3. Microservice Premium

**Source**: "Microservice Premium" article

Microservices have a "premium" cost:

- Higher operational overhead
- More complex deployment
- Distributed system challenges
- Only worth it when benefits outweigh costs

**When Premium is Worth It**:

- Large teams that need independence
- Different scalability requirements
- Need for polyglot technology

## Anti-Patterns Identified

### 1. Distributed Monolith

**Problem**: Services are microservices in deployment but monolith in design (tight coupling, shared database)
**Solution**: Properly apply bounded contexts and database-per-service

### 2. Premature Decomposition

**Problem**: Starting with microservices before understanding domain
**Solution**: Monolith first, extract services later

### 3. Ignoring Prerequisites

**Problem**: Adopting microservices without proper infrastructure
**Solution**: Build prerequisites first (monitoring, CI/CD, rapid provisioning)

### 4. Wrong Boundaries

**Problem**: Services decomposed by technical layers instead of business capabilities
**Solution**: Apply DDD or business capability decomposition

## Implementation Recommendations

### For Small Teams (< 10 people)

- ❌ Don't use microservices
- ✅ Build modular monolith
- ✅ Prepare for future extraction with good boundaries

### For Medium Teams (10-50 people)

- ⚠️ Consider microservices if prerequisites met
- ✅ Start with 3-5 services max
- ✅ Invest heavily in tooling and automation

### For Large Teams (> 50 people)

- ✅ Microservices likely beneficial
- ✅ Decompose by business capability
- ✅ Invest in platform team for shared infrastructure

## Patterns Not Discussed (Gaps Identified)

The following patterns were mentioned but not deeply covered:

- Event Sourcing (mentioned in 2 articles)
- CQRS (mentioned briefly)
- Service Mesh (not covered, post-article era)
- Serverless Microservices (not covered)

## Research Quality Notes

- ✅ All 30 articles successfully retrieved
- ✅ All citations verified against source content
- ✅ No patterns listed without article support
- ⚠️ Some articles older (2014-2018), may not reflect latest practices
- ⚠️ Kubernetes and modern container orchestration not extensively covered (predates widespread adoption)

## Next Steps for Deep Dive

Based on this research, recommended follow-up topics:

1. Saga pattern implementation details
2. Event-driven architecture patterns
3. Modern service mesh solutions
4. Observability and monitoring strategies
```

### Main Claude Verification

```bash
# Review the report
cat ./research/microservices-patterns-report.md

# Spot-check citations (verify articles actually discuss the patterns)
# Main Claude can quickly browse 2-3 of the cited article links
```

Verification complete ✓

## Key Takeaways

### Why This Task is Suitable for Delegation

1. **Tool-Intensive**: 60+ `navigate_page` + `take_snapshot` calls
2. **Clear Boundaries**:
   - Input: List of 30 article URLs
   - Output: Structured research report with specific sections
3. **Simple Verification**: Read report summary, spot-check 2-3 citations
4. **Research-Heavy**: GLM can aggregate information efficiently

### Delegation Checklist

✅ **Clear Inputs**: Article list with URLs provided
✅ **Clear Outputs**: Report structure and required sections specified
✅ **Research Objectives**: Specific extraction goals defined
✅ **Quality Requirements**: Citation and evidence requirements stated
✅ **Simple Verification**: Spot-check citations against sources

### Verification Strategy

**Quick Checks (2 minutes)**:

- Report completeness: Check all required sections present
- Citation count: Verify each pattern has sources listed
- Executive summary: Confirms scope of research

**Spot Checks (5 minutes)**:

- Pick 2-3 patterns at random
- Browse cited articles to verify pattern is actually discussed
- Check if advantages/disadvantages match article content

**Optional Deep Checks**:

- Read full report in detail
- Verify all 30 articles were processed
- Check for potential misinterpretations

## Variations

### Technology Comparison Research

```
"Please research and compare 5 state management libraries for React.

**Inputs**:
- Libraries: Redux, Zustand, Jotai, Valtio, MobX
- Focus: Performance, DX, bundle size, TypeScript support

**Research Sources**:
- Official documentation (provide URLs)
- GitHub repositories (stars, issues, activity)
- npm package stats

**Output Format**:
- Comparison table (features, metrics)
- Pros/cons for each library
- Use case recommendations
- Code example comparisons

**Acceptance Criteria**:
- All metrics verified from sources
- Code examples are accurate
"
```

### Best Practices Compilation

````
"Please compile React Hook best practices from official docs and community resources.

**Inputs**:
- React docs: https://react.dev
- Blog posts: ./research/react-hooks-articles.txt (20 URLs)

**Research Objectives**:
1. Extract hook usage patterns
2. Identify common pitfalls
3. Collect performance optimization tips
4. Gather testing strategies

**Output Format**:
```markdown
# React Hooks Best Practices

## 1. useState Patterns
### DO: ...
### DON'T: ...
### Example: ...

## 2. useEffect Patterns
...
````

**Acceptance Criteria**:

- Each best practice cited from sources
- Examples are runnable code
  "

```

### API Documentation Consolidation

```

"Please consolidate Stripe API documentation for payment processing.

**Inputs**:

- Stripe Docs: https://stripe.com/docs/api
- Focus areas: Customers, PaymentIntents, PaymentMethods, Webhooks

**Research Requirements**:

1. Extract API endpoint details
2. Collect request/response schemas
3. Gather code examples (TypeScript preferred)
4. Document webhook event types

**Output Format**:

- Quick reference guide (Markdown)
- TypeScript type definitions
- Common integration patterns
- Error handling guide

**Acceptance Criteria**:

- All API endpoints documented
- Type definitions are accurate
  "

```

### Security Best Practices Research

```

"Please research OWASP Top 10 vulnerabilities and mitigation strategies.

**Inputs**:

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Additional sources: ./research/security-resources.txt

**Research Objectives**:

1. Summarize each vulnerability
2. Provide real-world examples
3. List mitigation techniques
4. Include code examples (secure vs. insecure)

**Output Format**:

- One section per vulnerability
- Risk assessment for each
- Actionable mitigation checklist
- Code comparison (bad vs. good)

**Acceptance Criteria**:

- All Top 10 covered
- Code examples are accurate
  "

```

## Common Pitfalls to Avoid

❌ **No Citation Requirements**
- Bad: "Summarize microservices patterns"
- Good: "Each pattern must cite specific article sources"

❌ **Vague Research Objectives**
- Bad: "Research the topic"
- Good: "Extract patterns, compare trade-offs, cite sources"

❌ **Ambiguous Output Structure**
- Bad: "Write a report"
- Good: Provide exact Markdown template with required sections

❌ **No Quality Criteria**
- Bad: Trust GLM output blindly
- Good: "Pros/cons must be based on article content, not speculation"

## Best Practices

### Provide Complete Source Lists
- Include all URLs or file paths
- Specify priority sources vs. supplementary sources
- Define what to do if sources conflict

### Define Research Scope
- What information to extract
- What to ignore or filter out
- How to handle missing information

### Specify Output Structure
- Provide complete Markdown template
- Define required sections
- Specify formatting for tables, lists, code blocks

### Require Evidence
- Every claim must cite sources
- Quotes should be verbatim
- Comparisons should be data-backed

### Make Verification Practical
- Spot-checking is realistic
- Full verification is not
- Focus on representative samples
```
