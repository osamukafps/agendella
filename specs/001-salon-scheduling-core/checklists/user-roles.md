# User Roles Checklist: Salon Scheduling Core MVP

**Purpose**: Validar completude, clareza e consistencia dos requisitos funcionais por perfil de
usuario, com foco em administradora e profissional.
**Created**: 2026-06-23
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist avalia a qualidade dos requisitos escritos, nao a implementacao.

## Requirement Completeness

- [x] CHK001 Are all actions available to the administradora explicitly enumerated across salon,
  service, professional, client, booking, blocking, cancellation, and rescheduling flows?
  [Completeness, Spec §User Story 1, Spec §FR-001-005, Spec §FR-014, Spec §FR-018, Spec §FR-023]
- [x] CHK002 Are all actions available to the profissional explicitly enumerated across own-agenda,
  manual booking, client registration, absence marking, cancellation, and rescheduling flows?
  [Completeness, Spec §User Story 2, Spec §FR-006-007, Spec §FR-015, Spec §FR-024-025]
- [x] CHK003 Does the spec define whether either role may deactivate or reactivate clients,
  services, and professionals, instead of only stating that such entities can be deactivated?
  [Gap, Spec §FR-003-004, Spec §FR-008, Spec §CC-003]
- [x] CHK004 Are read-only versus mutating capabilities defined for each role in every agenda view,
  including day, week, professional, and client-history contexts? [Completeness, Spec §FR-005-006,
  Spec §FR-018, Spec §FR-026]

## Requirement Clarity

- [x] CHK005 Is "gerencie apenas seus proprios agendamentos e ausencias" precise enough to define
  whether the profissional may view client history, blocked salon periods, or only appointment
  details required for her own work? [Clarity, Spec §FR-006, Spec §User Story 2]
- [x] CHK006 Is the boundary between a profissional acting on her own initiative versus acting on a
  client request clearly distinguished in cancellation and rescheduling rules? [Clarity, Spec
  §User Story 3, Spec §FR-022-025]
- [x] CHK007 Is "sob sua responsabilidade" defined with objective criteria so permission checks for
  the profissional are testable and not open to interpretation? [Ambiguity, Spec §CC-003]

## Requirement Consistency

- [x] CHK008 Do role-specific permissions stay consistent between user stories, functional
  requirements, and constitutional constraints without granting the profissional broader powers in
  one section than another? [Consistency, Spec §User Story 2, Spec §User Story 3, Spec §FR-006,
  Spec §FR-024-025, Spec §CC-003]
- [x] CHK009 Are administradora override powers described consistently wherever cancellation windows,
  schedule conflicts, and deactivation decisions are mentioned? [Consistency, Spec §User Story 1,
  Spec §User Story 3, Spec §FR-023, Spec §FR-028-030]

## Scenario Coverage

- [x] CHK010 Are alternate and exception scenarios defined for role misalignment, such as a
  profissional attempting to edit another profissional's booking, alter salon-level settings, or
  access another tenant's records? [Coverage, Spec §User Story 2, Spec §Edge Cases, Spec §FR-006,
  Spec §FR-032-033]
- [x] CHK011 Are empty-state requirements defined for each role when there are no appointments, no
  clients, no available slots, or no upcoming work in the selected period? [Gap, Spec §User Story
  1, Spec §User Story 2, Spec §User Story 3, Spec §FR-031]

## Acceptance Criteria Quality

- [x] CHK012 Can each role's primary responsibilities be objectively validated from the current
  acceptance scenarios without inferring missing steps or hidden permissions? [Measurability, Spec
  §User Story 1-3]

## Notes

- Mark items as completed with `[x]` when the specification text answers them clearly.
- Use unresolved items as targeted inputs for future clarification or spec amendment.
