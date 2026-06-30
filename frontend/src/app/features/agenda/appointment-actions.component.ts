import { Component, EventEmitter, Input, Output } from '@angular/core';
import { canCancel, canComplete, canNoShow, canReschedule, canResolveReview } from './agenda-utils';
import type { AppointmentResponse } from '../../core/api/api.models';
import type { CollaboratorRole } from '../../core/auth/auth.models';

type PendingAppointmentAction = 'complete' | 'no-show' | 'cancel' | 'resolve-review' | null;

@Component({
  selector: 'app-appointment-actions',
  standalone: true,
  template: `
    <div class="actions-row">
      @if (canComplete(appt.status)) {
        <button
          type="button"
          class="action-btn action-btn--success"
          [disabled]="disabled"
          (click)="completed.emit()"
        >
          {{ pendingAction === 'complete' ? 'Concluindo…' : 'Concluir' }}
        </button>
      }
      @if (canNoShow(appt.status)) {
        <button
          type="button"
          class="action-btn action-btn--warning"
          [disabled]="disabled"
          (click)="noShowed.emit()"
        >
          {{ pendingAction === 'no-show' ? 'Salvando…' : 'Não compareceu' }}
        </button>
      }
      @if (canReschedule(appt.status)) {
        <button
          type="button"
          class="action-btn action-btn--neutral"
          [disabled]="disabled"
          (click)="rescheduled.emit()"
        >
          Reagendar
        </button>
      }
      @if (canCancel(appt.status)) {
        <button
          type="button"
          class="action-btn action-btn--danger"
          [disabled]="disabled"
          (click)="cancelled.emit()"
        >
          {{ pendingAction === 'cancel' ? 'Cancelando…' : 'Cancelar' }}
        </button>
      }
      @if (canResolveReview(appt.requiresReview, role)) {
        <button
          type="button"
          class="action-btn action-btn--review"
          [disabled]="disabled"
          (click)="reviewResolved.emit()"
        >
          {{ pendingAction === 'resolve-review' ? 'Resolvendo…' : 'Resolver revisão' }}
        </button>
      }
    </div>
    @if (appt.requiresReview) {
      <div class="review-notice" role="alert">
        <span class="review-badge">Requer revisão</span>
        @if (appt.reviewReason) { <span class="review-reason">{{ appt.reviewReason }}</span> }
      </div>
    }
  `,
  styles: [`
    .actions-row { display: flex; flex-wrap: wrap; gap: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-border-subtle); }
    .action-btn {
      height: 36px; padding: 0 var(--space-4); border-radius: var(--radius-md); border: none;
      font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer;
    }
    .action-btn[disabled] {
      opacity: 0.55;
      cursor: wait;
    }
    .action-btn--success { background: var(--color-success-subtle); color: var(--color-success); }
    .action-btn--warning { background: var(--color-warning-subtle); color: var(--color-warning); }
    .action-btn--neutral { background: var(--color-neutral-100); color: var(--color-text-primary); }
    .action-btn--danger  { background: var(--color-error-subtle); color: var(--color-error); }
    .action-btn--review  { background: var(--color-primary-subtle); color: var(--color-primary); }
    .review-notice { display: flex; align-items: center; gap: var(--space-2); padding-top: var(--space-2); flex-wrap: wrap; }
    .review-badge  { font-size: var(--text-xs); font-weight: 700; color: var(--color-warning); background: var(--color-warning-subtle); border-radius: var(--radius-pill); padding: 2px var(--space-2); }
    .review-reason { font-size: var(--text-xs); color: var(--color-text-secondary); }
  `],
})
export class AppointmentActionsComponent {
  @Input({ required: true }) appt!: AppointmentResponse;
  @Input() role: CollaboratorRole | null = null;
  @Input() disabled = false;
  @Input() pendingAction: PendingAppointmentAction = null;

  @Output() completed     = new EventEmitter<void>();
  @Output() noShowed      = new EventEmitter<void>();
  @Output() cancelled     = new EventEmitter<void>();
  @Output() rescheduled   = new EventEmitter<void>();
  @Output() reviewResolved = new EventEmitter<void>();

  readonly canComplete      = canComplete;
  readonly canNoShow        = canNoShow;
  readonly canCancel        = canCancel;
  readonly canReschedule    = canReschedule;
  readonly canResolveReview = canResolveReview;
}
