# Análise Front x Back — Agendella

## Objetivo

Identificar o que falta para o front-end deixar de usar mocks e ficar alinhado ao back-end real, com foco em fluxos mobile-first, aderência ao `frontend/design-system.md` e quebra posterior em tasks implementáveis.

## Resumo executivo

O maior gap atual está na agenda. O back-end já expõe autenticação, disponibilidade, CRUD de agendamentos, ações de ciclo de vida, histórico de clientes, bloqueios, ausências, cadastros e configurações do salão, mas as telas `/agenda` e `/minha-agenda` continuam essencialmente mockadas. Existem componentes Angular já integrados com a API de agenda (`appointment-form`, `availability-picker`, `appointment-actions`, `appointment-card`), porém eles não estão conectados a nenhuma tela roteada.

Fora a agenda, o front já consome endpoints reais em boa parte do MVP, mas quase todas as telas param na primeira página de dados, tratam validações do back de forma genérica e ignoram partes relevantes do contrato. Os principais exemplos são: paginação cursor não consumida nas listagens, campo de timezone carregado mas não editável nas configurações do salão, e navegação/menu mobile ainda fora do comportamento pedido pelo design system.

Os contratos principais entre front e back estão, em geral, consistentes. Os desvios mais importantes são:

- `AppointmentResponse` traz apenas IDs e datas, sem nomes expandidos para renderizar cards da agenda.
- `ErrorResponse.details` está tipado no front como `Record<string, string[]>`, mas o back envia `object?` com formatos diferentes conforme o erro.
- Não há, no código atual do back, filtros por período na listagem de agendamentos nem endpoints de busca textual para clientes/profissionais/serviços.

## Metodologia

Investigação realizada em quatro frentes:

- Busca por mocks, placeholders e dados hardcoded no front com leitura de rotas, páginas, componentes e `ApiService`s em `frontend/src/app/**`.
- Leitura do `frontend/design-system.md` com foco em agenda, cards, sheets, menu do usuário, navegação mobile, inputs e estados.
- Leitura dos controllers, services, repositories, validators, middlewares e contratos do back em `backend/Agendella.Api/**`, `backend/Agendella.Application/**` e `backend/Agendella.Infrastructure/**`.
- Comparação manual dos contratos do front (`frontend/src/app/core/api/api.models.ts`, `frontend/src/app/core/auth/auth.models.ts`) com os records e responses reais do back em `backend/Agendella.Api/Contracts/**`.

Arquivos mais relevantes inspecionados:

- Front:
  - `frontend/src/app/app.routes.ts`
  - `frontend/src/app/core/auth/**`
  - `frontend/src/app/core/http/auth.interceptor.ts`
  - `frontend/src/app/core/layout/app-shell.component.*`
  - `frontend/src/app/features/**`
  - `frontend/design-system.md`
- Back:
  - `backend/Agendella.Api/Controllers/**`
  - `backend/Agendella.Api/Contracts/**`
  - `backend/Agendella.Api/Validators/**`
  - `backend/Agendella.Api/Middleware/**`
  - `backend/Agendella.Application/**`
  - `backend/Agendella.Infrastructure/Repositories/**`
  - `specs/001-salon-scheduling-core/contracts/openapi.yaml`

## Mapa de telas/features do front

- `/login`
  - Arquivos: `frontend/src/app/features/auth/login-page.component.*`
  - Situação: integrada com `/auth/login`, `/auth/refresh`, `/auth/logout` e `/me`.
- Shell autenticado, navegação e menu do usuário
  - Arquivos: `frontend/src/app/core/layout/app-shell.component.*`
  - Situação: navegação real por role, mas comportamento mobile ainda não bate com o design system.
- `/agenda`
  - Arquivos: `frontend/src/app/features/agenda/agenda-page.component.*`
  - Situação: mockada.
- `/minha-agenda`
  - Arquivos: `frontend/src/app/features/agenda/my-agenda-page.component.ts`
  - Situação: mockada; apenas reaproveita a mesma tela fake da agenda.
- Fluxos de agendamento não plugados
  - Arquivos: `frontend/src/app/features/agenda/appointment-form.component.*`, `appointment-card.component.ts`, `appointment-actions.component.ts`, `availability-picker.component.ts`
  - Situação: parcialmente implementados, sem uso real em tela roteada.
- `/clientes`
  - Arquivos: `frontend/src/app/features/clients/clients-page.component.*`
  - Situação: parcialmente integrada.
- `/clientes/:clientId/historico`
  - Arquivos: `frontend/src/app/features/clients/client-history-page.component.*`
  - Situação: integrada no núcleo, com paginação manual por `nextCursor`.
- `/servicos`
  - Arquivos: `frontend/src/app/features/services/services-page.component.*`
  - Situação: parcialmente integrada.
- `/profissionais`
  - Arquivos: `frontend/src/app/features/professionals/professionals-page.component.*`
  - Situação: parcialmente integrada.
- `/minha-disponibilidade`
  - Arquivos: `frontend/src/app/features/professionals/my-availability-page.component.ts`, `weekly-availability-editor.component.*`
  - Situação: integrada no núcleo.
- `/salon`
  - Arquivos: `frontend/src/app/features/salon-settings/salon-settings-page.component.*`
  - Situação: parcialmente integrada.
- `/bloqueios`
  - Arquivos: `frontend/src/app/features/blocks/salon-blocks-page.component.*`
  - Situação: parcialmente integrada.
- `/ausencias`
  - Arquivos: `frontend/src/app/features/absences/professional-absences-page.component.*`
  - Situação: parcialmente integrada.
- `/me`
  - Arquivos: `frontend/src/app/features/me/me-page.component.*`
  - Situação: integrada com `/me`.

## Mapa de recursos do back

- Autenticação e sessão
  - Controller: `backend/Agendella.Api/Controllers/AuthController.cs`
  - Endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`
  - Regras relevantes: refresh token em cookie `HttpOnly`, header `X-CSRF-Protection: 1` obrigatório em refresh/logout, tenant obrigatório em claims.
- Salão
  - Controller: `backend/Agendella.Api/Controllers/SalonController.cs`
  - Endpoints: `GET/PUT /salon`, `GET/PUT /salon/business-hours`
  - Regras relevantes: `PUT`s restritos a `administradora`.
- Serviços
  - Controller: `backend/Agendella.Api/Controllers/ServicesController.cs`
  - Endpoints: `GET /services`, `POST /services`, `GET /services/{id}`, `PUT /services/{id}`, `POST /services/{id}/deactivate`
  - Regras relevantes: paginação cursor, escrita restrita a `administradora`.
- Profissionais
  - Controller: `backend/Agendella.Api/Controllers/ProfessionalsController.cs`
  - Endpoints: `GET /professionals`, `POST /professionals`, `GET /professionals/{id}`, `PUT /professionals/{id}`, `POST /professionals/{id}/deactivate`, `GET/PUT /professionals/{id}/weekly-availability`
  - Regras relevantes: profissional só acessa/substitui a própria disponibilidade.
- Clientes
  - Controller: `backend/Agendella.Api/Controllers/ClientsController.cs`
  - Endpoints: `GET /clients`, `POST /clients`, `GET /clients/{id}`, `PUT /clients/{id}`, `POST /clients/{id}/deactivate`, `GET /clients/{id}/history`
  - Regras relevantes: telefone único por tenant; histórico é filtrado pelo próprio profissional quando aplicável.
- Agendamentos e disponibilidade
  - Controllers: `AppointmentsController.cs`, `AvailabilityController.cs`
  - Endpoints: `GET /appointments`, `POST /appointments`, `GET /appointments/{id}`, `POST /appointments/{id}/reschedule`, `POST /appointments/{id}/cancel`, `POST /appointments/{id}/complete`, `POST /appointments/{id}/no-show`, `POST /appointments/{id}/resolve-review`, `GET /availability`
  - Regras relevantes: conflito 409 estruturado, cancelamento tardio bloqueado para não-admin, profissional só opera seus próprios agendamentos, revisão só resolvida por admin.
- Bloqueios do salão
  - Controller: `backend/Agendella.Api/Controllers/SalonBlocksController.cs`
  - Endpoints: `GET /salon-blocks`, `POST /salon-blocks`, `DELETE /salon-blocks/{id}`
  - Regras relevantes: criação/remoção por `administradora`, agendamentos afetados passam a `requiresReview`.
- Ausências profissionais
  - Controller: `backend/Agendella.Api/Controllers/ProfessionalAbsencesController.cs`
  - Endpoints: `GET /professionals/{professionalId}/absences`, `POST /professional-absences`, `POST /professionals/{professionalId}/absences/{absenceId}/cancel`
  - Regras relevantes: profissional só cria/cancela as próprias ausências; admin pode operar sem `professional_id`; agendamentos afetados passam a `requiresReview`.

## Matriz Front x Back

| Módulo/Tela | Status no Front | Suporte no Back | Gap Encontrado | Prioridade | Observações |
| --- | --- | --- | --- | --- | --- |
| Login e bootstrap de sessão | 100% integrada | Completo | Sem gap funcional relevante identificado | Média | `AuthService` usa `/auth/login`, `/auth/refresh`, `/auth/logout` e `/me`; interceptor reenvia request após refresh |
| Meu perfil (`/me`) | 100% integrada | Completo | Tela somente leitura simples | Baixa | Consome `GET /me`; suficiente para MVP |
| Agenda (`/agenda`) | Mockada | Parcial | Tela usa arrays locais para agendamentos, métricas e insights; não chama `AgendaApiService` | Alta | `agenda-page.component.ts` contém `appointments`, `summaryMetrics`, `insights`, fallback `Beatriz` e `Atelier Belle Vie`; HTML tem `Placeholder SVG` |
| Minha agenda (`/minha-agenda`) | Mockada | Parcial | Reusa a mesma agenda fake, sem filtragem real nem consumo da API | Alta | `my-agenda-page.component.ts` só renderiza `<app-agenda-page />` |
| Criar/reagendar/cancelar/concluir/no-show/revisão de agendamento | Parcialmente integrada | Completo | Componentes existem e falam com a API, mas não estão ligados a nenhuma tela/rota real | Alta | `appointment-form`, `availability-picker`, `appointment-actions` e `appointment-card` estão órfãos |
| Clientes (`/clientes`) | Parcialmente integrada | Completo | CRUD real, mas sem paginação/load more, sem busca, sem mapeamento de validações 400 por campo | Alta | Trata duplicidade de telefone, mas ignora `details` de validação do backend |
| Histórico de cliente | Parcialmente integrada | Completo | Fluxo principal real; falta refinamento de estados e ligação com agendamentos | Média | É a única tela que consome `nextCursor` no HTML |
| Serviços (`/servicos`) | Parcialmente integrada | Completo | CRUD real, sem paginação, sem tratamento de validação por campo; `currency` fica hardcoded como `BRL` na UI | Média | O contrato aceita moeda, mas a tela não expõe esse campo |
| Profissionais (`/profissionais`) | Parcialmente integrada | Completo | CRUD real e disponibilidade real, mas sem paginação/load more e sem feedback de validação detalhado | Média | Expansão de disponibilidade funciona via `weekly-availability-editor` |
| Minha disponibilidade | 100% integrada no núcleo | Completo | Falta refinamento de UX/estados | Média | Usa `GET/PUT /professionals/{id}/weekly-availability` |
| Configurações do salão (`/salon`) | Parcialmente integrada | Completo | `timeZoneId` existe no contrato e no state do componente, mas não existe campo visível na tela | Alta | `formTimezone` é carregado/salvo, porém não é editável no HTML |
| Bloqueios do salão (`/bloqueios`) | Parcialmente integrada | Completo | CRUD real, mas `nextCursor` é ignorado e erros 400/403/404 não são tratados especificamente | Média | Usa `confirm()` nativo; sem UX de dialog/sheet |
| Ausências (`/ausencias`) | Parcialmente integrada | Completo | CRUD real de autoatendimento, mas `nextCursor` é ignorado e não existe UI admin para operar ausências de terceiros | Média | Back suporta admin sem `professional_id`, front só cobre a própria profissional |
| Métricas/insights laterais da agenda | Mockada | Inexistente no código atual | Blocos visuais sem endpoint correspondente | Baixa | Só manter se continuar no escopo; hoje é mock puro |
| Navegação mobile e menu do usuário | Parcialmente integrada | N/A | Funciona, mas não segue o design system para bottom nav fixa de 4 destinos e menu em bottom sheet | Média | Impacta UX mobile antes de qualquer refinamento desktop |

## Telas mockadas ou parcialmente mockadas

### 1. Agenda principal

Arquivos:

- `frontend/src/app/features/agenda/agenda-page.component.ts`
- `frontend/src/app/features/agenda/agenda-page.component.html`
- `frontend/design-mock-agenda.html`

Evidências:

- A tela não injeta `AgendaApiService`.
- Os agendamentos vêm de um array local `appointments`.
- O sidebar usa arrays locais `summaryMetrics` e `insights`.
- Existem placeholders explícitos no HTML: `Placeholder SVG` e `Ilustração futura`.
- Existem fallbacks hardcoded de identidade: `Beatriz` e `Atelier Belle Vie`.

Diagnóstico:

- A página é um mock visual avançado, não uma agenda funcional.
- O back já possui surface relevante para agenda real, mas a tela atual não consome nada disso.

### 2. Minha agenda

Arquivo:

- `frontend/src/app/features/agenda/my-agenda-page.component.ts`

Evidências:

- A rota existe, mas o componente só renderiza `<app-agenda-page />`.
- O comentário diz que a filtragem aconteceria no back, porém a tela não carrega agendamentos do back.

Diagnóstico:

- É um wrapper sobre a agenda mockada; não há valor funcional distinto hoje.

### 3. Fluxos de agendamento implementados, porém órfãos

Arquivos:

- `frontend/src/app/features/agenda/appointment-form.component.*`
- `frontend/src/app/features/agenda/availability-picker.component.ts`
- `frontend/src/app/features/agenda/appointment-actions.component.ts`
- `frontend/src/app/features/agenda/appointment-card.component.ts`

Evidências:

- O código já chama `/appointments`, `/availability` e ações de ciclo de vida.
- A busca textual por uso mostra que esses componentes não são referenciados por páginas roteadas.

Diagnóstico:

- Existe implementação parcial reaproveitável, mas o produto ainda não expõe esses fluxos.
- Esse é o atalho mais claro para sair do mock sem recomeçar do zero.

### 4. Listagens reais, mas sem paginação consumida

Arquivos:

- `frontend/src/app/features/clients/clients-page.component.ts`
- `frontend/src/app/features/services/services-page.component.ts`
- `frontend/src/app/features/professionals/professionals-page.component.ts`
- `frontend/src/app/features/blocks/salon-blocks-page.component.ts`
- `frontend/src/app/features/absences/professional-absences-page.component.ts`

Evidências:

- O back entrega paginação cursor em todas essas áreas.
- `blocks` e `absences` até guardam `nextCursor`, mas não têm botão ou auto-load no HTML.
- `clients`, `services` e `professionals` sequer persistem `nextCursor` no state da página.
- `appointment-form.component.ts` carrega apenas a primeira página de clientes/profissionais/serviços ao montar o formulário.

Diagnóstico:

- As telas são “reais”, mas não escaláveis para volume de produção.
- Isso afeta especialmente mobile e criação de agendamento.

### 5. Configurações do salão com contrato parcialmente exposto

Arquivos:

- `frontend/src/app/features/salon-settings/salon-settings-page.component.ts`
- `frontend/src/app/features/salon-settings/salon-settings-page.component.html`

Evidências:

- O state possui `formTimezone`.
- O back expõe `timeZoneId` em `SalonSettingsResponse` e aceita o campo em `UpdateSalonSettingsRequest`.
- A tela não tem input/select para timezone.

Diagnóstico:

- Há integração parcial: o valor é carregado e reenviado, mas não pode ser alterado pela usuária.

### 6. Fallback local em horários de funcionamento

Arquivo:

- `frontend/src/app/features/salon-settings/salon-settings-page.component.ts`

Evidências:

- Se `GET /salon/business-hours` retornar lista vazia, a UI cria `defaultBusinessHours()` localmente.

Diagnóstico:

- Não é mock puro, mas é um fallback que mascara o estado real.
- Precisa confirmar com o time se o comportamento esperado é “salão ainda não configurado” ou “sem horário definido”.

## Recursos disponíveis no back mas não usados no front

### Agendamentos e disponibilidade

Recursos prontos no back:

- `GET /appointments`
- `POST /appointments`
- `GET /appointments/{id}`
- `POST /appointments/{id}/reschedule`
- `POST /appointments/{id}/cancel`
- `POST /appointments/{id}/complete`
- `POST /appointments/{id}/no-show`
- `POST /appointments/{id}/resolve-review`
- `GET /availability`

Situação no front:

- Existe `AgendaApiService` cobrindo todos eles.
- Não existe tela roteada consumindo de fato esses endpoints.

### Admin operando ausências de qualquer profissional

Evidência:

- `backend/Agendella.Application/Scheduling/ProfessionalAbsenceService.cs` só restringe por `professionalId` quando `requesterProfessionalId` existe.

Situação no front:

- A única UI atual é `/ausencias`, focada na própria profissional logada.

### Paginação cursor em cadastros e agenda

Recursos prontos no back:

- Paginação em `services`, `professionals`, `clients`, `appointments`, `salon-blocks`, `professionals/{id}/absences`, `clients/{id}/history`.

Situação no front:

- Só o histórico do cliente expõe “Carregar mais”.
- O restante usa apenas a primeira página.

### Campo de timezone do salão

Recursos prontos no back:

- `SalonSettingsResponse.timeZoneId`
- `UpdateSalonSettingsRequest.timeZoneId`

Situação no front:

- State existe, UI não.

## Endpoints ou ajustes de back possivelmente faltantes

Listados apenas quando há evidência de ausência no código atual e impacto direto nos fluxos reais.

### 1. Filtro por período na listagem de agendamentos

Evidência:

- `GET /appointments` aceita apenas `pageSize` e `cursor`.
- `AppointmentRepository.ListAsync` pagina globalmente por `StartAtUtc`.
- O design system pede agenda diária/semanal e a tela atual mostra timeline de dia.

Impacto:

- Para montar agenda do dia/semana em tenants maiores, o front teria de paginar até encontrar o intervalo desejado.

Status:

- Precisa confirmar com o time se o esperado é evoluir `GET /appointments` com filtros de período ou montar isso no front com múltiplas páginas.

### 2. Payload expandido ou endpoint específico para cards da agenda

Evidência:

- `AppointmentResponse` devolve apenas `clientId`, `professionalId`, `serviceId`, datas e status.
- O design system e os componentes de card precisam nome de cliente, serviço e profissional de forma direta.

Impacto:

- O front pode resolver com lookups locais, mas isso aumenta round-trips, acoplamento e complexidade para mobile.

Status:

- Precisa confirmar se a agenda deve usar composição no front ou um response expandido/dedicado no back.

### 3. Busca textual para cliente/profissional/serviço

Evidência:

- O design system de criação de agendamento pede “cliente com busca”.
- Controllers e repositories atuais expõem apenas paginação cursor; não há `search`, `query`, `term` ou equivalente.
- O formulário atual de agendamento carregaria só a primeira página dessas entidades.

Impacto:

- Em base real, a usabilidade mobile do agendamento fica limitada.

Status:

- Precisa confirmar se o time aceita paginação simples no MVP ou se a busca server-side já entra na primeira rodada.

### 4. Endpoints de métricas/insights da agenda, caso esses widgets permaneçam no escopo

Evidência:

- A agenda mock exibe resumo mensal, faturamento e insights.
- Não existem endpoints equivalentes em controllers nem no OpenAPI atual.

Impacto:

- Os blocos laterais não podem sair do mock com o back atual.

Status:

- Só é gap real se o produto decidir manter esses widgets no MVP.

## Comparação de contratos

### Contratos alinhados

Os contratos principais do front em `frontend/src/app/core/api/api.models.ts` espelham corretamente, no geral, os records do back em `backend/Agendella.Api/Contracts/**`, incluindo:

- `TokenResponse`
- `MeResponse`
- `SalonSettingsResponse`
- `BusinessHourDto`
- `ServiceResponse`
- `ProfessionalResponse`
- `ClientResponse`
- `ClientHistoryEventResponse`
- `AppointmentResponse`
- `AvailabilityResponse`
- `SalonBlockResponse`
- `ProfessionalAbsenceResponse`
- `PaginatedResponse<T>`

### Ajustes de contrato a observar

- `frontend/src/app/core/api/api.models.ts`
  - `ErrorResponse.details` está tipado como `Record<string, string[]>`.
  - O back envia `details` como `IReadOnlyDictionary<string, object?>`.
  - Consequência: conflitos de agenda e outros erros estruturados não cabem bem nesse tipo genérico.
- `AppointmentResponse`
  - Está alinhado ao back, mas é enxuto demais para a UI final da agenda.
  - Consequência: a limitação não é “mismatch”, mas “contrato insuficiente para a tela final”.
- `ServiceResponse.currency`
  - O contrato suporta moeda.
  - A tela atual cria/edita serviço sem expor `currency`, assumindo `BRL`.
- `SalonSettingsResponse.timeZoneId`
  - O contrato existe e o state do front também.
  - A tela não deixa alterar o campo.

## Plano de ação por fases

### Fase 1 — Integrações críticas para MVP

#### 1. Substituir a agenda mock por agenda real

- O que fazer: conectar `/agenda` e `/minha-agenda` ao `AgendaApiService`, renderizar agendamentos reais e remover arrays locais/insights fake do fluxo principal.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/agenda/agenda-page.component.*`
  - `frontend/src/app/features/agenda/my-agenda-page.component.ts`
  - `frontend/src/app/features/agenda/agenda-api.service.ts`
  - Possível ajuste em `backend/Agendella.Api/Controllers/AppointmentsController.cs`
  - Possível ajuste em `backend/Agendella.Api/Contracts/Appointments/AppointmentResponse.cs`
- Dependências: decisão sobre filtro por período e payload expandido.
- Risco: Alto.
- Critério de aceite: `/agenda` e `/minha-agenda` exibem dados reais do tenant/profissional logado, sem arrays locais nem placeholders operacionais.
- Prioridade: Alta.

#### 2. Expor criação, reagendamento e ações do ciclo de vida do agendamento

- O que fazer: plugar `appointment-form`, `availability-picker`, `appointment-card` e `appointment-actions` em um fluxo mobile-first via sheet/dialog conforme o design system.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/agenda/appointment-form.component.*`
  - `frontend/src/app/features/agenda/availability-picker.component.ts`
  - `frontend/src/app/features/agenda/appointment-actions.component.ts`
  - `frontend/src/app/features/agenda/appointment-card.component.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.*`
- Dependências: item anterior e definição de UX mobile.
- Risco: Alto.
- Critério de aceite: criar, reagendar, cancelar, concluir, marcar no-show e resolver revisão usando endpoints reais e refletindo o estado do back na tela.
- Prioridade: Alta.

#### 3. Consumir paginação real nas listagens críticas

- O que fazer: implementar `nextCursor` em clientes, serviços, profissionais, bloqueios, ausências e nas fontes do formulário de agendamento.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/clients/clients-page.component.*`
  - `frontend/src/app/features/services/services-page.component.*`
  - `frontend/src/app/features/professionals/professionals-page.component.*`
  - `frontend/src/app/features/blocks/salon-blocks-page.component.*`
  - `frontend/src/app/features/absences/professional-absences-page.component.*`
  - `frontend/src/app/features/agenda/appointment-form.component.*`
- Dependências: nenhuma de back, salvo decisão de busca textual.
- Risco: Médio.
- Critério de aceite: nenhuma listagem crítica fica restrita à primeira página em produção.
- Prioridade: Alta.

#### 4. Completar as configurações do salão

- O que fazer: expor `timeZoneId` na UI ou alinhar escopo para removê-lo temporariamente da edição.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/salon-settings/salon-settings-page.component.*`
  - Possível apoio em `backend/Agendella.Api/Validators/Salons/UpdateSalonSettingsRequestValidator.cs`
- Dependências: decisão de produto sobre timezone editável no MVP.
- Risco: Médio.
- Critério de aceite: todos os campos persistidos por `PUT /salon` são visíveis e editáveis, ou o escopo é explicitamente reduzido.
- Prioridade: Alta.

### Fase 2 — Melhorias de UX/estados/validações

#### 5. Mapear erros do back em mensagens de campo e estados de tela

- O que fazer: consumir `ErrorResponse.details`, conflitos de agenda e respostas 403/404/409/422 de forma específica.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/core/api/api.models.ts`
  - `frontend/src/app/features/**`
  - Possível criação de utilitário compartilhado em `frontend/src/app/shared/`
- Dependências: fluxos reais expostos em tela.
- Risco: Médio.
- Critério de aceite: formulários mostram erros por campo sempre que o back devolver validação estruturada.
- Prioridade: Alta.

#### 6. Ajustar loading, empty state e retry para mobile

- O que fazer: aplicar estados coerentes com o design system, especialmente agenda, cards, sheets e listagens longas.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/agenda/**`
  - `frontend/src/app/features/clients/**`
  - `frontend/src/app/features/services/**`
  - `frontend/src/app/features/professionals/**`
  - `frontend/src/app/features/blocks/**`
  - `frontend/src/app/features/absences/**`
- Dependências: integrações reais prontas.
- Risco: Médio.
- Critério de aceite: toda tela crítica tem loading, erro, vazio e ação de recuperação claros no mobile.
- Prioridade: Média.

#### 7. Tratar busca/seleção escalável para criação de agendamento

- O que fazer: decidir entre paginação incremental ou busca textual para clientes/profissionais/serviços e implementar a UX correspondente.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/agenda/appointment-form.component.*`
  - Possíveis ajustes em `backend/Agendella.Api/Controllers/ClientsController.cs`, `ServicesController.cs`, `ProfessionalsController.cs`
- Dependências: decisão sobre necessidade de endpoint de busca.
- Risco: Médio.
- Critério de aceite: a profissional consegue localizar cliente/serviço/profissional sem depender da primeira página.
- Prioridade: Média.

### Fase 3 — Refinamentos visuais e aderência ao design-system

#### 8. Alinhar navegação mobile e menu do usuário

- O que fazer: ajustar a bottom nav para o padrão definido e transformar o menu mobile em bottom sheet real.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/core/layout/app-shell.component.*`
  - `frontend/design-system.md`
- Dependências: nenhuma.
- Risco: Médio.
- Critério de aceite: navegação e menu seguem o comportamento mobile descrito no design system.
- Prioridade: Média.

#### 9. Substituir `confirm()` nativo por dialogs/sheets consistentes

- O que fazer: trocar confirmações destrutivas de clientes, serviços, profissionais, bloqueios e ausências por componentes alinhados ao design system.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/services/services-page.component.ts`
  - `frontend/src/app/features/professionals/professionals-page.component.ts`
  - `frontend/src/app/features/clients/clients-page.component.ts`
  - `frontend/src/app/features/blocks/salon-blocks-page.component.ts`
  - `frontend/src/app/features/absences/professional-absences-page.component.ts`
- Dependências: componente de dialog/sheet definido.
- Risco: Baixo.
- Critério de aceite: nenhuma ação destrutiva crítica depende de `window.confirm`.
- Prioridade: Média.

#### 10. Revisar agenda, cards, sheets e inputs com base no design system

- O que fazer: aplicar o comportamento esperado para agenda planner, cards de agendamento, sheet de criação, estados semânticos, telefone mascarado e feedback visual.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/features/agenda/**`
  - `frontend/src/app/features/clients/**`
  - `frontend/src/app/core/layout/**`
  - `frontend/src/styles/**`
- Dependências: agenda real em produção.
- Risco: Médio.
- Critério de aceite: UX mobile da agenda, formulários e navegação respeita o design system aprovado.
- Prioridade: Média.

### Fase 4 — Testes e hardening

#### 11. Cobrir fluxos reais com testes de componente/integração

- O que fazer: ampliar testes para agenda real, paginação, estados de erro, validação e restrição por role.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/**/*.spec.ts`
  - `backend/Agendella.Tests/Api/**`
- Dependências: fases anteriores concluídas.
- Risco: Médio.
- Critério de aceite: principais fluxos críticos têm cobertura automatizada mínima contra regressão.
- Prioridade: Média.

#### 12. Validar contratos front x back de forma recorrente

- O que fazer: revisar o modelo manual em `api.models.ts` ou substituir por geração/checagem automatizada baseada no OpenAPI.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/core/api/api.models.ts`
  - `specs/001-salon-scheduling-core/contracts/openapi.yaml`
  - Possível pipeline de CI
- Dependências: definição do padrão de contrato do time.
- Risco: Médio.
- Critério de aceite: mudanças no back que quebrarem DTOs do front são detectadas cedo.
- Prioridade: Média.

#### 13. Rodada final de QA mobile-first

- O que fazer: validar touch targets, navegação, rolagem, teclado, sheets e fluxos principais em viewport mobile antes de desktop polishing.
- Arquivos prováveis envolvidos:
  - `frontend/src/app/core/layout/**`
  - `frontend/src/app/features/**`
- Dependências: fases 1 a 3.
- Risco: Baixo.
- Critério de aceite: fluxos críticos são executáveis no mobile sem bloqueios de layout ou interação.
- Prioridade: Alta.

## Critérios gerais de aceite

- Nenhuma tela crítica do MVP usa mock quando já existe endpoint real correspondente.
- `/agenda` e `/minha-agenda` operam sobre dados reais, não sobre arrays locais.
- Fluxos críticos de agendamento usam API real para criar, reagendar, cancelar, concluir, marcar no-show e resolver revisão.
- Erros de API são tratados na UI com mensagens acionáveis.
- Loading, erro e empty state existem em todas as telas críticas.
- Paginação cursor do back é consumida onde houver volume real de dados.
- Formulários respeitam validações do back e exibem erros por campo quando disponíveis.
- Payloads enviados pelo front batem com os DTOs do back.
- Experiência mobile foi validada antes de refinamentos desktop.
- Navegação, agenda, cards, sheets, menu de usuário, inputs e estados visuais respeitam o `frontend/design-system.md`.

## Itens que precisam confirmar com o time

- Se a agenda real deve depender de composição client-side entre `/appointments` + cadastros auxiliares ou se o back pode expor payload expandido.
- Se `GET /appointments` será evoluído com filtros por período.
- Se busca textual para clientes/profissionais/serviços entra no MVP.
- Se os cards de métricas/insights da agenda continuam no escopo do produto.
- Se o fallback local de horários do salão quando a API devolve lista vazia é comportamento desejado ou só conveniência temporária.
