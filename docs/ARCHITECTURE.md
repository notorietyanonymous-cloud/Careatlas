# CareAtlas — Architecture

## Current state (Milestone 1)
Static front-end only. No real backend or AI integration.

```
index.html          → Application shell and view containers
style.css           → Design tokens and component styles
app.js              → View routing, live data binding, state
modules/            → Feature modules (one file per milestone feature)
  copilot.js        → Copilot panel, slash commands, workflow engine
  data/             → Synthetic patient and clinical data (JSON)
```

## Data flow (Milestone 1)
```
User action → app.js → module (copilot.js) → synthetic data → rendered UI
```

## Planned (future milestones)
```
Browser → API (Node/Express) → PostgreSQL (local) → Response
```

## Integration boundaries
- Best Practice / MedicalDirector: read-only export integration (future)
- Medicare: eligibility check API (future, requires PRODA)
- AI provider: provider-agnostic, model swappable (future)
- Datto / backup: infrastructure only, no application integration needed

## Design principles
- Modules are independent files — one feature, one file
- Synthetic data lives in `modules/data/` — separate from UI logic
- No feature may write to `index.html` directly — add a module
- Role-based access control designed in from Milestone 1
- Audit events emitted by every workflow action
- Provider-agnostic AI interface (no hard dependency on any one model)

## Subscription module boundaries
Feature flags control module visibility. Safety controls, audit trails
and data export are never feature-flagged — always available.
