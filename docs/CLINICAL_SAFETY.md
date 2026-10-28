# CareAtlas — Clinical Safety Principles

## Status: Prototype — Not for clinical use

## Absolute rules (cannot be overridden by any subscription tier or feature flag)

1. CareAtlas never auto-signs a clinical document.
2. CareAtlas never fabricates clinical evidence.
3. CareAtlas never claims MBS eligibility without clinician confirmation.
4. Every generated document requires explicit clinician review and approval before output.
5. All patient data in the prototype is fictional.
6. No real patient data may be stored without an approved security architecture review.
7. Audit trails must be preserved and cannot be deleted by any user role.
8. Clinical safety controls are not gated behind subscription tiers.

## Document generation safety
- All generated content is clearly labelled as AI-drafted and unverified.
- Conflicting or unsupported clinical claims must be flagged before approval.
- Missing information must be surfaced, not silently omitted.
- Clinician approval is a hard gate — not a soft suggestion.

## Before production use requires
- Security architecture review
- Privacy impact assessment
- Clinical governance approval
- Integration review with existing clinical software
- Staff training and change management plan
