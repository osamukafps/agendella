# Design System — Agendella

**Status**: Proposta para aprovação. Aguarda escolha de paleta antes de geração de tokens finais.

---

## 1. Identidade Visual

O Agendella é uma ferramenta de trabalho para profissionais que tratam beleza com seriedade. A identidade visual é **editorial contida**: limpa como uma agenda de papel de qualidade, calorosa como o ambiente de um salão que tem identidade própria. Não persegue a modernidade de um app de fintech nem a leveza açucarada de um produto voltado ao consumidor final.

O tom é calmo e eficiente. A tela precisa comunicar "você está no controle" — não "bem-vindo ao nosso sistema". A personalidade é de uma profissional que conhece o ofício, tem gosto apurado e não precisa de enfeites para demonstrar isso. Levemente feminino pela paleta e pelo cuidado tipográfico, nunca por ícones de flores ou cores pastéis.

A referência visual é o editorial de beleza de qualidade — NARS, a agenda de um atelier parisiense — e não o dashboard SaaS genérico. A assinatura da interface é a **trilha de tempo como planner físico**: coluna de horas à esquerda, cartões de compromisso à direita, régua de tempo atual como um marcador de papel.

---

## 2. Paleta de Cores

### Duas opções de cor primária — escolha uma

As duas opções compartilham os mesmos neutros, semânticos e tipografia. Apenas a primária difere.

---

#### Opção A — **Argila** `#9E4F38`

Um tijolo-terracota amadurecido, sem a saturação de telhado. Evoca o barro refinado de cerâmica artesanal de alta qualidade. Quente, terroso, legível em fundos claros com excelente contraste.

```
Primária:        #9E4F38  (Argila)
Primária clara:  #C4755C  
Primária sutil:  #F7EDE9  (fundo para estados de hover/seleção)
```

---

#### Opção B — **Borgonha** `#7C3B50`

Um ameixa-rosado profundo que não é nem roxo nem pink — está no exato ponto de equilíbrio entre sofisticação e calor. Incomum em produtos do setor (o que o torna memorável). Leitura mais "atelier de luxo" do que "salão popular".

```
Primária:        #7C3B50  (Borgonha)
Primária clara:  #A85E74
Primária sutil:  #F5E8ED
```

---

### Compartilhado entre as duas opções

#### Cor secundária — **Sálvia** `#7A8C6E`
Verde-sálvia dessaturado. Complementa ambas as primárias pelo contraste análogo (quente-frio), sem disputar atenção. Usado para confirmações, disponibilidade, tags de conclusão.

```
Secundária:       #7A8C6E
Secundária clara: #9FAE95
Secundária sutil: #EDF1EA
```

#### Neutros quentes (família Stone)
Não é cinza puro — tem uma base levemente ocre que mantém coerência com qualquer primária quente.

```
--color-neutral-950:  #1C1917  (texto primário, quase preto)
--color-neutral-800:  #292524  (texto secundário importante)
--color-neutral-600:  #57534E  (texto terciário, labels)
--color-neutral-400:  #A8A29E  (placeholders, texto desabilitado)
--color-neutral-300:  #D6D3D1  (bordas interativas)
--color-neutral-200:  #E7E5E4  (bordas estruturais, divisores)
--color-neutral-100:  #F5F5F4  (fundos de input, states subtle)
--color-neutral-50:   #FAFAF9  (background geral da aplicação)
```

#### Semânticos (harmônicos com a paleta, não alarme-padrão)

O vermelho-erro é um tijolo sóbrio, não o vermelho de semáforo. Sucesso usa sálvia escuro. Nada aqui deve parecer "sistema bancário".

```
Sucesso:          #3D7A5A  (verde-floresta muto)
Sucesso sutil:    #E8F3ED
Erro:             #A8372A  (tijolo-escuro, não alarme)
Erro sutil:       #F5E8E6
Aviso:            #C07A24  (âmbar quente)
Aviso sutil:      #F7F0E3
Info:             #4A6FA5  (ardósia azulada — único uso de azul, apenas semântico)
Info sutil:       #E8EDF5
```

#### Status de agendamento
```
Agendado:         primária + fundo primária-sutil
Em atendimento:   primária + fundo primária-sutil + borda esquerda sólida
Concluído:        neutral-400 + fundo neutral-100 (recuado visualmente)
Cancelado:        erro + fundo erro-sutil
Falta (no-show):  erro + fundo erro-sutil
Requer revisão:   aviso + fundo aviso-sutil
```

---

### CSS Custom Properties (substituir `PRIMARY_*` pela opção escolhida)

```css
:root {
  /* PRIMÁRIA — preencher após escolha */
  --color-primary:        /* #9E4F38 ou #7C3B50 */;
  --color-primary-light:  /* #C4755C ou #A85E74 */;
  --color-primary-subtle: /* #F7EDE9 ou #F5E8ED */;

  /* SECUNDÁRIA */
  --color-secondary:        #7A8C6E;
  --color-secondary-light:  #9FAE95;
  --color-secondary-subtle: #EDF1EA;

  /* NEUTROS */
  --color-neutral-950: #1C1917;
  --color-neutral-800: #292524;
  --color-neutral-600: #57534E;
  --color-neutral-400: #A8A29E;
  --color-neutral-300: #D6D3D1;
  --color-neutral-200: #E7E5E4;
  --color-neutral-100: #F5F5F4;
  --color-neutral-50:  #FAFAF9;

  /* SEMÂNTICOS */
  --color-success:         #3D7A5A;
  --color-success-subtle:  #E8F3ED;
  --color-error:           #A8372A;
  --color-error-subtle:    #F5E8E6;
  --color-warning:         #C07A24;
  --color-warning-subtle:  #F7F0E3;
  --color-info:            #4A6FA5;
  --color-info-subtle:     #E8EDF5;

  /* SUPERFÍCIE */
  --color-background:    #FAFAF9;
  --color-surface:       #FFFFFF;
  --color-border:        #E7E5E4;
  --color-border-subtle: #F0EFEE;

  /* TEXTO */
  --color-text-primary:   #1C1917;
  --color-text-secondary: #57534E;
  --color-text-tertiary:  #A8A29E;
  --color-text-inverse:   #FFFFFF;
  --color-text-on-primary: #FFFFFF;
}
```

---

## 3. Tipografia

### Fontes

**Display — Cormorant Garamond** (Google Fonts)
Serifada clássica com proporções longas e elegantes. Usada em peso 300 (Light) para datas, títulos de seção, e o nome do salão. Não é a fonte principal — é o acento tipográfico que dá caráter. Usada em tamanhos ≥ `--text-lg`; abaixo disso, Manrope assume.

Por que não DM Serif Display ou Fraunces? Cormorant no peso 300 tem uma delicadeza mais próxima de tipografia de planner/agenda de papel — que é a metáfora visual deste produto. Fraunces tem mais personalidade pós-moderna; DM Serif é mais redonda. Cormorant é mais exata.

**Corpo / UI — Manrope** (Google Fonts)
Sans-serif geométrica com caráter próprio. Mais legível em telas pequenas que Inter por ter uma abertura de letra ligeiramente maior. Menos onipresente que Inter, mais distinta que Outfit. Funciona bem em peso 400 (texto corrido), 500 (labels e metadata), 600 (nomes de clientes, títulos de card).

**Escala tipográfica — razão 1.25 (Major Third)**

Escolhida por ser a menor razão que cria hierarquia clara sem criar gaps excessivos no mobile. Uma razão 1.333 (Perfect Fourth) criaria diferenças muito bruscas para densidade mobile. Uma razão 1.5 (Perfect Fifth) seria exibicionista para uma ferramenta operacional.

```
--text-xs:   0.64rem   (≈10px)  — timestamps, legendas de badge
--text-sm:   0.8rem    (≈13px)  — labels, hora no card, metadados
--text-base: 1rem      (16px)   — corpo de texto, itens de lista
--text-md:   1.25rem   (20px)   — nome do cliente no card, subtítulos
--text-lg:   1.563rem  (25px)   — títulos de seção, data do dia (Cormorant)
--text-xl:   1.953rem  (31px)   — nome do salão no header (Cormorant, só aí)
```

**Line-height (leading) e tracking**

Premium não mora na fonte — mora no espaço ao redor dela.

```css
/* Leading */
--leading-tight:   1.15;  /* títulos display, Cormorant */
--leading-snug:    1.35;  /* nomes de clientes, labels grandes */
--leading-normal:  1.5;   /* corpo, cards */
--leading-relaxed: 1.65;  /* texto em parágrafos, descrições */

/* Tracking */
--tracking-tight:  -0.02em; /* títulos grandes, evita expansão excessiva */
--tracking-normal:  0em;    /* corpo */
--tracking-wide:    0.04em; /* labels em UPPERCASE (evitar uppercase em geral) */
--tracking-wider:   0.08em; /* badges, status tags em caixa baixa */
```

**Regra de uso**: Nunca uppercase em títulos de cards ou nomes de clientes. Uppercase apenas em badges de status (`FEITO`, `PRÓXIMO`) e mesmo assim com tracking controlado. Peso máximo em tela: 600. Nunca 700+ exceto em casos de acessibilidade de emergência.

---

## 4. Espaçamento e Ritmo

### Unidade base: 4px com múltiplos de 8

A escala de 4px permite granularidade para ajustes de padding interno de componentes pequenos (badges, tags). A maioria dos layouts usa múltiplos de 8.

```css
--space-1:  0.25rem  (4px)   — padding interno mínimo, gap de ícone+texto
--space-2:  0.5rem   (8px)   — padding interno de badge, gap entre metadados
--space-3:  0.75rem  (12px)  — padding de input, gap entre linhas de card
--space-4:  1rem     (16px)  — padding horizontal de container, gap padrão
--space-5:  1.25rem  (20px)  — padding vertical de card
--space-6:  1.5rem   (24px)  — espaço entre cards na timeline
--space-8:  2rem     (32px)  — separação entre seções do dia
--space-10: 2.5rem   (40px)  — padding de bottom nav
--space-12: 3rem     (48px)  — altura mínima de touch target crítico
--space-16: 4rem     (64px)  — espaço entre dias / topo de scroll
```

### Touch targets
- Mínimo absoluto: 44×44px (iOS HIG). Na prática, usar 48px de altura para botões primários e items de nav.
- Cards de agendamento: altura mínima de 64px. A informação mínima (nome + serviço) cabe com espaço de respiro.
- Botões de ação secundária em cards (cancelar, reagendar): podem usar 40px se a zona tátil do card inteiro já é atingível.
- Itens da barra de navegação inferior: mínimo 56px de altura, zona de toque de 64px.

### Princípios de respiro
1. **Dentro de um card**: espaçamento denso (`space-3` vertical, `space-4` horizontal). O card é uma unidade de informação — não precisa respirar tanto quanto o espaço entre cards.
2. **Entre cards na timeline**: `space-4` a `space-6`. Suficiente para separação visual, insuficiente para causar scroll excessivo.
3. **Entre horas sem compromisso**: a régua de hora existe mas sem card — o espaço em branco IS the message ("você está livre aqui").
4. **Entre seções maiores** (ex: manhã / tarde / noite se divididas): `space-8` + um divisor sutil.
5. **Regra de triplicação**: dobrar espaçamento (`space-8`) entre regiões de página claramente distintas (header → content, content → bottom nav). Triplicar apenas entre telas ou em modais/sheets onde o conteúdo começa do zero.

---

## 5. Componentes-base

### Button

**3 variantes:**

`primary` — Fundo `--color-primary`, texto `--color-text-inverse`. Para ações confirmativas únicas na tela (Salvar, Criar agendamento). Nunca dois botões primários na mesma view.

`secondary` — Fundo transparente, borda `--color-primary`, texto `--color-primary`. Para ação secundária quando primário já existe, ou ação única que não precisa de ênfase máxima.

`ghost` — Sem fundo, sem borda, texto `--color-text-primary` ou `--color-primary`. Para ações dentro de cards, contextos densos, links de ação.

**3 tamanhos:**

`sm` — height 32px, text-sm, padding-x space-3. Para ações dentro de cards ou em contextos compactos.

`md` — height 44px, text-base, padding-x space-5. Tamanho padrão.

`lg` — height 52px, text-md (Manrope 600), padding-x space-6. Para CTAs de tela cheia (ex: "Criar novo agendamento").

**Estados:** default / hover (leve escurecimento 8% no fundo) / active (escurecimento 15%) / focus (outline 2px offset 2px na primária, nunca oculto) / disabled (opacity 0.4, cursor not-allowed, não remover visualmente — apenas dessaturar) / loading (spinner substituindo label, manter dimensões).

**Raio:** `--radius-md` (6px) em todos os botões. Consistente. Nunca pill em botões de ação (só em badges e filtros).

---

### Input / Textarea

**Anatomia:** label flutuante ou acima (preferir label acima para mobile — menos surpresa de animação sob pressão), campo com borda `--color-border`, fundo `--color-neutral-100`, texto `--color-text-primary`, placeholder `--color-text-tertiary`. Helper text abaixo quando necessário.

**Estados:** default / focus (borda `--color-primary`, sem shadow, sem glow — a borda fala por si) / error (borda `--color-error`, helper text em `--color-error`) / disabled (opacity 0.4, cursor not-allowed) / filled (sem mudança visual além do valor).

**Raio:** `--radius-md`. Altura de input: 44px (respeita touch target).

---

### Select

Mesmo visual de Input com ícone de chevron à direita (Lucide `ChevronDown`, 16px). No mobile, abre o seletor nativo do SO — não criar custom dropdown para seleções simples. Custom dropdown apenas para seleção com busca ou múltipla seleção.

---

### DatePicker

Mobile: abre um `Sheet` (bottom sheet) com calendário mensal. Nunca um dropdown que apareça acima do campo — em mobile, o teclado e viewports pequenos tornam isso problemático. O mês usa Cormorant (`--text-lg`) para o nome do mês+ano, Manrope para os dias.

Desktop: popover calendário inline, posicionado abaixo do input.

---

### TimePicker

No mobile: dois seletores verticais de rolagem (tipo slot machine) — horas e minutos. Alternativa aceitável: dois inputs numéricos `HH:MM` com validação em tempo real. Nunca um campo de texto livre para horário.

---

### Card

**Anatomia:** fundo `--color-surface`, borda `1px solid --color-border`, borda-esquerda `3px solid [status-color]` (o único uso de bordas coloridas grossas, funcionalmente justificado — indica status de relance). Raio `--radius-md`. Shadow: `--shadow-sm` apenas.

**Variante appointment card:** nome do cliente (`--text-md`, weight 600), serviço (`--text-sm`, weight 400, `--color-text-secondary`), duração + horário (`--text-xs`, weight 500, `--color-text-tertiary`), badge de status (canto superior direito).

**Estados:** default / hover (fundo `--color-neutral-50`, shadow `--shadow-md`) / pressed (fundo `--color-neutral-100`) / selected (borda `--color-primary`, shadow `--shadow-md`) / disabled (opacity 0.5).

Cards de agendamentos concluídos: opacity levemente reduzida (0.65) para recuar da hierarquia visual sem sumir.

---

### Dialog / Modal

Overlay escuro (`rgba(28, 25, 23, 0.5)` — quente, não azulado). Container centralizado em desktop, ocupa 90% da largura. Em mobile, preferir Sheet. Raio `--radius-lg`. Shadow `--shadow-lg`. Título em Manrope 600, `--text-md`. Nunca animação de entrada exibicionista — apenas fade (opacity 0→1 em 150ms, sem scale).

Anatomia: título + subtítulo opcional / conteúdo / rodapé com ações (cancelar ghost, confirmar primary). Sempre um botão de fechar (X) no canto superior direito.

---

### Sheet (Bottom Sheet Mobile)

O componente mais crítico para UX mobile deste produto. Usado para: criar/editar agendamento, ver detalhes de cliente, filtros, confirmações destrutivas.

**Anatomia:** handle bar no topo (2px × 32px, `--color-neutral-300`), título da sheet, conteúdo com scroll interno, zona de ações fixada no rodapé. Altura: snap points em 50vh e 90vh. Overlay igual ao modal. Fecha ao arrastar para baixo ou tocar no overlay.

**Comportamento:** não fecha ao scroll interno do conteúdo. Fecha apenas por gesto de arrasto ou ação explícita. Animação: slide-up em 250ms ease-out (funcional, não decorativo).

---

### Toast

Aparece no topo da tela (não no rodapé — não competir com bottom nav). 4 variantes: success (fundo `--color-success`, ícone Check), error (fundo `--color-error`), warning (fundo `--color-warning`), info (fundo neutro escuro). Texto branco em todos. Dura 4s, dismissível por toque. Máximo 1 toast visível por vez — enfileirar, não empilhar.

---

### Badge

Pill pequeno (`--radius-pill`), `--text-xs`, weight 600, letra-spacing `--tracking-wider`. Usado para status de agendamento nos cards. Fundo = cor sutil do status, texto = cor do status. Ex: "EM ATENDIMENTO" em primária-sutil/primária.

---

### Avatar

Circular. Iniciais do colaborador quando sem foto. Tamanhos: 24px (compacto), 32px (header), 40px (listas). Fundo `--color-primary-subtle`, texto `--color-primary`, weight 600. Com foto: object-fit cover. Nunca borda colorida decorativa.

---

### Menu do Usuário

**Trigger:** avatar circular 32px com iniciais da colaboradora logada, posicionado no canto superior direito do header. Mesmas regras visuais do Avatar. Ao passar o cursor em desktop, exibe tooltip com o nome completo. O botão deve ter `aria-label="Menu de [nome]"`, `aria-expanded`, e `aria-haspopup="menu"`.

**Comportamento de abertura:**
- **Desktop (≥768px):** clique abre um dropdown posicionado abaixo e alinhado à direita do avatar. Largura mínima 220px. Fundo `--color-surface`, borda `1px solid --color-border`, raio `--radius-lg`, sombra `--shadow-lg`. Animação: fade-in em 120ms (opacity 0→1); nenhum scale ou slide.
- **Mobile (<768px):** clique abre um `Sheet` (bottom sheet) com o mesmo conteúdo, seguindo as regras do componente Sheet.

**Conteúdo do menu (ordem obrigatória):**

1. **Cabeçalho não-clicável** — fundo `--color-neutral-50`, padding `--space-3` × `--space-4`. Nome completo da colaboradora em Manrope 600 `--text-sm` `--color-text-primary`. Papel ("administradora" ou "profissional") em Manrope 400 `--text-xs` `--color-text-tertiary` abaixo do nome. Não recebe `:hover`, `role="menuitem"` nem foco de teclado.
2. **Separador** — `1px solid --color-border`, sem padding extra.
3. **"Meu perfil"** — item clicável, navega para `/me`. Ícone `CircleUser` (20px, `strokeWidth 1.5`) à esquerda do label. Mostra dados básicos da colaboradora em modo somente leitura no MVP.
4. **"Configurações do salão"** — item clicável, **visível somente para administradora**, navega para `/salon`. Ícone `Settings` (20px) à esquerda do label.
5. **Separador** — `1px solid --color-border`.
6. **"Sair"** — item clicável, invoca logout: revoga o refresh token no servidor, limpa o estado de sessão no frontend e redireciona para `/login`. Texto `--color-error`. Ícone `LogOut` (20px) à esquerda do label.

**Estilo dos itens clicáveis (3, 4 e 6):**
```
padding: --space-3 (top/bottom) --space-4 (left/right)
display: flex; align-items: center; gap: --space-2
font: Manrope 400, --text-sm, --color-text-primary (exceto "Sair": --color-error)
hover: background --color-neutral-100 (transição 80ms)
focus-visible: outline padrão do design system
role="menuitem"
```

**Comportamento de fechamento:**
- Seleção de qualquer item (fecha após executar a ação ou navegar).
- Clique fora do dropdown / toque no overlay do sheet.
- Tecla `ESC` — retorna o foco ao botão do avatar.
- Navegação de rota (o dropdown fecha automaticamente ao trocar de rota).

**Acessibilidade:**
- Container do dropdown: `role="menu"`.
- Ao abrir, o foco deve ir para o primeiro item com `role="menuitem"`.
- Navegação por setas (`ArrowDown` / `ArrowUp`) entre itens; `Home` / `End` para primeiro e último.
- `ESC` fecha e devolve foco ao avatar.
- Em mobile, o Sheet herda a acessibilidade do componente Sheet (`role="dialog"`, trap de foco).

---

### Empty State

**Anatomia:** ícone Lucide centralizado em `--color-neutral-300` (40px, strokeWidth 1.5), título (`--text-md`, weight 600, `--color-text-primary`), descrição (`--text-base`, `--color-text-secondary`), botão de ação (opcional). Sem ilustrações ou gráficos decorativos.

**Texto:** específico e acionável. "Nenhum agendamento hoje. Quer criar um?" — não "Nada por aqui ainda!".

---

### Skeleton Loader

Retângulos arredondados em `--color-neutral-200` com animação de shimmer linear (`background: linear-gradient(90deg, neutral-200, neutral-100, neutral-200)`, 1.5s infinite). Mimetizam o layout real — não são genéricos. Um skeleton de card de agendamento tem a forma exata de um card de agendamento.

---

## 6. Iconografia

**Biblioteca:** [Lucide Icons](https://lucide.dev/)

**Por quê Lucide sobre Phosphor:** Lucide tem linha de consistência mais uniforme e integração Angular melhor. Phosphor tem mais variantes de peso mas adiciona complexidade desnecessária para este escopo.

**Peso único:** `strokeWidth={1.5}` em todos os ícones de UI. Nunca misturar 1 e 2. Strokewidth 2 apenas para contextos de acessibilidade emergencial.

**Tamanhos:**
- 16px — ícones dentro de badges, labels muito compactos
- 20px — ícones de ação em cards (padrão)
- 24px — ícones de navegação inferior
- 32px — ícones de empty state, ícones ilustrativos funcionais

**Regra de uso:** Nunca decorativo. Todo ícone tem `aria-label` ou `aria-hidden="true"` quando acompanha label visível. Nunca dois ícones juntos sem contexto textual. Na navegação inferior, ícone + label texto sempre — nunca só ícone.

**Ícones definidos para o produto:**
- Agenda: `Calendar`
- Clientes: `Users`
- Serviços: `Scissors`
- Perfil: `CircleUser`
- Adicionar: `Plus`
- Editar: `Pencil`
- Excluir: `Trash2`
- Fechar: `X`
- Voltar: `ChevronLeft`
- Menu/Mais: `MoreVertical` (nunca hamburger)
- Alerta/Revisão: `AlertTriangle`
- Concluído: `Check`
- Bloco de salão: `Lock`
- Ausência: `CalendarOff`

---

## 7. Acessibilidade

### Contraste

Todos os textos devem atingir **WCAG AA** (4.5:1 para texto normal, 3:1 para texto grande ≥18px ou ≥14px bold). Metas AAA (7:1) para texto de corpo em parágrafos longos.

Verificações críticas (com Borgonha `#7C3B50`):
- Borgonha sobre branco: ratio ~8.2:1 ✓ AAA
- Borgonha sobre primária-sutil `#F5E8ED`: ratio ~6.1:1 ✓ AA
- Branco sobre borgonha: ratio ~8.2:1 ✓ AAA
- `--color-text-secondary` `#57534E` sobre branco: ratio ~6.8:1 ✓ AA
- `--color-text-tertiary` `#A8A29E` sobre branco: ratio ~2.9:1 ✗ Não usar para texto de corpo — apenas para metadados decorativos ou acompanhados de outros elementos.

### Foco visível

Nunca `outline: none` sem substituto. Foco padrão substituído por:
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```
Não usar `:focus` (aciona em clique de mouse) — usar `:focus-visible`.

### Semântica HTML

- Navegação inferior: `<nav aria-label="Navegação principal">` com `<a>` ou `<button>` reais.
- Cards de agendamento: `<article>` com `aria-label` descritivo ("Patrícia Costa, coloração às 11h").
- Timeline: `<ol>` semanticamente, cada horário como `<li>`.
- Modais/Sheets: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Status badges: texto visível — não confiar apenas em cor.

### Movimento

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Padrões de Layout Mobile

### Estrutura geral da aplicação

```
┌──────────────────────────────┐
│ HEADER FIXO (56px)           │  — contexto de salão + colaborador
├──────────────────────────────┤
│ CONTEÚDO (flex-1, scroll)    │
│                              │
│  (varia por tela)            │
│                              │
├──────────────────────────────┤
│ BOTTOM NAV (56px + safe-area)│  — 4 destinos máximo
└──────────────────────────────┘
```

### Header fixo

**Não é um hambúrguer.** O header é contexto, não navegação.

Conteúdo: nome do salão (Cormorant, `--text-xl`, weight 300, esquerda) + nome/avatar da colaboradora logada (Manrope, `--text-sm`, direita). Subtítulo opcional: data atual.

Quando dentro de uma subpágina (ex: ficha do cliente), o header vira: botão Voltar (`ChevronLeft` + label) + título da tela + ação contextual (edit, mais).

```
┌──────────────────────────────────────┐
│ Salão da Ana          Ana B [avatar] │
│ Terça, 10 jun                        │
└──────────────────────────────────────┘
```

### Navegação inferior

4 destinos fixos: **Agenda** / **Clientes** / **Serviços** / **Perfil**

- Ícone 24px + label `--text-xs` weight 600 abaixo do ícone.
- Item ativo: cor `--color-primary`, fundo sutil `--color-primary-subtle` (pill ao redor de ícone+label).
- Item inativo: `--color-text-tertiary`.
- Altura: 56px + padding do safe area do iOS (`env(safe-area-inset-bottom)`).
- Borda superior: 1px `--color-border`. Sem shadow.

### Timeline de agenda (tela principal)

A timeline é a assinatura visual do produto.

**Estrutura:**
```
[coluna de tempo 52px fixo] | [coluna de cards flex-1]
```

**Coluna de tempo:**
- Texto de hora em Cormorant, `--text-sm`, weight 300, `--color-text-tertiary`.
- Linha vertical contínua em `--color-border-subtle` (1px).
- Ponto preenchido em cada hora marcada: 6px circle, `--color-neutral-300`.
- Ponto maior (8px) e colorido (`--color-primary`) no próximo compromisso.
- **Marcador de tempo atual:** linha horizontal pontilhada atravessando as duas colunas, na cor `--color-primary`, com dot sólido na intersecção com a coluna de tempo. Mostra "agora" sem texto.

**Coluna de cards:**
- Cards com gap de `space-3` entre si.
- Quando não há compromisso num bloco de hora: a coluna fica em branco — o espaço vazio comunica disponibilidade.
- Blocos de tempo livres não recebem card "livre" — apenas silêncio visual.

**Seletor de dia:**
- Linha horizontal acima da timeline, com scroll horizontal.
- 7 dias visíveis (seg–dom da semana atual). Clique navega.
- Hoje: fundo `--color-primary`, texto branco, peso 600.
- Outros dias: texto `--color-text-secondary`.
- Sábado/domingo: texto `--color-text-tertiary` se sem compromissos.
- Formato: abreviação do dia (Seg, Ter) + número.

### Criação de agendamento

Fluxo via Sheet (bottom sheet), não nova tela. Campos: profissional (se admin), cliente (com busca), serviço (select), data, hora início, hora fim (auto-calculada + campo manual opcional). Botão "Criar agendamento" fixado no rodapé da sheet.

---

## 9. Formato de Telefone

### Contexto

O MVP atende exclusivamente salões brasileiros. Todos os telefones são nacionais.

### Máscara de input

| Tipo    | Dígitos pós-DDD | Máscara              | Exemplo                |
|---------|-----------------|----------------------|------------------------|
| Celular | 11 (com 9)      | `(00) 00000-0000`    | `(11) 99999-8888`      |
| Fixo    | 10              | `(00) 0000-0000`     | `(21) 3333-4444`       |

**Detecção automática de tipo:** se o nono dígito digitado após o DDD for `9`, aplica a máscara de celular; caso contrário, aplica a máscara de fixo. A máscara ajusta-se em tempo real conforme o usuário digita — sem necessidade de seletor de tipo.

### Armazenamento (backend)

- Apenas dígitos, sem máscara, prefixados com o código do país `+55`.
- Exemplo: `(11) 99999-8888` → enviado ao backend e armazenado como `+5511999998888`.
- O frontend remove máscara e espaços antes de qualquer requisição de API. O backend nunca recebe parênteses, hífens ou espaços.

### Exibição na UI

- Campos de lista, cards e telas de detalhe exibem o número formatado com a máscara aplicada ao valor armazenado.
- O campo de input exibe a máscara progressiva durante a digitação.

### Validação

1. **Tamanho:** após remover `+55` e qualquer formatação, o número deve ter exatamente **10 dígitos** (fixo) ou **11 dígitos** (celular). Qualquer outro tamanho é rejeitado.
2. **DDD válido:** os dois primeiros dígitos devem pertencer à lista oficial da ANATEL. Faixas válidas: 11–19 (SP), 21–22, 24 (RJ/região), 27–28 (ES), 31–38 (MG), 41–49 (PR/SC), 51–55 (RS, excluindo 52), 61–69 (Centro-Oeste), 71–75, 77, 79 (BA/SE), 81–89 (Nordeste), 91–99 (Norte/Nordeste). DDDs não alocados (ex.: 20, 23, 25, 26, 29, 30, 39, 40, 52, 56–60, 70, 72, 76, 78, 80, 90) são inválidos.
3. **Feedback imediato:** a mensagem de validação deve aparecer no helper text do campo, inline, antes do envio do formulário. Nunca rejeitar silenciosamente ou só no servidor.
4. **Unicidade por tenant:** o mesmo número não pode estar cadastrado para dois clientes do mesmo tenant (ver FR-008A). Esse erro é retornado pelo servidor e exibido no helper text do campo de telefone.
