import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

let nextModalSheetId = 0;

@Component({
  selector: 'app-modal-sheet',
  standalone: true,
  template: `
    <div class="modal-sheet">
      <div class="modal-sheet__backdrop" aria-hidden="true"></div>

      <section
        class="modal-sheet__panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="description ? descriptionId : null"
      >
        <div class="modal-sheet__handle" aria-hidden="true"></div>

        <div class="modal-sheet__header">
          <div class="modal-sheet__copy">
            <h3 [id]="titleId">{{ title }}</h3>
            @if (description) {
              <p [id]="descriptionId">{{ description }}</p>
            }
          </div>

          <button
            type="button"
            class="modal-sheet__close"
            (click)="closed.emit()"
            [disabled]="disableClose"
            aria-label="Fechar formulário"
          >
            ✕
          </button>
        </div>

        <div class="modal-sheet__body">
          <ng-content select="[sheet-body]"></ng-content>
        </div>

        <div class="modal-sheet__footer">
          <ng-content select="[sheet-footer]"></ng-content>
        </div>
      </section>
    </div>
  `,
  styleUrl: './modal-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSheetComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() disableClose = false;

  @Output() closed = new EventEmitter<void>();

  readonly titleId = `modal-sheet-title-${nextModalSheetId}`;
  readonly descriptionId = `modal-sheet-description-${nextModalSheetId++}`;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.disableClose) {
      this.closed.emit();
    }
  }
}
