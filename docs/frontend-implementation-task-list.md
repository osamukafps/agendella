# Tasks de Implementação Front-end — Agendella

## Objetivo

Transformar o diagnóstico de `docs/frontend-backend-gap-analysis.md` em uma lista de tasks implementáveis no front-end, sem mudanças no back-end, até o ponto em que o front fique 1-1 com o que a API atual realmente expõe.

## Premissas

- Não haverá criação nem alteração de endpoint no back-end.
- Toda task abaixo precisa usar apenas contratos já existentes.
- Onde o design system pede algo que hoje exigiria endpoint novo, a task deve resolver com a melhor UX possível usando a API atual.
- Tudo deve ser pensado mobile-first antes de desktop polish.

## Estratégia geral

- Agenda real será montada no front por composição de `/appointments` com `/clients`, `/professionals` e `/services`.
- Como `GET /appointments` não tem filtro por período, o front precisará paginar e montar a visão de dia/semana localmente.
- Como não existe busca textual server-side para clientes/profissionais/serviços, o formulário de agendamento precisará usar carregamento incremental e filtro local sobre os itens já carregados.
- Widgets da agenda sem suporte no back atual deixam de ser mock: devem ser removidos ou substituídos por resumos derivados dos dados reais.

## Ordem recomendada

1. Fundação compartilhada
2. Agenda e fluxos de agendamento
3. Cadastros e paginação
4. Configurações e operações auxiliares
5. Navegação mobile e aderência visual
6. Testes e hardening

## Backlog

## Épico 0 — Fundação Compartilhada

### FE-001 — Normalizar o shape de erro da API no front

- Objetivo: ajustar os tipos de erro do front para refletir o back real, inclusive `details` heterogêneo.
- Arquivos prováveis:
  - `frontend/src/app/core/api/api.models.ts`
  - `frontend/src/app/features/**`
- Dependências: nenhuma.
- Entregável:
  - tipo de erro compatível com validação 400, conflito 409 e regras 422.
- Aceite:
  - o front consegue diferenciar erro genérico, erro por campo e conflito de agendamento sem `any` espalhado.

### FE-002 — Criar utilitário compartilhado para mapear erros da API para UI

- Objetivo: centralizar parsing de `HttpErrorResponse` para mensagens de tela e de campo.
- Arquivos prováveis:
  - `frontend/src/app/shared/` ou `frontend/src/app/core/api/`
  - `frontend/src/app/features/**`
- Dependências: FE-001.
- Entregável:
  - helper reutilizável para extrair mensagem global, erros por campo e códigos conhecidos.
- Aceite:
  - clientes, serviços, profissionais, salão, bloqueios, ausências e agenda usam o mesmo padrão de tratamento.

### FE-003 — Criar infraestrutura base de sheet mobile

- Objetivo: disponibilizar um padrão reutilizável para formulários e detalhes mobile, alinhado ao design system.
- Arquivos prováveis:
  - `frontend/src/app/shared/`
  - `frontend/src/styles/**`
- Dependências: nenhuma.
- Entregável:
  - componente/estrutura reutilizável de bottom sheet com overlay, header, conteúdo scrollável e footer fixo.
- Aceite:
  - o fluxo de agendamento e o menu mobile podem migrar para sheet sem duplicação grande de layout.

### FE-004 — Criar infraestrutura base de confirmação destrutiva

- Objetivo: eliminar dependência de `window.confirm`.
- Arquivos prováveis:
  - `frontend/src/app/shared/`
  - `frontend/src/styles/**`
  - `frontend/src/app/features/services/services-page.component.ts`
  - `frontend/src/app/features/professionals/professionals-page.component.ts`
  - `frontend/src/app/features/clients/clients-page.component.ts`
  - `frontend/src/app/features/blocks/salon-blocks-page.component.ts`
  - `frontend/src/app/features/absences/professional-absences-page.component.ts`
- Dependências: FE-003.
- Entregável:
  - dialog/sheet confirmatório reutilizável.
- Aceite:
  - nenhuma ação destrutiva crítica depende de `confirm()`.

### FE-005 — Criar utilitário compartilhado de paginação cursor

- Objetivo: evitar que cada tela reimplemente `nextCursor`, append e estados de “carregar mais”.
- Arquivos prováveis:
  - `frontend/src/app/shared/` ou `frontend/src/app/core/`
  - `frontend/src/app/features/**`
- Dependências: nenhuma.
- Entregável:
  - padrão reutilizável para listas cursor-based.
- Aceite:
  - ao menos duas telas diferentes conseguem reaproveitar a mesma abordagem de paginação.

## Épico 1 — Agenda Real

### FE-101 — Remover o modelo mockado da agenda atual

- Objetivo: eliminar arrays locais, placeholders operacionais e fallbacks fake da tela `/agenda`.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.html`
  - `frontend/src/app/features/agenda/agenda-page.component.scss`
- Dependências: nenhuma.
- Entregável:
  - a tela deixa de depender de `appointments`, `summaryMetrics`, `insights`, `Beatriz` e `Atelier Belle Vie` hardcoded.
- Aceite:
  - não existe mais conteúdo fake operacional na rota `/agenda`.

### FE-102 — Criar camada de view-model da agenda baseada em dados reais

- Objetivo: compor `appointments` com nomes de cliente, serviço e profissional usando lookups carregados no front.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.ts`
  - `frontend/src/app/features/agenda/agenda-utils.ts`
  - `frontend/src/app/features/agenda/agenda-api.service.ts`
- Dependências: FE-101.
- Entregável:
  - mapeamento de `AppointmentResponse` para card renderizável.
- Aceite:
  - cada card de agenda mostra nome da cliente, serviço, profissional, horários e status sem depender de mock.

### FE-103 — Implementar carregamento paginado de agendamentos para montar dia/semana

- Objetivo: carregar páginas de `/appointments` até preencher a janela de visualização necessária.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-api.service.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.ts`
- Dependências: FE-102.
- Entregável:
  - rotina de fetch incremental por cursor para a agenda.
- Aceite:
  - a agenda consegue montar a visualização atual sem ficar restrita à primeira página da API.

### FE-104 — Implementar seleção real de dia e navegação semanal

- Objetivo: tornar o seletor de dias da agenda funcional sobre dados reais.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.html`
- Dependências: FE-103.
- Entregável:
  - dia selecionado, semana corrente e recarga/refiltro local.
- Aceite:
  - trocar o dia altera a timeline e os cards exibidos com base em dados reais.

### FE-105 — Renderizar timeline real com estados loading, empty e error

- Objetivo: substituir a timeline fake pela agenda real com estados claros para mobile.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.*`
- Dependências: FE-104.
- Entregável:
  - timeline com skeleton/loading, vazio e erro.
- Aceite:
  - a tela nunca fica em branco nem mostra layout fake quando a API falha ou não há agendamentos.

### FE-106 — Conectar `AppointmentCardComponent` à agenda roteada

- Objetivo: reaproveitar o componente existente de card em vez do card inline mockado.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.html`
  - `frontend/src/app/features/agenda/appointment-card.component.ts`
- Dependências: FE-105.
- Entregável:
  - cards reais usando `app-appointment-card`.
- Aceite:
  - review badge, status e conteúdo do card vêm do componente compartilhado.

### FE-107 — Substituir métricas/insights mockados por resumos derivados da agenda real

- Objetivo: remover qualquer bloco sem suporte de API e manter só o que puder ser derivado localmente.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.*`
- Dependências: FE-105.
- Entregável:
  - resumo do dia/semana baseado em contagem real de agendamentos/status.
- Aceite:
  - não existe mais faturamento, insight ou ilustração fake dependendo de dado inexistente.

### FE-108 — Tornar `/minha-agenda` uma visão real da agenda da profissional logada

- Objetivo: usar o comportamento do back que já filtra por `professional_id` quando aplicável.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/my-agenda-page.component.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.ts`
- Dependências: FE-105.
- Entregável:
  - variante da agenda otimizada para profissional.
- Aceite:
  - `/minha-agenda` exibe apenas o que a API devolver para a profissional autenticada.

## Épico 2 — Fluxos de Agendamento

### FE-201 — Plugar o formulário de criação de agendamento em uma ação real da agenda

- Objetivo: abrir `AppointmentFormComponent` a partir de `/agenda`.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.*`
  - `frontend/src/app/features/agenda/appointment-form.component.*`
- Dependências: FE-003, FE-105.
- Entregável:
  - CTA de “novo agendamento” em sheet mobile.
- Aceite:
  - a usuária consegue abrir o formulário real de criação sem sair da agenda.

### FE-202 — Implementar fontes paginadas para selects do formulário de agendamento

- Objetivo: evitar que o formulário dependa só da primeira página de clientes, serviços e profissionais.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-form.component.ts`
  - `frontend/src/app/features/clients/clients-api.service.ts`
  - `frontend/src/app/features/services/services-api.service.ts`
  - `frontend/src/app/features/professionals/professionals-api.service.ts`
- Dependências: FE-005, FE-201.
- Entregável:
  - carregamento incremental e append de itens para seleção.
- Aceite:
  - a usuária consegue carregar mais opções dentro do formulário sem recarregar a página.

### FE-203 — Adicionar filtro local sobre itens carregados no formulário de agendamento

- Objetivo: compensar a ausência de busca server-side.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-form.component.*`
- Dependências: FE-202.
- Entregável:
  - filtro por texto para clientes, serviços e profissionais sobre os itens carregados.
- Aceite:
  - em mobile, a usuária consegue reduzir rapidamente a lista dos itens já carregados.

### FE-204 — Integrar o `AvailabilityPickerComponent` ao fluxo visível da agenda

- Objetivo: usar a busca real de disponibilidade para seleção de horário.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-form.component.*`
  - `frontend/src/app/features/agenda/availability-picker.component.ts`
- Dependências: FE-201.
- Entregável:
  - seleção real de slot usando `GET /availability`.
- Aceite:
  - a lista de horários muda ao trocar profissional, serviço e data.

### FE-205 — Integrar cadastro inline de cliente no fluxo de agendamento

- Objetivo: permitir criar cliente e continuar no mesmo formulário.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-form.component.*`
  - `frontend/src/app/features/clients/clients-api.service.ts`
- Dependências: FE-201.
- Entregável:
  - cliente criado entra na lista e fica selecionado.
- Aceite:
  - a usuária consegue cadastrar cliente sem abandonar o fluxo de agendamento.

### FE-206 — Implementar tratamento específico de conflitos e regras de agendamento

- Objetivo: mostrar mensagens úteis para 409 e 422 vindos do back.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-form.component.ts`
  - `frontend/src/app/features/agenda/agenda-utils.ts`
  - `frontend/src/app/shared/` ou `frontend/src/app/core/api/`
- Dependências: FE-002, FE-204.
- Entregável:
  - mensagens claras para conflito de bloqueio, ausência, indisponibilidade, agendamento existente e regra de cancelamento/revisão.
- Aceite:
  - erros de agenda não aparecem como “erro ao salvar agendamento” genérico quando houver código conhecido.

### FE-207 — Recarregar a agenda após criação de agendamento

- Objetivo: refletir imediatamente o estado real após `POST /appointments`.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.ts`
  - `frontend/src/app/features/agenda/appointment-form.component.ts`
- Dependências: FE-201.
- Entregável:
  - refresh da view após criação.
- Aceite:
  - o novo agendamento aparece na agenda sem reload manual da página.

### FE-208 — Plugar ações de concluir, não compareceu, cancelar e resolver revisão

- Objetivo: conectar `AppointmentActionsComponent` aos endpoints reais do ciclo de vida.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-actions.component.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.*`
  - `frontend/src/app/features/agenda/agenda-api.service.ts`
- Dependências: FE-106, FE-207, FE-004.
- Entregável:
  - ações por card com recarga de estado após sucesso.
- Aceite:
  - o status do agendamento muda na UI após cada ação suportada pelo back.

### FE-209 — Plugar reagendamento real

- Objetivo: abrir `AppointmentFormComponent` em modo `reschedule`.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.*`
  - `frontend/src/app/features/agenda/appointment-form.component.ts`
- Dependências: FE-208.
- Entregável:
  - fluxo de reagendamento pelo endpoint `/appointments/{id}/reschedule`.
- Aceite:
  - o agendamento muda de horário e reaparece corretamente na agenda.

### FE-210 — Exibir `requiresReview` e `reviewReason` em todos os pontos relevantes

- Objetivo: tornar visível o estado de revisão exigido pelo back.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/appointment-card.component.ts`
  - `frontend/src/app/features/agenda/appointment-actions.component.ts`
  - `frontend/src/app/features/agenda/agenda-page.component.*`
- Dependências: FE-106, FE-208.
- Entregável:
  - badges, banners e ações coerentes com revisão pendente.
- Aceite:
  - todo agendamento com `requiresReview=true` fica claramente sinalizado.

## Épico 3 — Clientes

### FE-301 — Implementar paginação cursor na listagem de clientes

- Objetivo: permitir carregar mais clientes na tela `/clientes`.
- Arquivos prováveis:
  - `frontend/src/app/features/clients/clients-page.component.*`
- Dependências: FE-005.
- Entregável:
  - botão ou auto-load de “carregar mais”.
- Aceite:
  - a tela de clientes não fica presa à primeira página.

### FE-302 — Mapear erros de validação por campo no cadastro/edição de clientes

- Objetivo: tratar 400 e 409 além da duplicidade de telefone já coberta.
- Arquivos prováveis:
  - `frontend/src/app/features/clients/clients-page.component.*`
  - `frontend/src/app/features/clients/client-quick-form.component.ts`
- Dependências: FE-002.
- Entregável:
  - mensagens por campo para nome, telefone, email e notas.
- Aceite:
  - campos inválidos recebem feedback específico vindo do back.

### FE-303 — Alinhar `ClientQuickFormComponent` à mesma regra de máscara e erro de telefone

- Objetivo: evitar divergência entre o cadastro rápido e a tela de clientes.
- Arquivos prováveis:
  - `frontend/src/app/features/clients/client-quick-form.component.ts`
  - `frontend/src/app/core/utils/phone.ts`
- Dependências: FE-302.
- Entregável:
  - máscara progressiva, `digitsOnly` no payload e feedback de duplicidade.
- Aceite:
  - o quick form se comporta igual ao formulário principal de clientes.

### FE-304 — Melhorar estados de loading, vazio e retry da tela de clientes

- Objetivo: deixar a listagem consistente com o padrão mobile-first.
- Arquivos prováveis:
  - `frontend/src/app/features/clients/clients-page.component.*`
- Dependências: FE-301.
- Entregável:
  - estados explícitos e reutilizáveis.
- Aceite:
  - a tela comunica claramente carregamento, falha e ausência de dados.

### FE-305 — Refinar histórico do cliente com estados e paginação consistentes

- Objetivo: consolidar `/clientes/:clientId/historico` como tela real final.
- Arquivos prováveis:
  - `frontend/src/app/features/clients/client-history-page.component.*`
- Dependências: FE-002.
- Entregável:
  - tratamento melhor de erro inicial, erro de “carregar mais” e empty state.
- Aceite:
  - histórico continua funcional ao paginar e falhar parcialmente.

## Épico 4 — Serviços

### FE-401 — Implementar paginação cursor na listagem de serviços

- Objetivo: remover dependência da primeira página.
- Arquivos prováveis:
  - `frontend/src/app/features/services/services-page.component.*`
- Dependências: FE-005.
- Entregável:
  - listagem paginada com append.
- Aceite:
  - a tela de serviços carrega páginas adicionais da API.

### FE-402 — Expor `currency` no formulário de serviço

- Objetivo: alinhar a UI ao contrato real do back.
- Arquivos prováveis:
  - `frontend/src/app/features/services/services-page.component.*`
- Dependências: nenhuma.
- Entregável:
  - input/select para moeda, com `BRL` como default.
- Aceite:
  - criar e editar serviço não escondem um campo persistido pelo back.

### FE-403 — Mapear validação por campo no cadastro/edição de serviços

- Objetivo: tratar 400 com feedback específico.
- Arquivos prováveis:
  - `frontend/src/app/features/services/services-page.component.*`
- Dependências: FE-002.
- Entregável:
  - mensagens para nome, descrição, duração, preço e moeda.
- Aceite:
  - erros conhecidos do back são exibidos nos campos corretos.

### FE-404 — Melhorar estados e confirmação de desativação em serviços

- Objetivo: substituir `confirm()` e fechar a UX da tela.
- Arquivos prováveis:
  - `frontend/src/app/features/services/services-page.component.*`
- Dependências: FE-004.
- Entregável:
  - confirmação visual consistente e atualização local pós-sucesso.
- Aceite:
  - desativação funciona sem diálogo nativo do navegador.

## Épico 5 — Profissionais

### FE-501 — Implementar paginação cursor na listagem de profissionais

- Objetivo: remover dependência da primeira página.
- Arquivos prováveis:
  - `frontend/src/app/features/professionals/professionals-page.component.*`
- Dependências: FE-005.
- Entregável:
  - listagem paginada com append.
- Aceite:
  - a tela de profissionais carrega páginas adicionais.

### FE-502 — Mapear validação por campo no cadastro/edição de profissionais

- Objetivo: tratar 400 com feedback específico.
- Arquivos prováveis:
  - `frontend/src/app/features/professionals/professionals-page.component.*`
- Dependências: FE-002.
- Entregável:
  - mensagens para nome, telefone e email.
- Aceite:
  - a tela exibe erros de validação do back sem cair em mensagem genérica.

### FE-503 — Refinar o editor de disponibilidade semanal

- Objetivo: completar estados de loading/salvamento/erro/sucesso e consistência mobile.
- Arquivos prováveis:
  - `frontend/src/app/features/professionals/weekly-availability-editor.component.*`
  - `frontend/src/app/features/professionals/my-availability-page.component.ts`
- Dependências: FE-002.
- Entregável:
  - UX de disponibilidade mais robusta.
- Aceite:
  - editar disponibilidade funciona bem tanto em `/profissionais` quanto em `/minha-disponibilidade`.

### FE-504 — Melhorar estados e confirmação de desativação em profissionais

- Objetivo: substituir `confirm()` e fechar a UX da tela.
- Arquivos prováveis:
  - `frontend/src/app/features/professionals/professionals-page.component.*`
- Dependências: FE-004.
- Entregável:
  - confirmação consistente de desativação.
- Aceite:
  - desativação não usa mais diálogo nativo.

## Épico 6 — Salão

### FE-601 — Expor `timeZoneId` na tela de configurações do salão

- Objetivo: alinhar a UI ao contrato persistido pelo back.
- Arquivos prováveis:
  - `frontend/src/app/features/salon-settings/salon-settings-page.component.*`
- Dependências: nenhuma.
- Entregável:
  - campo editável para timezone.
- Aceite:
  - a administradora consegue ver e alterar o timezone enviado em `PUT /salon`.

### FE-602 — Mapear validação por campo em configurações do salão

- Objetivo: tratar 400 com feedback específico em nome, endereço, telefone, timezone e aviso mínimo.
- Arquivos prováveis:
  - `frontend/src/app/features/salon-settings/salon-settings-page.component.*`
- Dependências: FE-002, FE-601.
- Entregável:
  - mensagens por campo.
- Aceite:
  - erros de validação do back não ficam escondidos em banner genérico.

### FE-603 — Tratar explicitamente o caso de `business-hours` vazio

- Objetivo: substituir o fallback silencioso por um estado explícito de configuração inicial.
- Arquivos prováveis:
  - `frontend/src/app/features/salon-settings/salon-settings-page.component.ts`
  - `frontend/src/app/features/salon-settings/salon-settings-page.component.html`
- Dependências: nenhuma.
- Entregável:
  - estado “sem horários configurados” com CTA de salvar.
- Aceite:
  - a UI não mascara mais o retorno vazio da API como se fosse dado persistido.

### FE-604 — Melhorar UX mobile da edição de horários de funcionamento

- Objetivo: fechar a interação mobile de horários semanais e feedback de salvamento.
- Arquivos prováveis:
  - `frontend/src/app/features/salon-settings/salon-settings-page.component.*`
- Dependências: FE-603.
- Entregável:
  - edição mais clara de dias abertos/fechados e horários.
- Aceite:
  - alterar horários no mobile não exige adivinhação nem gera ambiguidade visual.

## Épico 7 — Bloqueios e Ausências

### FE-701 — Implementar paginação cursor na listagem de bloqueios

- Objetivo: consumir `nextCursor` já retornado pela API.
- Arquivos prováveis:
  - `frontend/src/app/features/blocks/salon-blocks-page.component.*`
- Dependências: FE-005.
- Entregável:
  - carregar mais bloqueios.
- Aceite:
  - a listagem de bloqueios não fica presa à primeira página.

### FE-702 — Mapear validação e estados de erro dos bloqueios

- Objetivo: tratar erro de datas inválidas, motivo e falhas de rede/API.
- Arquivos prováveis:
  - `frontend/src/app/features/blocks/salon-blocks-page.component.*`
- Dependências: FE-002.
- Entregável:
  - feedback claro por campo e por operação.
- Aceite:
  - criar bloqueio inválido mostra a causa real do erro.

### FE-703 — Substituir confirmação destrutiva de bloqueio

- Objetivo: remover `confirm()` da exclusão de bloqueio.
- Arquivos prováveis:
  - `frontend/src/app/features/blocks/salon-blocks-page.component.*`
- Dependências: FE-004.
- Entregável:
  - confirmação consistente para remoção.
- Aceite:
  - exclusão funciona via dialog/sheet próprio.

### FE-704 — Implementar paginação cursor na listagem de ausências

- Objetivo: consumir `nextCursor` já retornado pela API.
- Arquivos prováveis:
  - `frontend/src/app/features/absences/professional-absences-page.component.*`
- Dependências: FE-005.
- Entregável:
  - carregar mais ausências.
- Aceite:
  - a listagem de ausências não fica presa à primeira página.

### FE-705 — Mapear validação e estados de erro das ausências

- Objetivo: tratar erro de datas inválidas, motivo e conflitos de cancelamento.
- Arquivos prováveis:
  - `frontend/src/app/features/absences/professional-absences-page.component.*`
- Dependências: FE-002.
- Entregável:
  - feedback claro por campo e por operação.
- Aceite:
  - criar ou cancelar ausência inválida mostra mensagem compatível com o erro real.

### FE-706 — Substituir confirmação destrutiva de ausência

- Objetivo: remover `confirm()` do cancelamento de ausência.
- Arquivos prováveis:
  - `frontend/src/app/features/absences/professional-absences-page.component.*`
- Dependências: FE-004.
- Entregável:
  - confirmação consistente para cancelamento.
- Aceite:
  - cancelamento não usa diálogo nativo.

### FE-707 — Expor operação administrativa de ausências no front

- Objetivo: cobrir o suporte do back para administrar ausências por profissional.
- Arquivos prováveis:
  - `frontend/src/app/features/professionals/professionals-page.component.*`
  - `frontend/src/app/features/absences/professional-absences-page.component.*`
  - `frontend/src/app/features/absences/professional-absences-api.service.ts`
  - `frontend/src/app/app.routes.ts`
- Dependências: FE-704, FE-705.
- Entregável:
  - fluxo para admin listar/criar/cancelar ausência vinculada a um profissional específico.
- Aceite:
  - a administradora consegue operar ausências além da rota “minhas ausências”.

## Épico 8 — Navegação e UX Mobile

### FE-801 — Adequar a bottom nav mobile ao design system

- Objetivo: alinhar navegação principal mobile ao padrão definido.
- Arquivos prováveis:
  - `frontend/src/app/core/layout/app-shell.component.*`
- Dependências: nenhuma.
- Entregável:
  - bottom nav coerente, com destinos principais claros.
- Aceite:
  - navegação principal mobile deixa de parecer uma lista horizontal improvisada.

### FE-802 — Migrar o menu do usuário mobile para bottom sheet real

- Objetivo: alinhar o menu ao comportamento do design system.
- Arquivos prováveis:
  - `frontend/src/app/core/layout/app-shell.component.*`
  - `frontend/src/app/shared/`
- Dependências: FE-003.
- Entregável:
  - menu mobile em sheet com cabeçalho, itens e logout.
- Aceite:
  - abrir o avatar no mobile usa sheet, não dropdown fixo adaptado.

### FE-803 — Revisar responsividade da agenda para uso real em mobile

- Objetivo: garantir que timeline, cards e ações funcionem em viewport pequena.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/agenda-page.component.scss`
  - `frontend/src/app/features/agenda/appointment-card.component.ts`
  - `frontend/src/app/features/agenda/appointment-actions.component.ts`
- Dependências: FE-210.
- Entregável:
  - layout e interação de agenda ajustados para toque e leitura rápida.
- Aceite:
  - usar agenda no mobile não exige zoom, scroll lateral inesperado ou targets pequenos.

### FE-804 — Padronizar skeletons, empty states e toasts nas telas críticas

- Objetivo: fechar aderência visual/comportamental ao design system.
- Arquivos prováveis:
  - `frontend/src/app/shared/`
  - `frontend/src/app/features/**`
- Dependências: FE-003.
- Entregável:
  - componentes reutilizáveis de estado.
- Aceite:
  - telas críticas compartilham o mesmo padrão de feedback visual.

## Épico 9 — Testes e Hardening

### FE-901 — Cobrir a agenda real com testes de componente

- Objetivo: proteger a substituição do mock por integração real.
- Arquivos prováveis:
  - `frontend/src/app/features/agenda/*.spec.ts`
- Dependências: FE-210.
- Entregável:
  - testes para carga, renderização, empty state, erro e ações principais.
- Aceite:
  - regressões centrais da agenda são detectadas automaticamente.

### FE-902 — Cobrir paginação cursor nas listagens

- Objetivo: evitar regressão em “carregar mais” e append.
- Arquivos prováveis:
  - `frontend/src/app/features/clients/*.spec.ts`
  - `frontend/src/app/features/services/*.spec.ts`
  - `frontend/src/app/features/professionals/*.spec.ts`
  - `frontend/src/app/features/blocks/*.spec.ts`
  - `frontend/src/app/features/absences/*.spec.ts`
- Dependências: FE-301, FE-401, FE-501, FE-701, FE-704.
- Entregável:
  - testes cobrindo `nextCursor`.
- Aceite:
  - todas as telas paginadas têm cobertura mínima do fluxo incremental.

### FE-903 — Cobrir mapeamento de erros por campo

- Objetivo: garantir que validações do back sigam aparecendo corretamente na UI.
- Arquivos prováveis:
  - `frontend/src/app/features/**/*.spec.ts`
  - `frontend/src/app/shared/` ou `frontend/src/app/core/api/`
- Dependências: FE-002.
- Entregável:
  - testes dos cenários 400, 409 e 422 mais importantes.
- Aceite:
  - mensagens críticas não somem em refactors.

### FE-904 — Executar rodada final de QA mobile-first

- Objetivo: validar o backlog completo em fluxo real.
- Arquivos prováveis:
  - sem arquivo obrigatório; registrar checklist no repositório se o time quiser
- Dependências: todos os épicos anteriores.
- Entregável:
  - checklist executado para login, agenda, agendamento, clientes, serviços, profissionais, salão, bloqueios e ausências.
- Aceite:
  - nenhum fluxo crítico do MVP depende de mock, desktop-only behavior ou intervenção manual fora da UI.

## Marco de conclusão

O front pode ser considerado 1-1 com o back atual quando:

- `/agenda` e `/minha-agenda` não usam mais dados mockados.
- criação, reagendamento e ações de status de agendamento funcionam na UI.
- clientes, serviços, profissionais, bloqueios e ausências consomem paginação cursor real.
- configurações do salão expõem todos os campos persistidos pelo back atual.
- não há mais `confirm()` nativo nos fluxos críticos.
- não restam widgets fake baseados em dados que a API atual não entrega.
- erros de API são tratados com granularidade suficiente para operação real.
- a UX mobile principal segue o design system de forma funcional.

## Sugestão de fatiamento em entregas

### Entrega A — Tirar a agenda do mock

- FE-001 até FE-005
- FE-101 até FE-108

### Entrega B — Tornar o agendamento operacional

- FE-201 até FE-210

### Entrega C — Fechar cadastros e operações auxiliares

- FE-301 até FE-707

### Entrega D — Acabamento mobile e segurança contra regressão

- FE-801 até FE-904
