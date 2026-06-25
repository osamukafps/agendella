# Scheduling Rules Checklist: Salon Scheduling Core MVP

**Purpose**: Validar se os requisitos escritos cobrem com clareza e completude as regras de
agendamento, disponibilidade, conflitos e casos de borda relacionados.
**Created**: 2026-06-23
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist testa a qualidade das regras descritas, nao o comportamento do sistema.

## Requirement Completeness

- [x] CHK001 Are all booking validity inputs explicitly specified, including start time, effective
  end time, service duration, professional weekly availability, salon hours, blocks, absences, and
  tenant scope? [Completeness, Spec §FR-009-019, Spec §CC-004]
- [x] CHK002 Are cancellation and rescheduling rules complete for all actors involved, including
  administradora overrides, profissional limits, client-request windows, and history recording?
  [Completeness, Spec §User Story 3, Spec §FR-022-026]
- [x] CHK003 Does the spec define what happens when a manual end time is earlier than or equal to
  the booking start time, or otherwise creates an invalid appointment window? [Gap, Spec §FR-009,
  Spec §Edge Cases]
- [x] CHK004 Does the spec define whether a professional absence may overlap an existing booking,
  and if so, whether the absence is blocked, allowed with warning, or forced into manual
  resolution? [Gap, Spec §FR-015, Spec §Edge Cases]
- [x] CHK005 Does the spec define whether salon-level blocks may overlap existing bookings and how
  those conflicts are surfaced for manual resolution? [Gap, Spec §FR-014, Spec §FR-028, Spec
  §Edge Cases]

## Requirement Clarity

- [x] CHK006 Is the distinction between "disponibilidade semanal recorrente", "ausencia pontual",
  and "bloqueio do salao" clear enough that the precedence order between them is objectively
  understood? [Clarity, Spec §FR-013-015, Spec §Edge Cases]
- [x] CHK007 Is the rule for consecutive appointments precise enough to avoid ambiguity about
  whether equality at the boundary (`fim == inicio`) is valid only for the same professional or for
  all relevant resources? [Clarity, Spec §FR-010, Spec §Clarifications]
- [x] CHK008 Is the phrase "sinalizar para revisao manual" specific enough to define what must be
  visible to users when hours change or entities are deactivated? [Ambiguity, Spec §FR-028-030,
  Spec §Edge Cases]

## Requirement Consistency

- [x] CHK009 Do scheduling constraints remain consistent between acceptance scenarios, edge cases,
  functional requirements, and constitutional constraints without conflicting precedence rules?
  [Consistency, Spec §User Story 1-3, Spec §Edge Cases, Spec §FR-009-019, Spec §CC-004]
- [x] CHK010 Are timezone rules consistent between the "preserve instant" clarification, the edge
  cases, and the success criteria? [Consistency, Spec §Clarifications, Spec §FR-016-017, Spec
  §SC-005]

## Scenario Coverage

- [x] CHK011 Are concurrency scenarios sufficiently covered for simultaneous booking attempts,
  simultaneous cancellation/rescheduling attempts, and race conditions around newly created blocks
  or absences? [Coverage, Spec §Edge Cases, Spec §FR-010, Spec §FR-014-015, Spec §CC-008]
- [x] CHK012 Are boundary-time scenarios covered for opening time, closing time, daylight saving
  transitions, weekly availability edges, and appointments crossing from valid into invalid time
  windows? [Coverage, Spec §Edge Cases, Spec §FR-011, Spec §FR-013, Spec §FR-016-017]
- [x] CHK013 Are zero-availability scenarios covered both for booking creation and for later
  rescheduling attempts after a prior booking already exists? [Coverage, Spec §User Story 3, Spec
  §FR-019, Spec §FR-031]

## Edge Case Coverage

- [x] CHK014 Are deletion/deactivation edge cases complete for service, professional, client, and
  salon states, including their effect on future bookings and manual follow-up expectations?
  [Coverage, Spec §FR-027-030, Spec §Edge Cases]
- [x] CHK015 Are invalid-input edge cases addressed for impossible times, negative durations,
  missing timezone context, and booking intervals outside the intersection of salon and
  professional availability? [Gap, Spec §FR-009-013, Spec §FR-016-017]

## Acceptance Criteria Quality

- [x] CHK016 Can the most critical scheduling outcomes be objectively verified from the spec text,
  especially overlap rejection, consecutive booking allowance, timezone display behavior, and no-
  availability messaging? [Measurability, Spec §User Story 1, Spec §User Story 3, Spec §SC-002,
  Spec §SC-005-006]

## Notes

- Prefer resolving unanswered items in the spec before implementation planning.
- Items marked `[Gap]` indicate likely missing requirement text, not failing software behavior.
