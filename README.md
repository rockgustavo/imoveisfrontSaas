# Controle imobiliário SaaS

> Frontend Angular do SaaS de administração de corretora de imóveis.
> Consome a API e o Keycloak publicados pelo backend ([`imoveisbackSaas`](https://github.com/rockgustavo/imoveisbackSaas), repositório separado).

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=flat&logo=vitest&logoColor=white)

---

## Como subir

**Pré-requisitos:** Node 22+ e o backend no ar (`docker compose up -d` no `imoveisbackSaas`).

```bash
npm install
npm start     # http://localhost:4200
```

Login: **`admin.dev`** / **`admin123`** (papel `ADMINISTRADOR`).

Não é preciso editar hosts file nem configurar nada no console do Keycloak — o realm, o client e os usuários de desenvolvimento são importados automaticamente quando o container do backend sobe.

| O quê | URL |
|---|---|
| Aplicação | http://localhost:4200 |
| API consumida | http://localhost:8080 |
| Keycloak | http://localhost:8081 |

```bash
npm test       # Vitest, via @angular/build:unit-test
npm run build  # build de produção em dist/
```

---

## Arquitetura

### Estrutura por domínio, espelhando o backend

```
src/app/
├── core/                    transversal
│   ├── auth.interceptor.ts    injeta o token, traduz erro HTTP em AppError
│   ├── role.guard.ts          bloqueia rota por papel
│   ├── keycloak.config.ts     realm, client, opções de init
│   └── services/theme.service.ts
├── shared/                   shell, navegação e validação
│   ├── nav-items.ts           fonte única dos itens de menu
│   ├── page-response.model.ts contrato genérico de paginação, espelha o backend
│   ├── validators/            validadores reaproveitáveis + erros vindos do backend
│   └── components/            topbar, sidebar, bottom-nav, campo-erro, resumo-validacao
├── imobiliaria/              domínio — serviço HTTP, modelos, telas
├── pessoa/                   domínio — cadastro, papéis e inativação
├── propriedade/              domínio — cadastro, mapa de situação, CEP
├── mapa/                     domínio — visão geográfica agregada, sem entidade própria (Leaflet)
├── painel/                   domínio — indicadores operacionais, tela inicial (embute o mapa)
├── orcamento/                domínio — proposta comercial que antecede o contrato
└── contrato/                 domínio — ativação, encerramento, cancelamento, aditivos
```

Pasta por domínio, não por tipo de arquivo: a tela, o serviço e o modelo de `imobiliaria` ficam juntos, do mesmo jeito que o módulo correspondente no backend. Domínio novo é pasta nova, não um arquivo a mais em cada uma de cinco pastas técnicas.

| Decisão | Motivação |
|---|---|
| Signals, sem NgRx | O escopo não tem estado global compartilhado que justifique o boilerplate de store/action/reducer |
| `OnPush` em todo componente | Com signals, a detecção de mudança fica previsível — o componente só re-renderiza quando um sinal que ele lê muda |
| Um serviço por domínio encapsulando `HttpClient` | Componente não conhece URL nem formato de payload; trocar contrato mexe em um arquivo |
| Interceptor único para token e erro | Toda requisição autenticada e todo erro traduzido no mesmo lugar, sem repetir `catchError` por chamada |
| Mapeamento manual `record` ↔ modelo | Sem camada de mapper; o `record` do backend vira interface TypeScript direta |
| `shared/page-response.model.ts` genérico | Contrato de paginação é o mesmo em todo módulo (`content`, `page`, `size`, `totalElements`, `totalPages`) — uma interface, reaproveitada, em vez de repetir a forma em cada domínio |

`any` é erro de revisão.

### Layout padrão intuitivo e simples

Sidebar fixa colapsável (desktop) + topbar sticky + bottom nav (abaixo de 992px). Os três consomem a mesma fonte de navegação — [`shared/nav-items.ts`](src/app/shared/nav-items.ts) — então adicionar um item de menu é editar um array, não três templates.

O layout parte do menor breakpoint e cresce, em vez de ser desktop adaptado depois: a bottom nav é o caminho de navegação padrão no celular, não uma sidebar espremida.

### Mapa: Leaflet fora do fluxo padrão do Angular

Primeira vez que o Leaflet (previsto desde o início) entra de fato no projeto — módulo `mapa/`, sem entidade própria; consome uma consulta agregada sobre `propriedade` que já existe no backend, sem módulo novo lá também (ver README do backend).

| Decisão | Motivação |
|---|---|
| CSS do Leaflet no array `styles` do `angular.json`, não em `styleUrl` de componente | Leaflet cria marcador e popup via `appendChild` direto no DOM, fora do compilador de template do Angular — esses elementos não recebem o atributo de `ViewEncapsulation.Emulated`, então CSS "scoped" no componente nunca casaria com eles |
| Marcador via `L.divIcon` com SVG em forma de pin, não o ícone PNG default do Leaflet | O ícone padrão quebra sob o bundler do Angular CLI (caminho relativo de asset não resolvido pelo esbuild) — resolve o asset quebrado e entrega forma de pin + cor por situação (legenda obrigatória, RN-07-05) na mesma solução, sem depender de imagem |
| `leaflet`/`leaflet.markercluster` em `allowedCommonJsDependencies` (`angular.json`) | As duas bibliotecas são UMD/CommonJS, não ESM — sem o allowlist, o build de produção falha com warning de "optimization bailout"; declarar a exceção conhecida é mais barato que abrir mão de otimização |
| Refetch no evento `moveend`, sem debounce adicional | `moveend` só dispara quando o usuário termina de arrastar ou dar zoom — um debounce em cima seria redundância sem ganho |
| Filtro de situação: checkboxes (`signal<Set>`), não `<select>` único | O backend aceita `situacao` repetível desde que o filtro virou multi-seleção — um `<select>` só permite uma escolha por vez. Estado fora do `FormGroup` porque não precisa de validação, só de um `Set` que o botão "Todas" alterna inteiro |
| Tela abre com as 5 situações já marcadas, não vazia | O default de RN-07-03 (só `AGENCIADA`) vale para quem chama a API direto sem enviar `situacao` — a tela sempre envia a lista explícita, então quem abre o mapa vê o portfólio inteiro de cara, sem precisar aprender que existe um botão "Todas" primeiro |
| Aviso na ficha do imóvel (`propriedade-form`) quando `geoSituacao !== 'CONCLUIDA'` | RN-07-01 exclui do mapa qualquer imóvel não geocodificado — sem o aviso, a ausência do pin parece bug do mapa, não característica do cadastro (endereço não resolvido automaticamente, ou geocodificação ainda em andamento) |
| Botão "Ver imóvel" no popup navega via `Router` injetado, ligado no evento `popupopen` do Leaflet (não `(click)` do Angular) | O HTML do popup é string crua, fora do compilador de template — não existe binding Angular para amarrar. O `click` funciona porque a zona do Angular intercepta `addEventListener` nativo; `ngZone.run(...)` em volta da navegação garante a detecção de mudança mesmo se o registro tivesse ocorrido fora da zona |

Clustering (`leaflet.markercluster`) agrupa marcadores próximos em qualquer zoom onde colidiriam visualmente — independente do teto de 500 do backend (`limitado: true`, ver README do backend). São dois mecanismos com propósitos diferentes: um é sempre visual, o outro é um limite de payload.

### Painel: tela inicial, mapa como item principal

`painel/` é a rota `''` (landing page, antes `pessoas`) — reúne os indicadores do backend (contratos ativos, vencendo em 30 dias, orçamentos aguardando resposta, comissão **projetada** com rótulo explícito, funil comercial) numa faixa de cards e embute `<app-mapa-page>` diretamente abaixo, ocupando a maior parte da tela.

| Decisão | Motivação |
|---|---|
| `PainelPage` importa e renderiza `MapaPage` como componente filho, em vez de um "mini-mapa" próprio | O mapa já resolve filtro, legenda, clustering e o pin/popup novos — duplicar isso num componente reduzido só para o painel seria o mesmo Leaflet, código a mais para manter em dois lugares |
| Card de comissão traz o texto "Projeção" ao lado do valor | O campo já se chama `comissaoProjetada` na API (RN-08-03: não é receita realizada), mas o rótulo não pode depender de quem lê o nome do campo — a tela repete o aviso |

### Validação em duas camadas

O front valida antes de enviar; o backend valida de novo e é ele quem garante — a API é chamável direto, então validação client-side é conveniência de UX, nunca a regra.

| Camada | O quê |
|---|---|
| Front, antes do submit | Campo obrigatório, dígito verificador de CPF/CNPJ ([`shared/validators/`](src/app/shared/validators/)), formato de e-mail. Bloqueia o envio e marca o campo |
| Back, sempre | `@Valid` + regra de domínio. Devolve `400` com `campos{}` (campo → mensagem) ou erro de negócio com `codigo` |
| Front, ao receber o erro | `campos{}` vira erro no control correspondente e aparece sob o campo; erro de negócio vai para o alerta do topo |

O erro aparece em dois lugares ao mesmo tempo, porque resolvem problemas diferentes: [`campo-erro`](src/app/shared/components/campo-erro/campo-erro.ts) mostra a mensagem **sob o campo**, e [`resumo-validacao`](src/app/shared/components/resumo-validacao/resumo-validacao.ts) abre um alerta **nomeando o que falta** ("Nome — Campo obrigatório", "CNPJ — Campo obrigatório"). Só o inline não basta: em formulário longo, ou em tela pequena, o campo pendente pode estar fora da área visível no momento do clique.

O rótulo do resumo vem da tela, não do nome do control — `documento` aparece como "CPF" ou "CNPJ" conforme o tipo escolhido.

`aplicarErrosDoServidor` marca o control com a chave `servidor` **sem apagar** os erros de validação local, e devolve os campos que não existem no formulário em vez de descartá-los silenciosamente — um campo novo no backend não some da tela, entra no resumo.

O texto é o mesmo dos dois lados ("Campo obrigatório"): o front tira de `mensagens-validacao.ts`, o backend de `ValidationMessages.properties`. O usuário não percebe qual das duas camadas barrou.

### Sessão e autorização

Papel checado no backend (`@PreAuthorize`, ver README do backend §7); o front só usa `keycloak.hasRealmRole(...)` para decidir o que **mostrar** (menu, botão), nunca como garantia de acesso — a API responde `403` de qualquer forma se o papel não bater.

**Revogação de acesso.** Se o backend responder `403` com `codigo: ACESSO_REVOGADO` (RN-02-04: a pessoa foi inativada, mas o token ainda não expirou), o `auth.interceptor.ts` desloga automaticamente (`keycloak.logout()`) em vez de deixar a pessoa "logada" recebendo erro em toda ação. Único código de erro que o interceptor trata de forma especial — todo o resto vira `AppError` e quem decide o que fazer é a tela.

### Tema claro/escuro

`data-bs-theme` no `<html>`, alternado por um serviço singleton com persistência em `localStorage`. Não depende só de `prefers-color-scheme` — a escolha explícita do usuário sobrevive ao reload e ganha da preferência do sistema.

### Autenticação

Authorization Code + PKCE contra o Keycloak, via `keycloak-angular`. O token fica em memória (não em `localStorage`) e é renovado de forma transparente; o interceptor o injeta em toda chamada à API.

**`checkLoginIframe` fica desligado.** O iframe oculto de verificação de sessão do `keycloak-js` depende de cookies de terceiros e trava a inicialização em ambiente HTTP local — sem entregar nada que a renovação via `updateToken` já não cubra.

---

## Testes

```bash
npm test
```

Cobrem a regra de negócio, com preferência por teste unitário: validadores de parâmetro, tradução de erro HTTP em `AppError` no interceptor, autorização por papel (único ou lista) no guard, e o comportamento dos formulários e telas de listagem de todos os domínios — tenant, pessoas, propriedades, orçamentos e contratos.

Componentes de shell (topbar, sidebar, bottom-nav) e o serviço de tema não têm teste unitário de propósito — são casca de apresentação e manipulação de DOM, sem regra de negócio a proteger.

`MapaPage` não instancia o mapa Leaflet real no spec: jsdom não tem motor de layout, e um `L.Map` de verdade contra um container sem dimensões é frágil por natureza, não pela lógica que estaria sendo testada. Os testes cobrem a lógica pura do componente (filtro do formulário → `MapaFiltro`, cor por situação, conteúdo do popup) chamando os métodos diretamente, sem `fixture.detectChanges()` — isso nunca dispara `ngAfterViewInit`, então o Leaflet nunca entra em cena. O mapa, o clustering e o popup reais foram verificados com Playwright contra o app rodando de verdade.

**Reaproveitamento de rota do Angular pegou um bug real, só visível com navegador de verdade.** Navegar entre duas instâncias da mesma rota parametrizada (`/orcamentos/:id` → `/orcamentos/:outroId`, no fluxo de "duplicar") reaproveita a instância do componente — um formulário que só lê `route.snapshot.paramMap` no construtor mostra dados do orçamento antigo até um reload manual. Nenhum spec Vitest pegou isso (cada teste monta um `TestBed` novo, nunca reaproveitado); só apareceu testando com Playwright contra o app real. Corrigido assinando `route.paramMap` (Observable) em vez de ler o snapshot uma vez — `OrcamentoForm` e `ContratoForm` seguem esse padrão, com teste de regressão dedicado simulando a navegação via `Subject` de `paramMap`.
