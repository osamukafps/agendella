import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { AgendaApiService, AppointmentConflictError } from './agenda-api.service';
import { AvailabilityPickerComponent } from './availability-picker.component';
import { ProfessionalsApiService } from '../professionals/professionals-api.service';
import { ClientsApiService } from '../clients/clients-api.service';
import { ServicesApiService } from '../services/services-api.service';
import { conflictTypeLabel } from './agenda-utils';
import type { AppointmentResponse, AvailabilitySlotDto, ProfessionalResponse, ClientResponse, ServiceResponse } from '../../core/api/api.models';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [AvailabilityPickerComponent],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css',
})
export class AppointmentFormComponent implements OnInit {
  /** 'create' → novo agendamento | 'reschedule' → reagendar existente */
  @Input() mode: 'create' | 'reschedule' = 'create';
  /** ID do agendamento a reagendar (modo reschedule) */
  @Input() appointmentId?: string;
  /** ID do profissional fixado no reagendamento */
  @Input() currentProfessionalId?: string;

  @Output() saved    = new EventEmitter<AppointmentResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly agendaApi       = inject(AgendaApiService);
  private readonly professionalsApi = inject(ProfessionalsApiService);
  private readonly clientsApi       = inject(ClientsApiService);
  private readonly servicesApi      = inject(ServicesApiService);

  readonly professionals = signal<ProfessionalResponse[]>([]);
  readonly clients       = signal<ClientResponse[]>([]);
  readonly services      = signal<ServiceResponse[]>([]);
  readonly isLoading     = signal(false);
  readonly isSaving      = signal(false);
  readonly error         = signal<string | null>(null);

  readonly selectedProfId  = signal<string>('');
  readonly selectedClientId = signal<string>('');
  readonly selectedSvcId   = signal<string>('');
  readonly selectedSlot    = signal<AvailabilitySlotDto | null>(null);

  readonly selectedService = computed(() =>
    this.services().find(s => s.id === this.selectedSvcId())
  );
  readonly durationMinutes = computed(() => this.selectedService()?.durationMinutes ?? 60);
  readonly activeProfessionalId = computed(() =>
    this.mode === 'reschedule' ? (this.currentProfessionalId ?? '') : this.selectedProfId()
  );

  readonly canSubmit = computed(() => {
    if (!this.selectedSlot()) return false;
    if (this.mode === 'create') {
      return !!(this.selectedProfId() && this.selectedClientId() && this.selectedSvcId());
    }
    return !!this.appointmentId;
  });

  async ngOnInit(): Promise<void> {
    if (this.mode === 'create') {
      this.isLoading.set(true);
      try {
        const [p, c, s] = await Promise.all([
          this.professionalsApi.list(),
          this.clientsApi.list(),
          this.servicesApi.list(),
        ]);
        this.professionals.set(p.items.filter(x => x.status === 'Active'));
        this.clients.set(c.items.filter(x => x.status === 'Active'));
        this.services.set(s.items.filter(x => x.status === 'Active'));
      } catch {
        this.error.set('Erro ao carregar dados. Recarregue a página.');
      } finally {
        this.isLoading.set(false);
      }
    }
    if (this.mode === 'reschedule' && this.currentProfessionalId) {
      this.selectedProfId.set(this.currentProfessionalId);
    }
  }

  onSlotSelected(slot: AvailabilitySlotDto): void {
    this.selectedSlot.set(slot ?? null);
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSubmit()) return;
    this.isSaving.set(true);
    this.error.set(null);
    try {
      let result: AppointmentResponse;
      const slot = this.selectedSlot()!;
      if (this.mode === 'reschedule') {
        result = await this.agendaApi.reschedule(this.appointmentId!, {
          newStartAtUtc: slot.startAtUtc,
          newManualEndAtUtc: null,
        });
      } else {
        result = await this.agendaApi.create({
          clientId: this.selectedClientId(),
          professionalId: this.selectedProfId(),
          serviceId: this.selectedSvcId(),
          startAtUtc: slot.startAtUtc,
          manualEndAtUtc: null,
        });
      }
      this.saved.emit(result);
    } catch (err) {
      this.error.set(
        err instanceof AppointmentConflictError
          ? conflictTypeLabel(err.conflictType)
          : 'Erro ao salvar agendamento.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }
}
