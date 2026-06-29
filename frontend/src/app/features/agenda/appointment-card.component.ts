import { Component, Input } from '@angular/core';
import { getStatusLabel, getStatusBadgeClass } from './agenda-utils';
import type { AppointmentResponse } from '../../core/api/api.models';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  template: `
    <article
      class="appt-card"
      [class.appt-card--review]="appt.requiresReview"
      [class.appt-card--done]="isDone"
    >
      @if (appt.requiresReview) {
        <div class="review-banner" role="alert" aria-live="polite">
          <span class="review-badge">⚠ Requer revisão</span>
          @if (appt.reviewReason) {
            <span class="review-reason">{{ appt.reviewReason }}</span>
          }
        </div>
      }

      <div class="appt-header">
        <div class="appt-names">
          <span class="appt-client">{{ clientName }}</span>
          <span class="appt-service">{{ serviceName }}{{ duration ? ' · ' + duration : '' }}</span>
          @if (showProfessional && professionalName) {
            <span class="appt-prof">{{ professionalName }}</span>
          }
        </div>
        <span class="appt-badge" [class]="badgeClass">{{ statusLabel }}</span>
      </div>
    </article>
  `,
  styles: [`
    .appt-card {
      background: var(--color-surface); border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg); padding: var(--space-3);
    }
    .appt-card--review { border-color: var(--color-warning); }
    .appt-card--done   { opacity: 0.65; }
    .review-banner {
      display: flex; align-items: flex-start; gap: var(--space-2);
      background: var(--color-warning-subtle); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3); margin-bottom: var(--space-2);
    }
    .review-badge {
      font-size: var(--text-xs); font-weight: 700; color: var(--color-warning);
      white-space: nowrap;
    }
    .review-reason {
      font-size: var(--text-xs); color: var(--color-text-secondary); line-height: 1.4;
    }
    .appt-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); }
    .appt-names  { display: flex; flex-direction: column; gap: 2px; }
    .appt-client { font-weight: 600; font-size: var(--text-sm); color: var(--color-text-primary); }
    .appt-service { font-size: var(--text-xs); color: var(--color-text-secondary); }
    .appt-prof   { font-size: var(--text-xs); color: var(--color-text-tertiary); }
    .appt-badge  {
      flex-shrink: 0; font-size: var(--text-xs); font-weight: 700; border-radius: var(--radius-pill);
      padding: 2px 8px; white-space: nowrap;
    }
    .badge-scheduled { background: var(--color-primary-subtle); color: var(--color-primary); }
    .badge-completed { background: var(--color-success-subtle); color: var(--color-success); }
    .badge-cancelled { background: var(--color-neutral-100);    color: var(--color-text-secondary); }
    .badge-noshow    { background: var(--color-error-subtle);   color: var(--color-error); }
    .badge-review    { background: var(--color-warning-subtle); color: var(--color-warning); }
  `],
})
export class AppointmentCardComponent {
  @Input({ required: true }) appt!: AppointmentResponse;
  @Input({ required: true }) clientName!: string;
  @Input({ required: true }) serviceName!: string;
  @Input() professionalName: string | null = null;
  @Input() showProfessional = false;
  @Input() duration = '';

  get statusLabel(): string { return getStatusLabel(this.appt.status); }
  get badgeClass(): string  { return getStatusBadgeClass(this.appt.status, this.appt.requiresReview); }
  get isDone(): boolean     { return this.appt.status !== 'Scheduled'; }
}
