import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  getStatusBadgeClass,
  getStatusCardClass,
} from './agenda-utils';
import type { AgendaAppointmentViewModel } from './agenda-utils';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  template: `
    <article
      class="appt-card"
      [class]="cardClass"
      [class.appt-card--interactive]="showActionTrigger"
      [class.appt-card--compact]="isCompact"
      [class.appt-card--compressed]="isCompressed"
      [attr.aria-label]="appointment.timeRangeLabel + ', ' + appointment.clientName + ', ' + appointment.statusLabel"
    >
      @if (showActionTrigger) {
        <button
          type="button"
          class="appt-card__overlay"
          [attr.aria-label]="'Abrir ações para ' + appointment.clientName + ' às ' + appointment.startTimeLabel"
          (click)="actionRequested.emit()"
        ></button>
      }

      @if (appointment.appointment.requiresReview) {
        <div class="review-banner" role="alert" aria-live="polite">
          <span class="review-badge">Requer revisão</span>
          @if (appointment.appointment.reviewReason) {
            <span class="review-reason">{{ appointment.appointment.reviewReason }}</span>
          }
        </div>
      }

      <div class="appt-meta">
        <time [attr.datetime]="appointment.startAtUtc">
          {{ appointment.timeRangeLabel }}
        </time>
        <div class="appt-meta__status">
          <span class="appt-badge" [class]="badgeClass">{{ appointment.statusLabel }}</span>
          @if (showActionTrigger) {
            <span class="appt-action-hint" aria-hidden="true">Toque para agir</span>
          }
        </div>
      </div>

      <div class="appt-header">
        <div class="appt-names">
          <span class="appt-client">{{ appointment.clientName }}</span>
          <span class="appt-service">{{ appointment.serviceName }} · {{ appointment.durationLabel }}</span>
          <span class="appt-prof">{{ appointment.professionalName }}</span>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .appt-card {
      position: relative;
      display: grid;
      gap: var(--space-2);
      height: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-primary);
      border-radius: 18px;
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .appt-card--compact {
      padding: 10px;
      gap: 6px;
    }
    .appt-card--compressed {
      padding: 8px;
      gap: 4px;
    }
    .appt-card--interactive {
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
    }
    .appt-card--interactive:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 30px rgba(28, 25, 23, 0.08);
    }
    .appt-card__overlay {
      position: absolute;
      inset: 0;
      z-index: 2;
      border: none;
      background: transparent;
      cursor: pointer;
    }
    .appt-card__overlay:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
      border-radius: inherit;
    }
    .appt-card--scheduled { border-left-color: var(--color-primary); }
    .appt-card--completed { border-left-color: var(--color-neutral-400); opacity: 0.78; }
    .appt-card--cancelled { border-left-color: var(--color-error); }
    .appt-card--noshow    { border-left-color: var(--color-error); }
    .appt-card--review    { border-left-color: var(--color-warning); }
    .review-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: var(--color-warning-subtle);
    }
    .review-badge {
      color: var(--color-warning);
      font-size: var(--text-xs);
      font-weight: 700;
      white-space: nowrap;
    }
    .review-reason {
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      line-height: 1.4;
    }
    .appt-meta {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-2);
      color: var(--color-neutral-600);
      font-size: var(--text-xs);
    }
    .appt-meta time {
      position: relative;
      z-index: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .appt-meta__status {
      position: relative;
      z-index: 1;
      display: grid;
      justify-items: end;
      gap: 4px;
      min-width: 0;
    }
    .appt-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .appt-names {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .appt-client {
      color: var(--color-text-primary);
      font-size: var(--text-base);
      font-weight: 600;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .appt-service,
    .appt-prof {
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .appt-service {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .appt-prof {
      color: var(--color-text-tertiary);
      font-size: var(--text-sm);
    }
    .appt-badge  {
      flex-shrink: 0;
      padding: 4px 8px;
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .appt-action-hint {
      color: var(--color-primary);
      font-size: 0.7rem;
      font-weight: 600;
      line-height: 1;
      text-align: right;
    }
    .badge-scheduled { background: var(--color-primary-subtle); color: var(--color-primary); }
    .badge-completed { background: var(--color-neutral-100); color: var(--color-neutral-600); }
    .badge-cancelled { background: var(--color-error-subtle); color: var(--color-error); }
    .badge-noshow    { background: var(--color-error-subtle); color: var(--color-error); }
    .badge-review    { background: var(--color-warning-subtle); color: var(--color-warning); }
    .appt-card--compact .appt-meta {
      gap: 6px;
    }
    .appt-card--compact .appt-client {
      font-size: var(--text-sm);
    }
    .appt-card--compact .appt-service,
    .appt-card--compact .appt-prof {
      font-size: var(--text-xs);
    }
    .appt-card--compact .appt-badge {
      max-width: 100%;
      padding-inline: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .appt-card--compact .appt-action-hint,
    .appt-card--compact .appt-prof {
      display: none;
    }
    .appt-card--compressed .review-banner {
      padding: 6px 8px;
    }
    .appt-card--compressed .review-reason,
    .appt-card--compressed .appt-service {
      display: none;
    }
    .appt-card--compressed .appt-badge {
      font-size: 0.64rem;
      letter-spacing: 0.03em;
    }
  `],
})
export class AppointmentCardComponent {
  @Input({ required: true }) appointment!: AgendaAppointmentViewModel;
  @Input() showActionTrigger = false;
  @Output() actionRequested = new EventEmitter<void>();

  get badgeClass(): string {
    return getStatusBadgeClass(
      this.appointment.appointment.status,
      this.appointment.appointment.requiresReview,
    );
  }

  get cardClass(): string {
    return getStatusCardClass(
      this.appointment.appointment.status,
      this.appointment.appointment.requiresReview,
    );
  }

  get isCompact(): boolean {
    return this.appointment.layout.laneCount > 1;
  }

  get isCompressed(): boolean {
    return this.appointment.layout.laneCount > 2;
  }
}
