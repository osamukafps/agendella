import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (dialog.state(); as state) {
      <div class="confirm-dialog">
        <button
          class="confirm-dialog__backdrop"
          type="button"
          (click)="dialog.cancel()"
          aria-label="Fechar confirmação"
        ></button>

        <section
          class="confirm-dialog__panel"
          [class.confirm-dialog__panel--danger]="state.tone === 'danger'"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirm-dialog-title'"
          [attr.aria-describedby]="'confirm-dialog-message'"
        >
          <div class="confirm-dialog__content">
            <p class="confirm-dialog__eyebrow">Confirmação</p>
            <h3 id="confirm-dialog-title">{{ state.title }}</h3>
            <p id="confirm-dialog-message">{{ state.message }}</p>
          </div>

          <div class="confirm-dialog__actions">
            <button type="button" class="btn-ghost" (click)="dialog.cancel()">
              {{ state.cancelLabel }}
            </button>
            <button
              type="button"
              class="btn-primary"
              [class.confirm-dialog__confirm--danger]="state.tone === 'danger'"
              (click)="dialog.confirm()"
            >
              {{ state.confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  protected readonly dialog = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.dialog.state()) {
      this.dialog.cancel();
    }
  }
}
