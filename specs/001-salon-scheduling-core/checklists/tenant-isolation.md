# Tenant Isolation Checklist: Salon Scheduling Core MVP

**Purpose**: Validar se os requisitos escritos definem isolamento entre tenants de forma completa,
clara e sem omissoes que possam permitir vazamento entre saloes.
**Created**: 2026-06-23
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist examina a especificacao do isolamento multi-tenant, nao controles de
implementacao concretos.

## Requirement Completeness

- [x] CHK001 Are tenant-scoping requirements defined for every core operation type mentioned in the
  spec: create, read, update, cancel, reschedule, list, search, view history, and view agenda?
  [Completeness, Spec §FR-002, Spec §FR-005-008, Spec §FR-018-020, Spec §FR-026, Spec §FR-032]
- [x] CHK002 Are tenant-scoping requirements defined for all entity types mentioned in the spec:
  salon, staff user, professional, service, client, booking, block, absence, and client-history
  event? [Completeness, Spec §FR-002, Spec §Key Entities]
- [x] CHK003 Does the spec define whether tenant scoping also applies to logs, exports, support
  tooling, and reporting views, rather than only user-visible data screens? [Gap, Constitution
  §Tenant Isolation by Default, Constitution §Operational Constraints, Spec §Edge Cases]

## Requirement Clarity

- [x] CHK004 Is "tenant ativo" defined clearly enough that implementers can identify which inputs or
  context establish it for every request path? [Clarity, Spec §CC-001, Constitution §Operational
  Constraints]
- [x] CHK005 Is the phrase "falha sem expor a existencia" precise enough to define whether the spec
  expects indistinguishable not-found behavior, generic authorization failure, or another explicit
  outcome? [Ambiguity, Spec §Edge Cases]
- [x] CHK006 Is the prohibition on cross-tenant access explicit enough to cover both direct record
  access and indirect leakage through counts, empty states, aggregated views, or schedule
  suggestions? [Clarity, Spec §FR-031-033, Spec §CC-002]

## Requirement Consistency

- [x] CHK007 Do tenant-isolation requirements remain consistent between functional requirements,
  clarifications, edge cases, and constitutional constraints without leaving any permitted cross-
  tenant exception in one section? [Consistency, Spec §Clarifications, Spec §Edge Cases, Spec
  §FR-002, Spec §FR-032-033, Spec §CC-001-002]
- [x] CHK008 Are role permissions consistent with tenant boundaries so that an administradora's wide
  control still remains strictly inside her own salon? [Consistency, Spec §User Story 1, Spec
  §FR-005, Spec §CC-003]

## Scenario Coverage

- [x] CHK009 Are negative scenarios defined for wrong-tenant identifiers in booking lookup, client
  history lookup, schedule search, and deactivated-entity handling? [Coverage, Spec §Edge Cases,
  Spec §FR-028-033]
- [x] CHK010 Are requirements defined for how no-availability responses avoid leaking that another
  tenant might have matching slots, professionals, or clients? [Coverage, Spec §User Story 3,
  Spec §FR-019, Spec §FR-031, Spec §Edge Cases]
- [x] CHK011 Are cross-tenant omission risks addressed for administrative bulk views such as day,
  week, and professional agenda listings? [Coverage, Spec §User Story 1, Spec §FR-018, Spec
  §FR-032]

## Ambiguities & Conflicts

- [x] CHK012 Does the spec explicitly forbid inferred cross-tenant visibility through "support",
  "analytics", or future-facing terms that might otherwise be read as allowed exceptions? [Conflict,
  Spec §FR-033, Spec §CC-002, Spec §Assumptions]
- [x] CHK013 Is there a documented requirement that tenant isolation must be preserved even when an
  entity is inactive, deactivated, or no longer bookable? [Coverage, Spec §FR-027-030, Spec
  §CC-001]

## Notes

- Any unchecked item here is a requirements risk with direct security and privacy impact.
- Use these questions before planning to eliminate accidental cross-tenant omissions.
