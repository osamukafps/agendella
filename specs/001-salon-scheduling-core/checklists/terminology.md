# Terminology Checklist: Salon Scheduling Core MVP

**Purpose**: Validar consistencia de terminologia, glossario implicito e ausencia de sinonimos
ambiguousos no documento de requisitos.
**Created**: 2026-06-23
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist verifica se a linguagem da especificacao e consistente e testavel.

## Requirement Consistency

- [x] CHK001 Are the core role terms used consistently throughout the document, especially
  "administradora", "profissional", and "cliente", without drifting into overlapping or implied
  alternate personas? [Consistency, Spec §User Story 1-3, Spec §CC-003]
- [x] CHK002 Are "salao" and "tenant" used with a stable relationship everywhere, so the document
  never leaves doubt about whether they are equivalent, nested, or distinct concepts in this MVP?
  [Consistency, Spec §FR-001-002, Spec §CC-001, Spec §Key Entities]
- [x] CHK003 Are "agendamento", "atendimento", and "agenda" used consistently enough that each term
  refers to a distinct concept rather than interchangeable wording? [Consistency, Spec §User Story
  1-3, Spec §FR-005, Spec §FR-009-010, Spec §Key Entities]
- [x] CHK004 Are "desativacao", "inativo", and "exclusao fisica" used consistently so lifecycle
  expectations are not open to interpretation? [Consistency, Spec §Clarifications, Spec §FR-027-
  030, Spec §Assumptions]

## Requirement Clarity

- [x] CHK005 Is a canonical term defined for the client's request to cancel or reschedule, so the
  difference between a user action and an internally recorded request is explicit? [Clarity, Spec
  §User Story 3, Spec §FR-022-025]
- [x] CHK006 Is the distinction between "horario de funcionamento", "disponibilidade semanal",
  "bloqueio", and "ausencia" explicit enough that readers do not infer conflicting meanings?
  [Clarity, Spec §FR-011-015, Spec §Edge Cases]
- [x] CHK007 Is "instante original armazenado" sufficiently clear for non-technical readers, or does
  the spec need a plainer business-facing definition of the timezone rule? [Ambiguity, Spec
  §Clarifications, Spec §FR-016-017]

## Coverage

- [x] CHK008 Does the spec define or imply a usable glossary for all domain-critical terms that
  drive permissions, scheduling validity, lifecycle, and tenant isolation? [Gap, Spec §FR-002,
  Spec §FR-009-019, Spec §CC-001-004]
- [x] CHK009 Are all major headings, user stories, requirements, edge cases, and assumptions using
  the same canonical vocabulary without introducing unexplained synonyms? [Coverage, Spec §User
  Story 1-3, Spec §Edge Cases, Spec §Assumptions]

## Ambiguities & Conflicts

- [x] CHK010 Do any phrases mix business language and implementation-oriented language in ways that
  could confuse requirement readers, such as tenant-scoping terminology versus salon operations
  terminology? [Conflict, Spec §FR-002, Spec §CC-001, Spec §Assumptions]
- [ ] CHK011 Are there any terms whose meaning changes depending on section, such as "historico",
  "operacao interna", or "sob sua responsabilidade"? [Ambiguity, Spec §User Story 2-3, Spec
  §CC-003, Spec §Key Entities]

## Acceptance Criteria Quality

- [x] CHK012 Can the most important success criteria be understood without redefining terms such as
  "agendamento", "tenant ativo", or "fuso do salao" outside the current document? [Measurability,
  Spec §SC-001-006]

## Notes

- If several items remain open, add a short glossary section or normalize terms directly in the
  spec before planning.
