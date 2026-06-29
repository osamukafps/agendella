/**
 * Contratos de API do Agendella — gerados manualmente a partir dos records C#.
 * Campos em camelCase (serialização padrão do ASP.NET Core).
 * Datas como strings ISO 8601 (DateTimeOffset serializado como string).
 */

// ─── Status enums ─────────────────────────────────────────────────────────────

export type RecordStatus        = 'Active' | 'Inactive';
export type SalonStatus         = 'Active' | 'Inactive' | 'Suspended';
export type AppointmentStatus   = 'Scheduled' | 'Cancelled' | 'Completed' | 'NoShow';
export type AbsenceStatus       = 'Active' | 'Inactive';

export type ClientHistoryEventType =
  | 'AppointmentCreated'
  | 'Rescheduled'
  | 'Cancelled'
  | 'LateCancelled'
  | 'NoShow'
  | 'ReviewRequired'
  | 'ReviewResolved'
  | 'Completed';

// ─── Comuns ──────────────────────────────────────────────────────────────────

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
// (TokenResponse e MeResponse estão em auth.models.ts para evitar ciclos)

// ─── Salão ───────────────────────────────────────────────────────────────────

export interface SalonSettingsResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  timeZoneId: string;
  status: SalonStatus;
  minimumCancellationNoticeMinutes: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface UpdateSalonSettingsRequest {
  name: string;
  address: string;
  phone: string;
  timeZoneId: string;
  minimumCancellationNoticeMinutes: number;
}

export interface BusinessHourDto {
  dayOfWeek: string;           // 'Monday' | 'Tuesday' | ...
  startLocalTime: string | null;  // 'HH:mm'
  endLocalTime: string | null;
  isClosed: boolean;
}

export interface ReplaceBusinessHoursRequest {
  businessHours: BusinessHourDto[];
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceAmount: number;
  currency: string;
  status: RecordStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  durationMinutes: number;
  priceAmount: number;
  currency: string;
}

export type UpdateServiceRequest = CreateServiceRequest;

// ─── Profissionais ────────────────────────────────────────────────────────────

export interface ProfessionalResponse {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: RecordStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateProfessionalRequest {
  name: string;
  phone: string;
  email: string;
}

export type UpdateProfessionalRequest = CreateProfessionalRequest;

export interface WeeklyAvailabilityEntryDto {
  dayOfWeek: string;     // 'Monday' | 'Tuesday' | ...
  startLocalTime: string; // 'HH:mm'
  endLocalTime: string;
}

export interface ReplaceWeeklyAvailabilityRequest {
  slots: WeeklyAvailabilityEntryDto[];
}

export interface WeeklyAvailabilityResponse {
  slots: WeeklyAvailabilityEntryDto[];
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export interface ClientResponse {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: RecordStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateClientRequest {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export type UpdateClientRequest = CreateClientRequest;

export interface ClientHistoryEventResponse {
  id: string;
  clientId: string;
  appointmentId: string | null;
  type: ClientHistoryEventType;
  occurredAtUtc: string;
  description: string;
  createdAtUtc: string;
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export interface AppointmentResponse {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startAtUtc: string;
  endAtUtc: string;
  status: AppointmentStatus;
  requiresReview: boolean;
  reviewReason: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateAppointmentRequest {
  clientId: string;
  professionalId: string;
  serviceId: string;
  startAtUtc: string;
  manualEndAtUtc: string | null;
}

export interface RescheduleAppointmentRequest {
  newStartAtUtc: string;
  newManualEndAtUtc: string | null;
}

// ─── Disponibilidade ─────────────────────────────────────────────────────────

export interface AvailabilitySlotDto {
  startAtUtc: string;
  endAtUtc: string;
}

export interface AvailabilityResponse {
  professionalId: string;
  date: string;          // 'YYYY-MM-DD'
  durationMinutes: number;
  slots: AvailabilitySlotDto[];
}

// ─── Bloqueios do salão ───────────────────────────────────────────────────────

export interface SalonBlockResponse {
  id: string;
  startAtUtc: string;
  endAtUtc: string;
  reason: string;
  createdAtUtc: string;
}

export interface CreateSalonBlockRequest {
  startAtUtc: string;
  endAtUtc: string;
  reason: string;
}

// ─── Ausências da profissional ────────────────────────────────────────────────

export interface ProfessionalAbsenceResponse {
  id: string;
  professionalId: string;
  startAtUtc: string;
  endAtUtc: string;
  reason: string;
  status: AbsenceStatus;
  cancelledAtUtc: string | null;
  createdAtUtc: string;
}

export interface CreateProfessionalAbsenceRequest {
  professionalId: string;
  startAtUtc: string;
  endAtUtc: string;
  reason: string;
}

// ─── Conflitos de agendamento ────────────────────────────────────────────────

export type AppointmentConflictType =
  | 'business_hours'
  | 'professional_availability'
  | 'salon_block'
  | 'professional_absence'
  | 'existing_appointment';

export interface AppointmentConflictDetails {
  conflictType: AppointmentConflictType;
  blockStart: string | null;
  blockEnd: string | null;
  resourceId: string | null;
  resourceName: string | null;
}

/** Resposta 409 para conflitos de agendamento — extends ErrorResponse */
export interface AppointmentConflictErrorResponse extends ErrorResponse {
  code: 'appointment.conflict';
  details: AppointmentConflictDetails & Record<string, unknown>;
}
