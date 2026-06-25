<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - template principle slot 1 -> I. Tenant Isolation by Default
  - template principle slot 2 -> II. Server-Enforced Role Boundaries
  - template principle slot 3 -> III. Scheduling Integrity Is Sacred
  - template principle slot 4 -> IV. LGPD-Respecting Customer Privacy
  - template principle slot 5 -> V. MVP Core Before Adjacent Features
  - added VI. Billing-Ready Architecture Without MVP Billing
  - added VII. Responsive Web Is a Product Requirement
  - added VIII. Specification-Led Quality Gates
  - added IX. Modular Growth Under YAGNI
- Added sections:
  - Operational Constraints
  - Delivery Workflow
- Removed sections: none
- Templates requiring updates:
  - ✅ updated `.specify/templates/plan-template.md`
  - ✅ updated `.specify/templates/spec-template.md`
  - ✅ updated `.specify/templates/tasks-template.md`
  - ✅ reviewed `.specify/templates/commands/*.md` (no command templates present)
  - ✅ reviewed `AGENTS.md` (no principle references to update)
- Follow-up TODOs: none
-->

# Agendella Constitution

## Core Principles

### I. Tenant Isolation by Default
Every read, write, search, list, background job, cache key, export, and log entry MUST
resolve an active tenant and MUST be scoped to that tenant by default. Cross-tenant access
MUST require an explicit, reviewed administrative path and MUST never happen by omission.
Data models, queries, repositories, policies, and tests MUST make accidental tenant leakage
technically difficult.

Rationale: Agendella is multi-tenant from day one, so tenant isolation is a core safety
property rather than an implementation detail.

### II. Server-Enforced Role Boundaries
The platform MUST support at least two first-class salon roles: owner/administrator and
service professional. Each role MUST have a minimal permission set that is enforced on the
server for every protected operation. UI-only permission checks are insufficient. Features
that expose customer data, pricing, schedules, or administrative actions MUST document which
roles may execute them.

Rationale: The product serves different actors inside the same tenant, and permission bugs
are business-critical and privacy-relevant.

### III. Scheduling Integrity Is Sacred
Appointments are the heart of the product. The system MUST prevent double booking and MUST
respect salon business hours, professional availability, service duration, timezone rules,
and cancellation constraints. A bookable time slot is valid only when all domain invariants
hold simultaneously, and those invariants MUST be enforced on the server and at the data
consistency layer.

Rationale: Incorrect scheduling destroys trust immediately and cannot be delegated to client
validation alone.

### IV. LGPD-Respecting Customer Privacy
Customer personal data, including name, phone, email, notes, and service history, MUST be
collected minimally, stored and exposed only for legitimate salon operations, and never sent
to third parties without a defined legal basis or user consent. The product MUST be designed
to support export and deletion requests. Telemetry MUST avoid invasive collection and MUST
not compromise tenant or customer privacy.

Rationale: Privacy compliance is a product requirement, not a later legal patch.

### V. MVP Core Before Adjacent Features
The MVP MUST prioritize authentication, multi-tenant foundations, scheduling, services,
professionals, and customers. Desirable capabilities such as notifications, marketing,
loyalty, finance, or advanced analytics MUST not weaken the quality of the core domain.
Non-core integrations may be deferred, stubbed, or modularized, but the MVP foundation MUST
be production-worthy.

Rationale: The first release must stay lean without compromising the parts that define the
product's credibility.

### VI. Billing-Ready Architecture Without MVP Billing
Subscription plans, feature entitlements, and usage limits MUST be introducible later without
rewriting the scheduling and tenant core. The MVP MUST not require billing for the pilot salon,
and future charging rules MUST preserve the pilot salon as permanently exempt unless a later
business decision explicitly changes that policy.

Rationale: Commercial evolution is expected, but monetization cannot distort the initial core.

### VII. Responsive Web Is a Product Requirement
All MVP user journeys for salon staff and end customers MUST work in a mobile browser and MUST
remain usable on larger screens. Responsive behavior, touch-friendly interaction, and readable
layouts are part of the acceptance criteria, not post-launch polish.

Rationale: The primary operating environment is the phone, so poor mobile execution is a
product failure.

### VIII. Specification-Led Quality Gates
Critical domain rules for tenant isolation, authorization, scheduling conflicts, timezone,
service duration, and cancellation MUST have automated tests. Behavior changes MUST begin by
updating the specification and acceptance scenarios before implementation. A change is not
complete until the specification, implementation, and automated verification agree.

Rationale: The most damaging regressions occur in subtle business rules, so they need durable
specification and test coverage.

### IX. Modular Growth Under YAGNI
The system MUST evolve through coherent modules, starting with scheduling core and adding
domains such as commissions, finance, notifications, online payments, and loyalty only when
their own specifications justify them. New modules MUST integrate cleanly with existing tenant,
auth, and scheduling foundations while remaining as simple as current needs allow.

Rationale: Product breadth should grow intentionally, not through speculative complexity.

## Operational Constraints

- Tenant context MUST be resolved as early as possible in request handling and passed through
  all downstream services.
- Logs, monitoring, and support tooling MUST avoid exposing one tenant's data to another tenant
  or to unauthorized roles within the same tenant.
- Any feature that touches bookings MUST define how it handles concurrency, timezone, business
  hours, professional availability, and cancellation state transitions.
- Any feature that touches customer records MUST define retention, export, deletion, and consent
  implications when applicable.
- External channels such as WhatsApp, SMS, and email MUST remain optional integrations until they
  meet the same tenant, privacy, and audit requirements as core product flows.

## Delivery Workflow

- Every spec and implementation plan MUST include a constitution check covering tenant isolation,
  role enforcement, scheduling invariants, privacy/LGPD impact, responsive behavior, and whether
  the feature belongs in the MVP core or a later module.
- Tasks MUST be organized so foundational tenant, auth, and scheduling work lands before
  dependent feature work.
- Features that modify critical domain behavior MUST add or update automated tests before the
  implementation is considered complete.
- Reviews MUST reject changes that weaken default tenant scoping, move authorization checks only
  to the client, or bypass scheduling invariants.
- Deferred work is acceptable only when it does not compromise the non-negotiable principles in
  this constitution.

## Governance

- This constitution supersedes conflicting local conventions, plans, and feature-level decisions.
- Amendments require an updated constitution file, a short rationale in the Sync Impact Report,
  and corresponding template or workflow updates when the change alters delivery expectations.
- Versioning follows semantic versioning for governance:
  - MAJOR for removed or fundamentally redefined principles.
  - MINOR for new principles, new mandatory sections, or materially expanded obligations.
  - PATCH for clarifications that do not change expected behavior.
- Compliance review is mandatory during specification, planning, implementation, and review. Each
  phase MUST explicitly confirm constitutional alignment or document the reason work cannot
  proceed.
- Ratification records the first adoption of this constitution. Last Amended reflects the latest
  approved textual change.

**Version**: 1.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
