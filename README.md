# CareAtlas

An AI-native operating and quality improvement platform for Australian general practice.

## Status
Prototype — Milestone 1 in development. Not for clinical use.

## Local development

### Prerequisites
- Docker Desktop (Apple Silicon or Intel)
- A terminal

### Start the app
```bash
cd careatlas-local
docker compose up -d
```

- UI: http://localhost:8080
- API: http://localhost:3000

### Seed test data
```bash
docker compose exec -T db psql -U careatlas -d careatlas < seed.sql
```

## Repository structure
```
/                   → Static front-end (HTML, CSS, JS)
index.html          → Main application shell
style.css           → Design system and component styles
app.js              → View routing and live data binding
modules/            → Feature modules (added per milestone)
careatlas-local/    → Local Docker environment (not for production)
docs/               → Product documentation
```

## Documentation
- [Product Vision](docs/PRODUCT_VISION.md)
- [Roadmap](docs/ROADMAP.md)
- [Feature Register](docs/FEATURE_REGISTER.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Clinical Safety](docs/CLINICAL_SAFETY.md)
- [Changelog](docs/CHANGELOG.md)

## Important
All patient data in this prototype is entirely fictional.
No real clinical data is stored or processed.
Do not use for clinical decisions.
