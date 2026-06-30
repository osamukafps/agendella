import { Component } from '@angular/core';
import { AgendaPageComponent } from './agenda-page.component';
@Component({
  selector: 'app-my-agenda-page',
  standalone: true,
  imports: [AgendaPageComponent],
  template: `<app-agenda-page scope="mine" />`,
})
export class MyAgendaPageComponent {}
