# Feature Specification: Salon Scheduling Core MVP

**Feature Branch**: `[001-salon-scheduling-core]`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "MVP do nucleo de agendamento multi-tenant para saloes de beleza, com operacao interna por administradora e profissional, sem agendamento publico pelo cliente, com regras rigidas de conflito, disponibilidade, fuso horario e isolamento entre tenants."

## Clarifications

### Session 2026-06-23

- Q: No MVP, entidades como servico, profissional e cliente podem ser excluidas fisicamente ou apenas desativadas? → A: Nao permitir exclusao fisica no MVP; apenas desativacao logica para servico, profissional e cliente, preservando historico e agendamentos.
- Q: A disponibilidade das profissionais no MVP herda apenas o horario do salao ou cada profissional tem disponibilidade semanal propria? → A: Cada profissional tem sua propria disponibilidade semanal recorrente, sempre limitada tambem pelo horario do salao.
- Q: Como o MVP trata fuso horario? → A: Decisao inicial substituida em 2026-06-25: cada salao possui um fuso IANA configuravel e armazenado no cadastro, com America/Sao_Paulo como valor padrao de seed do tenant piloto.
- Q: Existe algum acesso funcional cross-tenant no MVP? → A: Nao existe nenhum acesso funcional cross-tenant no MVP; toda operacao sempre acontece dentro de um tenant ativo.
- Q: Dois agendamentos podem ser consecutivos quando o primeiro termina exatamente no horario em que o proximo comeca? → A: Sim. Agendamentos consecutivos sao permitidos quando o primeiro termina exatamente no instante em que o proximo comeca.
- Q: Quais entidades precisam estar ativas para que um novo agendamento ou remarcacao seja valido? → A: Novo agendamento ou remarcacao so e valido se salao, profissional, servico e cliente estiverem ativos e pertencerem ao tenant ativo.
- Q: Existe registro separado da solicitacao da cliente antes da execucao de marcacao, cancelamento ou remarcacao? → A: Nao. O MVP nao tem estado separado de solicitacao; a equipe recebe a solicitacao por fora e registra apenas a operacao executada e seus eventos de historico.
- Q: O que acontece se o horario de fim manual for menor ou igual ao horario de inicio? → A: O sistema rejeita a operacao com erro claro; nao existe ajuste automatico para fim manual invalido.
- Q: O que acontece se uma ausencia pontual da profissional sobrepuser agendamentos ja existentes? → A: O sistema permite cadastrar a ausencia, nao altera agendamentos automaticamente e sinaliza imediatamente os agendamentos afetados para revisao manual.
- Q: O que acontece se um bloqueio do salao sobrepuser agendamentos ja existentes? → A: O sistema permite cadastrar o bloqueio, nao altera agendamentos automaticamente e sinaliza imediatamente os agendamentos afetados para revisao manual.
- Q: Qual e a ordem de precedencia entre horario do salao, disponibilidade semanal da profissional, bloqueios do salao e ausencias pontuais? → A: A validade do horario segue esta ordem: horario de funcionamento do salao, disponibilidade semanal da profissional, bloqueios do salao e ausencias pontuais da profissional; se qualquer camada bloquear o horario, ele fica indisponivel.
- Q: A regra de conflito e o encaixe consecutivo se aplicam a quais recursos no MVP? → A: No MVP, conflito e encaixe consecutivo entre agendamentos sao avaliados apenas dentro da agenda da mesma profissional.
- Q: O que significa exatamente "sinalizar para revisao manual" no MVP? → A: No minimo, o agendamento afetado deve ser marcado como "requer revisao", exibir o motivo da sinalizacao e manter esse status visivel na agenda e na visualizacao do agendamento ate resolucao manual.
- Q: A ordem operacional de validacao da disponibilidade deve ser repetida nos trechos-chave da spec ou existir apenas como regra central? → A: A spec deve repetir explicitamente a mesma logica operacional nos trechos-chave: horario do salao, disponibilidade semanal da profissional, bloqueios do salao, ausencias pontuais e, por fim, conflito na agenda da mesma profissional.
- Q: Qual e a regra geral de concorrencia para operacoes que afetam disponibilidade? → A: Toda criacao, remarcacao, bloqueio e ausencia que afete disponibilidade deve revalidar no instante da confirmacao; se outra operacao tiver ocupado ou bloqueado o horario antes, a operacao perdedora e rejeitada com erro claro, sem ajuste automatico.
- Q: Como funcionam as bordas de horario de funcionamento e disponibilidade semanal no MVP? → A: O inicio do atendimento pode coincidir exatamente com a abertura do salao e com o inicio da disponibilidade da profissional. O atendimento pode terminar depois do horario de fechamento do salao e da profissional, desde que tenha comecado em horario valido e continue respeitando bloqueios, ausencias e conflitos.
- Q: A resposta de indisponibilidade clara vale tambem para remarcacao de agendamento existente? → A: Sim. A mesma resposta clara de indisponibilidade, sem oferecer horarios invalidos, vale tanto para nova marcacao quanto para remarcacao.
- Q: O que acontece com agendamentos futuros quando a cliente e desativada? → A: Novos agendamentos e remarcacoes ficam bloqueados, mas os agendamentos futuros ja existentes permanecem preservados e devem ser sinalizados para revisao manual.
- Q: Quais entradas invalidas o sistema deve rejeitar explicitamente no MVP? → A: O sistema deve rejeitar com erro claro servico com duracao menor ou igual a zero, horario de inicio ou fim invalido/impossivel e agendamento cujo inicio nao pertença a intersecao valida entre salao e profissional.
- Q: Os resultados criticos de concorrencia e revisao manual devem virar criterios mensuraveis de sucesso? → A: Sim. O spec deve ter criterios mensuraveis para rejeicao da operacao perdedora em concorrencia e para sinalizacao obrigatoria de revisao manual em conflitos relevantes.
- Q: Todas as operacoes do sistema precisam estar relacionadas ao tenant ativo para o usuario? → A: Sim. Toda operacao de criar, ler, atualizar, cancelar, remarcar, listar, buscar, consultar historico e visualizar agenda deve ser escopada ao tenant ativo do usuario.
- Q: O vinculo com tenant deve ser detalhado por entidade? → A: Sim. Cada entidade operacional do MVP deve explicitar que pertence a um unico tenant e que suas referencias devem apontar apenas para registros do mesmo tenant.
- Q: Quais termos canonicos devem ser usados para os papeis e para a entidade interna de usuario? → A: O spec deve usar administradora e profissional como papeis internos, cliente para a pessoa atendida, usuaria apenas quando a regra valer igualmente para administradora e profissional, e Colaboradora do Salao como nome canonico da entidade interna.
- Q: Qual e a relacao canonica entre salao e tenant no MVP? → A: No MVP, cada salao corresponde exatamente a um tenant; os termos podem ser tratados como equivalentes no contexto operacional deste documento.
- Q: Qual e a relacao canonica entre agenda, agendamento e atendimento no MVP? → A: Agenda significa a visao/calendario. No MVP, agendamento e atendimento podem ser tratados como equivalentes para representar o registro marcado.
- Q: Qual e a definicao canonica de desativacao, inativo, reativacao e exclusao fisica no MVP? → A: Desativacao e a mudanca para o estado inativo. Reativacao e o retorno ao estado ativo. Exclusao fisica fica fora do MVP e deve ser bloqueada para as entidades protegidas.
- Q: O uso combinado de salao e tenant no documento ainda esta adequado? → A: Sim. Tenant continua onde ajuda a reforcar isolamento arquitetural, e salao permanece como termo de negocio no restante do documento.
- Q: Qual termo canonico deve ser usado para o contato externo da cliente pedindo alteracao de agendamento? → A: O spec deve padronizar essa situacao como solicitacao da cliente, sem criar qualquer estado proprio no sistema.
- Q: Quais sao as definicoes canonicas de horario de funcionamento, disponibilidade semanal, bloqueio e ausencia? → A: Horario de funcionamento e a janela base do salao. Disponibilidade semanal e a janela recorrente da profissional. Bloqueio e a indisponibilidade do salao. Ausencia e a indisponibilidade pontual da profissional.
- Q: O termo operacao interna precisa de definicao canonica? → A: Sim. Operacao interna significa acao executada por administradora ou profissional dentro do sistema, no contexto do tenant.
- Q: E necessario ampliar o glossario para incluir Tenant Ativo, Requer Revisao, Concorrencia e Operacao Perdedora? → A: Nao. Esses termos ja estao definidos de forma suficiente no corpo da spec e nos criterios atuais.
- Q: Logs, exportacoes, relatorios e ferramentas operacionais do MVP tambem devem obedecer ao isolamento por tenant? → A: Sim. Logs, exportacoes, relatorios e qualquer ferramenta operacional do MVP devem ser escopados ao tenant ativo e nao podem expor dados de outro salao.
- Q: Como o tenant ativo do usuario e estabelecido no MVP? → A: Cada Colaboradora do Salao pertence a um unico tenant, e o tenant ativo do usuario e sempre esse tenant. Nao existe troca de tenant na interface do MVP.
- Q: Como o sistema deve se comportar quando um registro nao pertence ao tenant ativo? → A: O sistema deve se comportar como "nao encontrado" para a usuaria, sem indicar que o dado existe em outro tenant.
- Q: A proibicao de acesso cross-tenant tambem cobre vazamentos indiretos? → A: Sim. A proibicao cobre contagens, agregados, estados vazios, sugestoes de agenda ou disponibilidade e qualquer inferencia indireta sobre outro salao.
- Q: A semantica de "nao encontrado" para acesso fora do tenant ativo deve aparecer tambem em CC-001? → A: Nao. CC-001 pode permanecer abstrata; essa semantica fica detalhada apenas nos requisitos funcionais.
- Q: Os poderes amplos da administradora precisam ser explicitamente limitados ao proprio tenant? → A: Sim. Os poderes amplos da administradora valem somente dentro do proprio tenant, inclusive para agenda, historico, cadastro e operacoes administrativas.
- Q: Lookups e operacoes com identificadores de outro tenant tambem devem falhar como "nao encontrado"? → A: Sim. Lookup de agendamento, historico da cliente, busca de agenda e operacoes com entidades desativadas tambem devem falhar como "nao encontrado" quando o identificador pertencer a outro tenant.
- Q: A resposta de indisponibilidade precisa de regra mais explicita para evitar inferencia indireta sobre outros tenants? → A: Nao. A redacao atual ja e suficiente ao exigir que nao haja referencias a outros tenants.
- Q: Visoes administrativas em lote tambem precisam ser explicitamente restritas ao tenant ativo? → A: Sim. Agenda do dia, da semana, por profissional e quaisquer consolidacoes operacionais tambem devem ficar estritamente restritas ao tenant ativo.
- Q: E necessario reforcar ainda mais FR-034 e CC-002 para impedir excecoes semanticas implicitas? → A: Nao. FR-034 e CC-002 ja vedam suficientemente qualquer excecao no MVP.
- Q: O isolamento por tenant precisa ser reiterado explicitamente para entidades inativas ou desativadas? → A: Nao. FR-002A, FR-033, FR-033B e CC-001 ja cobrem implicitamente esses casos de forma suficiente.
- Q: As capacidades da administradora devem explicitar tambem gestao de clientes e consulta ao historico das clientes? → A: Sim. A administradora pode cadastrar, alterar, ativar, desativar clientes e consultar o historico das clientes do proprio tenant.
- Q: O que a profissional pode fazer com dados e historico da cliente no proprio tenant? → A: A profissional pode cadastrar cliente novo, alterar dados basicos da cliente do proprio tenant e consultar apenas o historico da cliente relacionado aos proprios atendimentos dela.
- Q: Quem pode ativar, desativar e reativar clientes, servicos e profissionais? → A: A administradora ativa, desativa e reativa servicos e profissionais. A administradora e a profissional podem ativar, desativar e reativar clientes do proprio tenant.
- Q: Como ficam as permissoes de leitura e mutacao nas visoes de agenda e historico? → A: A agenda da administradora e leitura e operacao dentro do proprio tenant; a agenda da profissional e leitura e operacao apenas sobre seus proprios agendamentos e ausencias; o historico da cliente e somente leitura para ambos os perfis; a profissional nunca pode alterar registros de outra profissional.
- Q: O que a profissional pode visualizar alem dos proprios agendamentos e ausencias? → A: A profissional pode visualizar bloqueios do salao e outras indisponibilidades que afetem sua agenda, mas nao pode ver a agenda detalhada de outras profissionais.
- Q: A profissional pode cancelar ou remarcar seus proprios agendamentos apenas por solicitacao da cliente ou tambem por necessidade operacional? → A: A profissional pode cancelar ou remarcar seus proprios agendamentos tanto por solicitacao da cliente quanto por necessidade operacional, sempre respeitando os limites de politica e permissao do MVP.
- Q: O que significa, no MVP, um agendamento da profissional? → A: Significa um agendamento em que a propria profissional e a profissional designada do atendimento.
- Q: E necessario repetir nas user stories, com a mesma precisao, que a profissional so opera agendamentos em que ela e a profissional designada? → A: Nao. Essa precisao pode permanecer concentrada nos requisitos funcionais e nas constraints.
- Q: E necessario consolidar em uma unica regra resumida todos os poderes da administradora? → A: Nao. FR-005, FR-005A, FR-005C, FR-024 e CC-003 ja descrevem esse quadro com clareza suficiente.
- Q: Operacoes administrativas de salao fora do escopo da profissional precisam ser negadas explicitamente? → A: Sim. Operacoes como alterar servicos, profissionais, horario do salao, bloqueios do salao e consultar historico fora dos proprios atendimentos devem ser negadas no servidor para a profissional.
- Q: Agenda e historico vazios precisam de estado vazio explicito por perfil? → A: Sim. Agenda e historico vazios devem mostrar estado vazio claro, restrito ao tenant e ao escopo do perfil, sem sugerir dados inexistentes ou externos.
- Q: E util ter um cenario consolidado para validar o papel completo da profissional? → A: Sim. O spec deve incluir um cenario consolidado que valide agenda propria, operacao sobre cliente do proprio tenant, alteracao de agendamento proprio e ausencia de acesso fora do escopo.
- Q: O spec deve ter um glossario explicito para os termos centrais do dominio? → A: Sim. O spec deve incluir um glossario curto com os termos centrais de papeis, tenant, agenda, agendamento, lifecycle e disponibilidade.

### Session 2026-06-25

- Q: O plano tecnico mantem fuso unico fixo ou cada salao possui fuso IANA declarado? → A: Cada salao possui um fuso IANA configuravel e armazenado no cadastro, com America/Sao_Paulo como valor padrao de seed do tenant piloto. Timestamps sao armazenados em UTC e exibidos/avaliados nas bordas conforme o fuso do salao.

### Session 2026-06-26

- Q: No MVP, servicos pertencem a profissionais especificas ou ao salao? → A: Servicos pertencem ao salao. Qualquer profissional ativa do mesmo tenant pode executar qualquer servico ativo do salao; nao existe vinculo por servico-profissional no MVP.
- Q: O telefone da cliente precisa ser unico? → A: Sim. No MVP, telefone de cliente deve ser unico por tenant; o mesmo telefone pode existir em tenants diferentes.

## Glossary

- **Salao / Tenant**: no MVP, cada salao corresponde exatamente a um tenant; os termos podem ser
  tratados como equivalentes no contexto operacional deste documento.
- **Colaboradora do Salao**: pessoa autenticada do tenant com papel de administradora ou
  profissional.
- **Administradora**: colaboradora do salao com poderes amplos de operacao dentro do proprio
  tenant.
- **Profissional**: colaboradora do salao que opera apenas sua propria agenda e os agendamentos em
  que ela e a profissional designada.
- **Cliente**: pessoa atendida pelo salao, tratada como registro operacional do tenant e nao como
  usuaria autenticada do sistema no MVP.
- **Agenda**: visao ou calendario de compromissos, ausencias e bloqueios.
- **Agendamento / Atendimento**: no MVP, termos equivalentes para representar o registro marcado.
- **Horario de Funcionamento**: janela base do salao.
- **Disponibilidade Semanal**: janela recorrente da profissional.
- **Bloqueio**: indisponibilidade do salao.
- **Ausencia**: indisponibilidade pontual da profissional.
- **Desativacao**: mudanca para o estado inativo.
- **Reativacao**: retorno ao estado ativo.
- **Exclusao Fisica**: operacao fora do MVP para entidades protegidas.
- **Solicitacao da Cliente**: contato externo da cliente pedindo marcacao, cancelamento ou
  remarcacao, sem criar estado proprio no sistema.
- **Operacao Interna**: acao executada por administradora ou profissional dentro do sistema, no
  contexto do tenant.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operar o salao completo (Priority: P1)

Como administradora do salao, eu quero cadastrar e manter os dados do salao, profissionais,
servicos, clientes, bloqueios e agendamentos, alem de consultar o historico das clientes, para
operar toda a agenda do meu tenant sem depender de outro sistema.

**Why this priority**: Sem a configuracao do salao e a capacidade de operar toda a agenda, o
produto nao entrega o nucleo do negocio nem permite validar o tenant piloto.

**Independent Test**: Esta historia pode ser testada por uma administradora que cria um salao,
cadastra horario de funcionamento, servicos, profissionais e clientes, bloqueia um periodo, cria
um agendamento valido com e sem fim manual, remarca um horario, consulta a agenda por dia, semana
e profissional, e consulta o historico de uma cliente do proprio tenant.

**Acceptance Scenarios**:

1. **Given** uma administradora autenticada no tenant do salao, **When** ela cadastra nome,
   endereco, telefone, fuso IANA e horario de funcionamento por dia da semana, **Then** o salao
   fica configurado para agendamento dentro daquele tenant, usando o fuso armazenado no cadastro do
   salao.
2. **Given** uma administradora autenticada no tenant do salao, **When** ela cadastra, altera,
   ativa ou desativa clientes do proprio tenant, **Then** esses registros ficam disponiveis para a
   operacao do salao sem afetar dados de outro tenant.
3. **Given** um servico ativo e uma profissional ativa no mesmo tenant, **When** a
   administradora cria um atendimento valido dentro do horario de funcionamento do salao, da
   disponibilidade semanal da profissional, fora de bloqueios do salao e ausencias pontuais, e sem
   conflito na agenda da mesma profissional, **Then** o agendamento e salvo com inicio e fim
   previstos.
4. **Given** um novo atendimento que sobrepoe outro atendimento da mesma profissional, **When** a
   administradora tenta confirmar o horario, **Then** o sistema rejeita o agendamento e informa
   o conflito.
5. **Given** dois atendimentos consecutivos da mesma profissional, **When** o primeiro termina
   exatamente no instante em que o segundo comeca, **Then** o sistema permite ambos sem tratar o
   encaixe como conflito.
6. **Given** um bloqueio do salao para feriado, evento interno ou manutencao, **When** a
   administradora ou uma profissional tenta agendar dentro do periodo bloqueado, **Then** o
   sistema impede a marcacao.
7. **Given** um bloqueio do salao que sobrepoe agendamentos ja existentes, **When** a
   administradora cadastra o bloqueio, **Then** o sistema permite o cadastro, preserva os
   agendamentos existentes e sinaliza imediatamente os conflitos para revisao manual.
8. **Given** um agendamento existente do tenant, **When** a administradora consulta a agenda por
   dia, semana ou profissional, **Then** ela visualiza todos os compromissos, bloqueios e
   ausencias do proprio salao e nenhum dado de outro tenant.
9. **Given** uma cliente do proprio tenant com eventos registrados, **When** a administradora
   consulta o historico dessa cliente, **Then** ela visualiza apenas o historico da cliente dentro
   do proprio tenant em modo somente leitura.
10. **Given** uma agenda ou historico sem registros dentro do escopo da administradora, **When** a
   administradora abre essa visao, **Then** o sistema mostra um estado vazio claro sem sugerir
   dados inexistentes ou externos ao tenant.
11. **Given** um agendamento fora da janela minima de cancelamento para clientes, **When** a
   administradora cancela ou remarca esse agendamento, **Then** a alteracao e permitida e o
   historico do cliente e atualizado quando aplicavel.
12. **Given** um servico com duracao padrao conhecida e um novo atendimento com horario de fim
   informado manualmente, **When** a administradora confirma esse agendamento, **Then** o horario
   de fim manual passa a definir a janela valida do atendimento e as verificacoes de conflito.

---

### User Story 2 - Gerir a propria agenda (Priority: P2)

Como profissional do salao, eu quero visualizar minha agenda, criar agendamentos manuais,
registrar clientes novos, cancelar ou remarcar meus horarios e marcar ausencias pontuais dentro da
minha disponibilidade semanal para organizar meu trabalho diario.

**Why this priority**: A operacao do salao depende de cada profissional conseguir manter a propria
agenda sem ganhar acesso administrativo indevido.

**Independent Test**: Esta historia pode ser testada por uma profissional que acessa apenas a
propria agenda, cadastra ou corrige dados basicos de uma cliente do proprio tenant ao marcar um
horario, consulta apenas o historico ligado aos proprios atendimentos dela, remarca um atendimento
proprio e registra uma ausencia que bloqueia novas marcacoes naquele periodo.

**Acceptance Scenarios**:

1. **Given** uma profissional autenticada em um tenant, **When** ela abre a agenda, **Then** ela
   visualiza seus proprios agendamentos, suas proprias ausencias e os bloqueios ou
   indisponibilidades que afetem sua agenda, no fuso IANA configurado no cadastro do salao, sem ver a agenda
   detalhada de outras profissionais.
2. **Given** um horario disponivel e os dados de um cliente novo, **When** a profissional cria um
   agendamento manual para si mesma dentro da sua disponibilidade semanal, **Then** o cliente e
   registrado no tenant e o atendimento e salvo sem conflito.
3. **Given** uma cliente do proprio tenant com dados basicos desatualizados, **When** a
   profissional corrige esses dados durante a operacao de atendimento ou agendamento, **Then** a
   atualizacao e salva sem conceder acesso a clientes de outro tenant.
4. **Given** uma cliente do proprio tenant com historico em atendimentos da mesma profissional,
   **When** a profissional consulta esse historico, **Then** ela visualiza apenas os registros
   relacionados aos proprios atendimentos dela, em modo somente leitura.
5. **Given** uma agenda ou historico sem registros dentro do escopo da profissional, **When** a
   profissional abre essa visao, **Then** o sistema mostra um estado vazio claro sem sugerir dados
   inexistentes, de outras profissionais ou de outro tenant.
6. **Given** um agendamento pertencente a outra profissional do mesmo tenant, **When** a usuaria
   profissional tenta alterar esse horario, **Then** o sistema nega a operacao por permissao.
7. **Given** uma operacao administrativa de salao fora do escopo da profissional, **When** a
   profissional tenta alterar servicos, profissionais, horario do salao, bloqueios do salao ou
   consultar historico fora dos proprios atendimentos, **Then** o sistema nega a operacao no
   servidor.
8. **Given** uma ausencia pontual cadastrada pela profissional, **When** alguem tenta marcar um
   atendimento naquele intervalo, **Then** o sistema informa indisponibilidade e impede a
   marcacao.
9. **Given** uma ausencia pontual que sobrepoe agendamentos ja existentes, **When** a ausencia e
   cadastrada, **Then** o sistema permite o cadastro, preserva os agendamentos existentes e
   sinaliza imediatamente os conflitos para revisao manual.
10. **Given** um agendamento proprio ainda elegivel para alteracao pela profissional, **When** ela
   cancela ou remarca o horario, **Then** a agenda e atualizada e o historico do cliente registra
   a ocorrencia apropriada.
11. **Given** um agendamento proprio ainda elegivel para alteracao pela profissional, **When** ela
   precisa cancelar ou remarcar por necessidade operacional, **Then** o sistema permite a
   alteracao dentro das mesmas regras de permissao e politica aplicaveis.
12. **Given** uma profissional autenticada no tenant, **When** ela opera sua agenda, consulta o
   historico permitido de uma cliente do proprio tenant e altera apenas agendamentos em que ela e
   a profissional designada, **Then** o sistema permite apenas as acoes dentro desse escopo e nega
   qualquer acesso fora dele.

---

### User Story 3 - Tratar pedidos de clientes internamente (Priority: P3)

Como administradora ou profissional, eu quero localizar clientes, identificar disponibilidade,
executar marcacoes, cancelamentos ou remarcacoes e marcar ocorrencias de no-show para atender o
cliente sem exigir que ele seja um usuario do sistema.

**Why this priority**: O MVP continua dependente dos dados e do historico das clientes, mas toda a
operacao deve acontecer internamente pelo salao para manter o escopo enxuto.

**Independent Test**: Esta historia pode ser testada por uma administradora ou profissional que
busca disponibilidade para uma cliente, recebe uma solicitacao por canal externo como WhatsApp,
executa cancelamento dentro e fora da janela permitida, registra um no-show e recebe mensagens
claras quando nao ha horario disponivel.

**Acceptance Scenarios**:

1. **Given** uma cliente existente ou nova no tenant, **When** uma administradora ou profissional
   inicia uma marcacao para ela, **Then** o sistema usa apenas disponibilidade compativel, nesta
   ordem, com horario de funcionamento do salao, disponibilidade semanal da profissional,
   bloqueios do salao, ausencias pontuais e ausencia de conflito na agenda da mesma profissional.
2. **Given** uma pesquisa sem nenhum horario valido no periodo informado, **When** a usuaria
   interna busca disponibilidade, **Then** o sistema informa que nao ha horarios disponiveis
   naquele periodo e permite ajustar data, periodo ou profissional dentro do mesmo tenant.
3. **Given** um agendamento existente que precisa ser remarcado e nenhum horario valido esteja
   disponivel no novo periodo pesquisado, **When** a usuaria interna busca alternativas,
   **Then** o sistema informa claramente a indisponibilidade sem oferecer horarios invalidos.
4. **Given** um agendamento confirmado e ainda respeitando a antecedencia minima configurada,
   **When** a profissional ou administradora executa cancelamento ou remarcacao a partir de uma
   solicitacao da cliente, **Then** o sistema permite a alteracao conforme a politica do
   salao e registra o evento no historico da cliente.
5. **Given** um agendamento dentro da janela em que a politica do salao restringe alteracoes,
   **When** uma profissional tenta executar cancelamento ou remarcacao a partir de uma solicitacao
   da cliente, **Then** o sistema bloqueia a operacao e exige acao da administradora.
6. **Given** uma cliente que nao compareceu ou cancelou tardiamente, **When** a ocorrencia e
   registrada, **Then** o historico da cliente fica disponivel para consulta no tenant do salao.

---

### Edge Cases

- Se o tenant ativo estiver ausente, invalido ou nao for dono do registro consultado, a operacao
  falha como "nao encontrado", sem expor a existencia de dados de outro salao.
- Se uma usuaria tentar acessar busca, listagem, agenda, historico, exportacao ou relatorio fora do
  tenant ativo, a operacao deve falhar sem retornar dados parciais ou agregados de outro tenant.
- Lookup de agendamento, lookup de historico da cliente, busca de agenda e operacoes com entidades
  desativadas tambem devem falhar como "nao encontrado" quando o identificador pertencer a outro
  tenant.
- O isolamento entre tenants tambem deve impedir vazamentos indiretos por contagens, agregados,
  estados vazios, sugestoes de agenda ou disponibilidade e qualquer outra inferencia sobre outro
  salao.
- Logs e ferramentas operacionais do MVP tambem devem permanecer escopados ao tenant ativo e nao
  podem expor dados de outro salao.
- Se salao, profissional, servico ou cliente estiverem inativos, o sistema deve impedir novo
  agendamento e remarcacao usando essas entidades.
- Se a mesma profissional receber dois pedidos concorrentes para o mesmo intervalo, apenas um pode
  ser confirmado.
- Se criacao, remarcacao, bloqueio ou ausencia disputarem o mesmo horario, toda operacao deve
  revalidar no instante da confirmacao; a operacao perdedora deve ser rejeitada com erro claro,
  sem ajuste automatico.
- Se um atendimento terminar exatamente quando o proximo comeca para a mesma profissional, o
  sistema deve permitir o encaixe sem exigir intervalo adicional no MVP.
- No MVP, conflitos entre agendamentos e a regra de encaixe consecutivo sao avaliados apenas dentro
  da agenda da mesma profissional.
- Se um atendimento informar uma data prevista de fim manual, esse fim prevalece sobre a duracao
  padrao do servico para validacao de conflito e disponibilidade.
- Se o horario de fim manual for menor ou igual ao horario de inicio, o sistema deve rejeitar a
  operacao com erro claro e nao deve ajustar automaticamente a duracao.
- Se a duracao de um servico for menor ou igual a zero, o sistema deve rejeitar o cadastro ou uso
  desse servico com erro claro.
- Se horario de inicio ou fim informado for invalido ou impossivel, o sistema deve rejeitar a
  operacao com erro claro.
- Se uma ausencia pontual da profissional sobrepuser agendamentos existentes, a ausencia pode ser
  cadastrada, mas os agendamentos afetados devem permanecer inalterados e ser sinalizados
  imediatamente para revisao manual.
- Se um bloqueio do salao sobrepuser agendamentos existentes, o bloqueio pode ser cadastrado, mas
  os agendamentos afetados devem permanecer inalterados e ser sinalizados imediatamente para
  revisao manual.
- Sinalizar para revisao manual significa, no minimo, marcar o agendamento afetado como "requer
  revisao", exibir o motivo da sinalizacao e manter esse status visivel na agenda e na
  visualizacao do agendamento ate resolucao manual.
- Se a disponibilidade semanal da profissional estiver fora do horario de funcionamento do salao,
  o sistema deve considerar apenas a intersecao valida entre os dois calendarios.
- A validade de qualquer horario deve ser avaliada nesta ordem: horario de funcionamento do salao,
  disponibilidade semanal da profissional, bloqueios do salao, ausencias pontuais da
  profissional e, por fim, conflito na agenda da mesma profissional; se qualquer camada bloquear o
  horario, ele fica indisponivel.
- No MVP, cada salao possui um fuso IANA configuravel e armazenado no cadastro. Todos os
  timestamps devem ser armazenados em UTC e exibidos/avaliados nas bordas conforme o fuso do
  salao; o tenant piloto usa America/Sao_Paulo apenas como valor padrao de seed.
- O inicio do atendimento pode coincidir exatamente com a abertura do salao e com o inicio da
  disponibilidade semanal da profissional.
- O atendimento pode terminar depois do horario de fechamento do salao e da disponibilidade da
  profissional, desde que tenha comecado em horario valido e continue respeitando bloqueios,
  ausencias e conflitos.
- Se o horario de funcionamento mudar apos ja existirem agendamentos no periodo afetado, os
  agendamentos existentes permanecem registrados, mas ficam sinalizados para revisao manual; novas
  marcacoes obedecem apenas o horario atualizado.
- Se um servico ou uma profissional for desativado, novos agendamentos com esse recurso deixam de
  ser permitidos, mas os agendamentos futuros ja existentes permanecem visiveis e exigem decisao
  manual do salao para manter, remanejar ou cancelar.
- Se a cliente for desativada, novos agendamentos e remarcacoes ficam bloqueados, mas os
  agendamentos futuros ja existentes permanecem preservados e devem ser sinalizados para revisao
  manual.
- Se uma usuaria tentar cadastrar ou atualizar uma cliente com telefone que ja exista no mesmo
  tenant, o sistema deve rejeitar a operacao com erro claro; o mesmo telefone pode existir em
  outro tenant.
- Se uma usuaria tentar excluir fisicamente um servico, uma profissional ou uma cliente, o sistema
  deve bloquear a exclusao e orientar o uso de desativacao logica para preservar historico e
  agendamentos existentes.
- Se o proprio salao for desativado, novos agendamentos deixam de ser aceitos e os futuros ficam
  preservados para consulta administrativa e resolucao manual antes do encerramento operacional.
- Se uma administradora ou profissional nao encontrar horario para a cliente no periodo pesquisado,
  o sistema deve mostrar indisponibilidade clara sem oferecer horarios invalidos nem referencias a
  outros tenants.
- A mesma resposta clara de indisponibilidade deve valer tanto para nova marcacao quanto para
  remarcacao de agendamento existente.
- Se a cliente fizer uma solicitacao por canal externo, como WhatsApp, isso nao cria estado
  intermediario no sistema; o sistema registra apenas a marcacao, cancelamento, remarcacao ou
  evento historico efetivamente executado.
- Se um pedido de cancelamento ou remarcacao da cliente ocorrer dentro da janela restrita, apenas a
  administradora pode concluir a alteracao.
- Se ocorrer no-show ou cancelamento tardio, o registro entra no historico do cliente sem bloqueio
  automatico no MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que uma administradora cadastre e mantenha o perfil do salao
  com nome, endereco, telefone, fuso IANA e horario de funcionamento por dia da semana.
- **FR-002**: O sistema MUST tratar cada salao como um tenant isolado com seus proprios usuarios,
  profissionais, servicos, clientes, agendamentos, bloqueios, ausencias e historico.
- **FR-002C**: No MVP, cada salao MUST corresponder exatamente a um tenant, e os termos salao e
  tenant MAY ser tratados como equivalentes no contexto operacional deste documento.
- **FR-002A**: Toda operacao de criar, ler, atualizar, cancelar, remarcar, listar, buscar,
  consultar historico e visualizar agenda MUST ser escopada ao tenant ativo do usuario. Se o
  registro nao pertencer ao tenant ativo, a operacao MUST falhar como "nao encontrado", sem expor
  dados de outro tenant.
- **FR-002B**: Cada Colaboradora do Salao do MVP MUST pertencer a um unico tenant. O tenant ativo do usuario
  MUST ser sempre esse tenant, e o MVP MUST nao oferecer troca de tenant na interface.
- **FR-003**: O sistema MUST permitir que a administradora cadastre, altere, ative e desative
  servicos com nome, descricao, duracao padrao em minutos e preco. A duracao do servico MUST ser
  maior que zero.
- **FR-003A**: Cada servico ativo MUST pertencer ao salao e MAY ser associado a qualquer
  profissional ativa do mesmo tenant no momento do agendamento. O MVP MUST nao exigir nem manter
  vinculo especifico entre servico e profissional.
- **FR-004**: O sistema MUST permitir que a administradora cadastre, altere, ative e desative
  profissionais pertencentes ao tenant, incluindo sua disponibilidade semanal recorrente.
- **FR-005**: O sistema MUST permitir que a administradora crie, altere, visualize e cancele
  agendamentos de qualquer profissional do proprio tenant. Os poderes amplos da administradora
  valem somente dentro do proprio tenant, inclusive para agenda, historico, cadastro e operacoes
  administrativas.
- **FR-005C**: As visoes de agenda da administradora por dia, semana e profissional MUST permitir
  leitura e operacao somente dentro do proprio tenant.
- **FR-005A**: O sistema MUST permitir que a administradora cadastre, altere, ative e desative
  clientes do proprio tenant, e consultar o historico dessas clientes dentro do proprio tenant.
- **FR-005B**: A administradora MUST poder reativar servicos, profissionais e clientes do proprio
  tenant.
- **FR-006**: O sistema MUST permitir que a profissional visualize apenas sua propria agenda e
  gerencie apenas seus proprios agendamentos e ausencias.
- **FR-006A**: As visoes de agenda da profissional MUST permitir leitura e operacao apenas sobre
  seus proprios agendamentos e ausencias. A profissional MUST nunca alterar registros de outra
  profissional.
- **FR-006B**: A profissional MAY visualizar bloqueios do salao e outras indisponibilidades que
  afetem sua agenda, mas MUST nao visualizar a agenda detalhada de outras profissionais.
- **FR-006C**: O sistema MUST negar no servidor qualquer operacao administrativa de salao fora do
  escopo da profissional, incluindo alterar servicos, profissionais, horario do salao, bloqueios
  do salao e consultar historico de cliente fora dos proprios atendimentos dela.
- **FR-007**: O sistema MUST permitir que a profissional crie um agendamento manual para um
  cliente existente ou para um cliente novo do proprio tenant.
- **FR-007A**: O sistema MUST permitir que a profissional altere dados basicos de clientes do
  proprio tenant quando isso for necessario ao agendamento ou atendimento.
- **FR-007B**: O sistema MUST permitir que a profissional consulte apenas o historico da cliente
  relacionado aos proprios atendimentos dela, sem acesso ao historico de atendimentos da cliente
  com outras profissionais.
- **FR-007D**: O historico da cliente MUST ser somente leitura tanto para administradora quanto para
  profissional.
- **FR-007C**: O sistema MUST permitir que a profissional ative, desative e reative clientes do
  proprio tenant quando isso fizer parte da operacao diaria dela.
- **FR-008**: O sistema MUST permitir que o salao registre, altere, ative e desative clientes com
  dados de contato e historico de relacionamento necessarios para atendimento e agendamento.
- **FR-008A**: O telefone da cliente MUST ser unico dentro de cada tenant. O sistema MUST rejeitar
  criacao ou atualizacao de cliente com telefone duplicado no mesmo tenant e MAY permitir o mesmo
  telefone em tenants diferentes.
- **FR-009**: O sistema MUST calcular a janela de um agendamento a partir do horario de inicio e da
  duracao do servico, exceto quando uma data prevista de fim for informada manualmente, caso em
  que o horario de fim informado prevalece. Se o horario de fim manual for menor ou igual ao
  horario de inicio, o sistema MUST rejeitar a operacao com erro claro. O sistema MUST tambem
  rejeitar com erro claro horario de inicio ou fim invalido ou impossivel.
- **FR-010**: O sistema MUST impedir dois agendamentos sobrepostos para a mesma profissional,
  considerando inicio e fim efetivos de cada atendimento, mas MUST permitir agendamentos
  consecutivos quando o fim de um for exatamente igual ao inicio do proximo. No MVP, essa regra
  de conflito e encaixe MUST ser avaliada apenas dentro da agenda da mesma profissional.
- **FR-011**: O sistema MUST impedir agendamentos cujo horario de inicio esteja fora do horario de
  funcionamento do salao. O horario de inicio MAY coincidir exatamente com a abertura do salao, e
  o horario de fim MAY ultrapassar o fechamento desde que o atendimento tenha comecado em horario
  valido e continue respeitando bloqueios, ausencias e conflitos.
- **FR-012**: O sistema MUST impedir agendamentos em horarios bloqueados do salao, folgas ou
  ausencias da profissional.
- **FR-013**: O sistema MUST considerar a disponibilidade semanal recorrente de cada profissional
  como requisito obrigatorio para existencia de um agendamento valido. O horario de inicio MAY
  coincidir exatamente com o inicio da disponibilidade da profissional, e o horario de fim MAY
  ultrapassar o termino dessa disponibilidade desde que o atendimento tenha comecado em horario
  valido e continue respeitando bloqueios, ausencias e conflitos.
- **FR-014**: O sistema MUST permitir que a administradora crie bloqueios de agenda do salao para
  feriados, eventos internos, manutencao ou outras indisponibilidades coletivas. Se o bloqueio
  sobrepuser agendamentos existentes, o sistema MUST permitir o cadastro, MUST nao alterar
  automaticamente os agendamentos afetados e MUST sinalizar esses conflitos para revisao manual.
- **FR-015**: O sistema MUST permitir que a profissional registre ausencias pontuais que bloqueiem
  novas marcacoes em sua agenda durante o periodo informado. Se a ausencia sobrepuser
  agendamentos existentes, o sistema MUST permitir o cadastro, MUST nao alterar automaticamente os
  agendamentos afetados e MUST sinalizar esses conflitos para revisao manual.
- **FR-016**: O sistema MUST avaliar a validade de qualquer horario nesta ordem: horario de
  funcionamento do salao, disponibilidade semanal recorrente da profissional, bloqueios do salao
  e ausencias pontuais da profissional, e por fim conflito na agenda da mesma profissional. O
  horario de inicio do atendimento MUST passar por essa validacao; o horario de fim MAY ultrapassar
  o termino do horario do salao e da disponibilidade da profissional, desde que a ocupacao do
  intervalo continue respeitando bloqueios, ausencias e conflito na agenda da mesma profissional.
- **FR-016A**: O sistema MUST revalidar no instante da confirmacao toda criacao, remarcacao,
  bloqueio ou ausencia que afete disponibilidade. Se outra operacao tiver ocupado ou bloqueado o
  horario antes, a operacao perdedora MUST ser rejeitada com erro claro e MUST nao ajustar
  automaticamente o estado conflitante.
- **FR-017**: O sistema MUST armazenar todos os timestamps em UTC e exibir ou avaliar horarios de
  agenda e operacao interna conforme o fuso IANA configurado e armazenado no cadastro do salao.
- **FR-018**: O sistema MUST permitir cadastrar e alterar um fuso IANA valido para cada salao como
  parte do seu cadastro. O tenant piloto usa America/Sao_Paulo apenas como valor padrao de seed.
- **FR-019**: O sistema MUST permitir visualizacao da agenda do salao por dia, por semana e por
  profissional para a administradora.
- **FR-019A**: Agenda do dia, agenda da semana, agenda por profissional e quaisquer consolidacoes
  operacionais da administradora MUST ficar estritamente restritas ao tenant ativo.
- **FR-020**: O sistema MUST permitir que administradoras e profissionais pesquisem horarios
  disponiveis sem receber opcoes que violem, nesta ordem logica de validacao, horario de
  funcionamento do salao, disponibilidade semanal da profissional, bloqueios do salao, ausencias
  pontuais, conflito na agenda da mesma profissional ou isolamento de tenant.
- **FR-021**: O sistema MUST permitir criacao de novos agendamentos e remarcacoes apenas por uma
  administradora ou profissional autenticada no tenant do salao, e somente quando salao,
  profissional, servico e cliente estiverem ativos e pertencerem ao tenant ativo.
- **FR-021A**: O sistema MUST rejeitar com erro claro qualquer agendamento ou remarcacao cujo
  horario de inicio nao pertença a intersecao valida entre horario do salao e disponibilidade da
  profissional.
- **FR-022**: O sistema MUST tratar clientes como registros operacionais do salao, e nao
  como usuarios autenticados do sistema, neste MVP.
- **FR-023**: O sistema MUST permitir que o salao configure a antecedencia minima para aceitar
  cancelamentos e remarcacoes solicitados pelas clientes.
- **FR-024**: O sistema MUST permitir que a administradora cancele ou remarque qualquer
  agendamento, inclusive quando a solicitacao da cliente estiver fora da antecedencia minima.
- **FR-025**: O sistema MUST permitir que a profissional cancele ou remarque apenas seus proprios
  agendamentos quando a solicitacao da cliente estiver dentro da politica configurada pelo salao.
  A mesma permissao MAY ser usada por necessidade operacional, desde que os mesmos limites de
  politica e permissao sejam respeitados.
- **FR-026**: O sistema MUST bloquear a profissional de cancelar ou remarcar um agendamento proprio
  quando a solicitacao da cliente estiver fora da antecedencia minima e exigir acao da
  administradora.
- **FR-027**: O sistema MUST registrar no historico da cliente eventos de cancelamento,
  cancelamento tardio, remarcacao e no-show para consulta do salao, e MUST nao exigir registro
  separado da solicitacao da cliente antes da execucao da operacao.
- **FR-028**: O sistema MUST bloquear exclusao fisica de servicos, profissionais e clientes no MVP,
  exigindo desativacao logica para preservar historico e referencias existentes.
- Neste documento, desativacao significa mudanca para o estado inativo; reativacao significa retorno
  ao estado ativo; e exclusao fisica fica fora do MVP para as entidades protegidas.
- **FR-029**: O sistema MUST manter agendamentos futuros existentes visiveis quando um servico ou
  uma profissional forem desativados, bloquear novos agendamentos com esses recursos e sinalizar
  a necessidade de resolucao manual.
- **FR-029A**: O sistema MUST preservar agendamentos futuros existentes quando uma cliente for
  desativada, bloquear novos agendamentos e remarcacoes para essa cliente e sinalizar a
  necessidade de resolucao manual.
- **FR-030**: O sistema MUST preservar agendamentos futuros e impedir novas reservas quando o salao
  for desativado, mantendo acesso administrativo suficiente para consulta e resolucao manual.
- **FR-031**: O sistema MUST sinalizar agendamentos existentes que passem a cair fora do horario de
  funcionamento apos uma alteracao de agenda do salao, sem altera-los automaticamente no MVP.
  Sinalizar para revisao manual MUST significar, no minimo, marcar o agendamento afetado como
  "requer revisao", exibir o motivo da sinalizacao e manter esse status visivel na agenda e na
  visualizacao do agendamento ate resolucao manual.
- **FR-032**: O sistema MUST exibir para administradoras e profissionais uma resposta clara quando
  nao houver horarios disponiveis no periodo pesquisado, sem mostrar disponibilidade inexistente.
  Essa regra MUST valer tanto para nova marcacao quanto para remarcacao de agendamento existente.
- **FR-032A**: Agenda e historico sem registros MUST exibir estado vazio claro, restrito ao tenant
  ativo e ao escopo do perfil da usuaria, sem sugerir dados inexistentes, externos ou fora da sua
  permissao.
- **FR-033**: O sistema MUST garantir que consultas, listagens, buscas e visualizacoes retornem
  apenas dados do tenant ativo.
- **FR-033B**: Lookup de agendamento, historico da cliente, busca de agenda e operacoes com
  entidades desativadas MUST falhar como "nao encontrado" quando o identificador informado
  pertencer a outro tenant.
- **FR-033A**: O sistema MUST escopar ao tenant ativo logs, exportacoes, relatorios e qualquer
  ferramenta operacional do MVP, sem expor dados de outro salao.
- **FR-034**: O sistema MUST nao oferecer nenhuma visao funcional, operacional, analitica ou de
  suporte com acesso cross-tenant no MVP.
- **FR-034A**: A proibicao de acesso cross-tenant MUST cobrir tambem contagens, agregados, estados
  vazios, sugestoes de agenda ou disponibilidade e qualquer forma de inferencia indireta sobre
  dados de outro salao.
- **FR-035**: O sistema MUST proteger dados pessoais de clientes contra acesso por usuarios sem
  permissao e limitar o uso desses dados ao contexto operacional do salao.
- **FR-036**: O sistema MUST funcionar em navegador web responsivo para administradora e
  profissional nas jornadas principais do MVP.
- **FR-037**: O sistema MUST exibir no header da aplicacao um menu do usuario acessivel pelo
  avatar circular da colaboradora logada, posicionado no canto superior direito. O menu MUST
  apresentar, em ordem: cabecalho nao-clicavel com nome completo e papel da colaboradora,
  separador, item "Meu perfil" que navega para a rota `/me` em modo somente leitura, item
  "Configuracoes do salao" visivel somente para administradora que navega para a rota `/salon`,
  separador e item "Sair" que invoca logout, revoga a sessao e redireciona para a tela de login.
  O menu MUST fechar ao selecionar qualquer item, ao clicar fora da area do menu e ao pressionar
  ESC. Em desktop, o menu MUST ser exibido como dropdown; em mobile, MUST ser exibido como
  bottom sheet.
- **FR-038**: O sistema MUST aplicar mascara de entrada brasileira ao campo de telefone da
  cliente: `(00) 00000-0000` para celulares (11 digitos) e `(00) 0000-0000` para telefones fixos
  (10 digitos), com deteccao automatica pelo nono digito apos o DDD. O sistema MUST armazenar
  o telefone no backend apenas como digitos prefixados com o codigo do pais `+55`, sem nenhum
  caractere de formatacao. O sistema MUST rejeitar telefones com numero de digitos incorreto ou
  DDD inexistente na lista oficial da ANATEL, exibindo mensagem de validacao inline no campo
  antes do envio.

### Constitutional Constraints *(mandatory when applicable)*

- **CC-001**: O limite de tenant desta feature e o salao. Perfil do salao, usuarios,
  profissionais, servicos, clientes, agendamentos, bloqueios, ausencias e historico pertencem ao
  tenant ativo e toda leitura, escrita, busca, listagem e exibicao deve permanecer nesse escopo.
- **CC-002**: O MVP nao admite visoes cross-tenant, usuarios internos globais nem consultas
  agregadas entre saloes para operacao, suporte ou analise funcional.
- **CC-003**: A administradora pode operar todo o tenant; a profissional pode operar apenas sua
  propria agenda e os agendamentos em que ela e a profissional designada do atendimento. Os poderes amplos da administradora
  valem somente dentro do proprio tenant, inclusive para agenda, historico, cadastro e operacoes
  administrativas. Clientes nao sao usuarios do sistema nesta feature. Todas essas
  permissoes devem existir como regras de servidor e nao apenas de interface.
- **CC-004**: Conflito de horario, disponibilidade, bloqueios, ausencias, duracao do servico,
  horario de fim manual, horario de funcionamento, disponibilidade semanal recorrente por
  profissional, uso obrigatorio do fuso IANA configurado e armazenado no cadastro do salao, e
  janela de cancelamento/remarcacao formam o conjunto minimo de invariantes obrigatorios desta
  feature. Nos trechos operacionais da spec, a validacao de disponibilidade deve aparecer na mesma
  ordem: horario do salao, disponibilidade semanal da profissional, bloqueios do salao, ausencias
  pontuais e conflito na agenda da mesma profissional.
- **CC-005**: Dados pessoais do cliente devem ser minimizados ao necessario para agendamento,
  consulta do historico e contato operacional do salao, com possibilidade de exportacao e exclusao
  em fluxos futuros compativeis com LGPD.
- **CC-006**: Esta feature pertence integralmente ao nucleo do MVP. Cobranca, pagamentos online,
  notificacoes automaticas, fidelidade, financeiro, multiplas unidades e app nativo ficam fora do
  escopo e nao devem complicar a modelagem inicial.
- **CC-007**: As jornadas principais de administradora e profissional devem ser completas e
  utilizaveis em navegador mobile, sem depender de app nativo.
- **CC-008**: A implementacao desta feature deve incluir testes automatizados para isolamento entre
  tenants, autorizacao por papel, conflitos de horario, precedencia do horario de fim manual,
  disponibilidade, concorrencia sobre horarios, fuso horario e regras de
  cancelamento/remarcacao.

### Key Entities *(include if feature involves data)*

- **Salon Tenant**: representa um salao independente com identidade, contato, horario de
  funcionamento, politica de cancelamento/remarcacao, fuso IANA configurado e armazenado no
  cadastro, e estado operacional.
- **Colaboradora do Salao**: representa uma pessoa autenticada do tenant com papel de
  administradora ou profissional e permissoes ligadas a operacao do salao. Cada Colaboradora do
  Salao pertence a um unico tenant, e esse tenant define sempre o tenant ativo do usuario no MVP.
- **Professional**: representa a profissional que presta servicos no tenant, com estado ativo,
  inativo, disponibilidade semanal recorrente, agenda propria e ausencias pontuais. Cada
  Professional pertence a um unico tenant.
- **Service**: representa um servico oferecido pelo salao com nome, descricao, duracao padrao,
  preco e estado ativo ou inativo. Cada Service pertence a um unico tenant.
- **Client**: representa a cliente atendida pelo salao com dados de contato, historico de
  agendamentos, no-shows, cancelamentos e estado ativo ou inativo no contexto daquele tenant. Cada
  Client pertence a um unico tenant, e seu telefone e unico dentro desse tenant.
- **Appointment**: representa um atendimento agendado com cliente, profissional, servico,
  inicio, fim efetivo, origem interna da marcacao, estado e eventos de remarcacao ou cancelamento.
  Cada Appointment pertence a um unico tenant e so pode referenciar cliente, profissional e
  servico do mesmo tenant.
- Neste documento, agenda significa a visao/calendario. No MVP, agendamento e atendimento podem ser
  tratados como termos equivalentes para representar o registro marcado.
- Neste documento, horario de funcionamento significa a janela base do salao; disponibilidade
  semanal significa a janela recorrente da profissional; bloqueio significa a indisponibilidade do
  salao; e ausencia significa a indisponibilidade pontual da profissional.
- **Salon Block**: representa um bloqueio coletivo de agenda do salao que impede novos
  agendamentos em um periodo especifico. Cada Salon Block pertence a um unico tenant.
- **Professional Absence**: representa uma indisponibilidade pontual de uma profissional para
  impedir novas marcacoes durante um intervalo. Cada Professional Absence pertence a um unico
  tenant e so pode referenciar uma Professional do mesmo tenant.
- **Client History Event**: representa um fato relevante do relacionamento com a cliente, como
  cancelamento, cancelamento tardio, remarcacao e no-show. Cada Client History Event pertence a um
  unico tenant e so pode referenciar uma Client e, quando aplicavel, um Appointment do mesmo
  tenant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma administradora consegue configurar um salao com horario de funcionamento, pelo
  menos um servico e pelo menos uma profissional em ate 15 minutos sem apoio tecnico.
- **SC-002**: 100% das tentativas de criar agendamentos sobrepostos para a mesma profissional sao
  rejeitadas durante a validacao dos cenarios de aceitacao.
- **SC-003**: 100% dos testes de isolamento multi-tenant retornam apenas dados do salao ativo e
  nenhum dado de outro tenant.
- **SC-004**: Pelo menos 95% das tarefas principais de marcar, cancelar ou remarcar um atendimento
  sao concluidas por administradora e profissional em ate 3 minutos em navegador mobile.
- **SC-005**: 100% dos agendamentos exibidos nas validacoes de aceitacao aparecem no fuso IANA
  configurado no cadastro do salao.
- **SC-006**: Quando nao houver disponibilidade no periodo pesquisado, 100% das validacoes de
  experiencia para usuarias internas mostram mensagem clara de indisponibilidade sem oferecer
  horarios invalidos.
- **SC-007**: 100% das validacoes de concorrencia entre criacao, remarcacao, bloqueio e ausencia
  rejeitam a operacao perdedora com erro claro, sem ajuste automatico do estado conflitante.
- **SC-008**: 100% dos agendamentos afetados por ausencia conflitante, bloqueio conflitante,
  desativacao relevante ou alteracao de horario de funcionamento ficam marcados como "requer
  revisao" com motivo visivel ate resolucao manual.

## Assumptions

- O MVP tera uma experiencia web responsiva para administradora e profissional; app nativo e fluxo
  publico para clientes permanecem fora de escopo.
- Cada salao possui um fuso IANA configuravel e armazenado no cadastro; o tenant piloto usa
  America/Sao_Paulo apenas como valor padrao de seed.
- Clientes nao sao usuarios autenticados do sistema neste MVP; seus dados existem apenas
  como registros operacionais do tenant.
- O MVP nao aplicara bloqueio automatico a clientes com historico de no-show ou cancelamento
  tardio; apenas registrara esses eventos para consulta.
- Desativacoes de servico, profissional ou salao nao reescrevem automaticamente os agendamentos
  futuros; o sistema apenas bloqueia novas reservas e sinaliza resolucao manual.
- Exclusao fisica de servicos, profissionais e clientes fica fora do MVP; o comportamento padrao e
  desativacao logica com preservacao de historico e referencias existentes.
- A politica de antecedencia minima configurada pelo salao se aplica quando a equipe registra um
  cancelamento ou remarcacao a partir de uma solicitacao da cliente; operacoes administrativas
  continuam permitidas.
- Cobranca de assinatura, pagamento online, notificacoes automaticas, programa de fidelidade,
  comissao, relatorios financeiros, multiplas unidades e app nativo serao tratados em futuras
  especificacoes modulares.
