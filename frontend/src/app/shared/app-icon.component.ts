import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';

const ICON_ALIASES: Record<string, string> = {
  crown: 'crown-1',
  'trash-square': 'trush-square',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgStyle],
  template: `
    <span
      class="app-icon"
      [class.app-icon--spin]="spin"
      [class.app-icon--inline]="inline"
      [ngStyle]="maskStyles()"
      [style.width.px]="size"
      [style.height.px]="size"
      [attr.role]="decorative ? null : 'img'"
      [attr.aria-hidden]="decorative ? 'true' : null"
      [attr.aria-label]="decorative ? null : ariaLabel"
    ></span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      color: inherit;
      line-height: 1;
    }

    .app-icon {
      display: inline-block;
      flex: 0 0 auto;
      background-color: currentColor;
      mask-position: center;
      mask-repeat: no-repeat;
      mask-size: contain;
      -webkit-mask-position: center;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-size: contain;
    }

    .app-icon--inline {
      vertical-align: middle;
    }

    .app-icon--spin {
      animation: app-icon-spin 0.8s linear infinite;
    }

    @keyframes app-icon-spin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  @Input({ required: true }) name = '';
  @Input() size = 20;
  @Input() decorative = true;
  @Input() ariaLabel = '';
  @Input() spin = false;
  @Input() inline = false;

  protected readonly maskStyles = computed(() => {
    const resolvedName = ICON_ALIASES[this.name] ?? this.name;
    const url = `url('/assets/svg/${resolvedName}.svg')`;

    return {
      'mask-image': url,
      '-webkit-mask-image': url,
    };
  });
}
