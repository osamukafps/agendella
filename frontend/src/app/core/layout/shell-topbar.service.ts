import { Injectable, signal } from '@angular/core';

export interface ShellTopbarAction {
  label: string;
  ariaLabel?: string;
  icon?: string;
  onClick: () => void;
}

@Injectable({ providedIn: 'root' })
export class ShellTopbarService {
  private readonly _action = signal<ShellTopbarAction | null>(null);

  readonly action = this._action.asReadonly();

  setAction(action: ShellTopbarAction | null): void {
    this._action.set(action);
  }

  clearAction(): void {
    this._action.set(null);
  }
}
