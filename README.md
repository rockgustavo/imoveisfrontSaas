# Controle imobiliário SaaS

> Frontend Angular do SaaS de administração de corretora de imóveis.
> Consome a API e o Keycloak publicados pelo backend ([`imoveisbackSaas`](https://github.com/rockgustavo/imoveisbackSaas), repositório separado).

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)
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
├── shared/                   shell e navegação
│   ├── nav-items.ts           fonte única dos itens de menu
│   └── components/            topbar, sidebar, bottom-nav
└── imobiliaria/              domínio — serviço HTTP, modelos, telas
```

Pasta por domínio, não por tipo de arquivo: a tela, o serviço e o modelo de `imobiliaria` ficam juntos, do mesmo jeito que o módulo correspondente no backend. Domínio novo é pasta nova, não um arquivo a mais em cada uma de cinco pastas técnicas.

| Decisão | Motivação |
|---|---|
| Signals, sem NgRx | O escopo não tem estado global compartilhado que justifique o boilerplate de store/action/reducer |
| `OnPush` em todo componente | Com signals, a detecção de mudança fica previsível — o componente só re-renderiza quando um sinal que ele lê muda |
| Um serviço por domínio encapsulando `HttpClient` | Componente não conhece URL nem formato de payload; trocar contrato mexe em um arquivo |
| Interceptor único para token e erro | Toda requisição autenticada e todo erro traduzido no mesmo lugar, sem repetir `catchError` por chamada |
| Mapeamento manual `record` ↔ modelo | Sem camada de mapper; o `record` do backend vira interface TypeScript direta |

`any` é erro de revisão.

### Layout padrão intuitivo e simples

Sidebar fixa colapsável (desktop) + topbar sticky + bottom nav (abaixo de 992px). Os três consomem a mesma fonte de navegação — [`shared/nav-items.ts`](src/app/shared/nav-items.ts) — então adicionar um item de menu é editar um array, não três templates.

O layout parte do menor breakpoint e cresce, em vez de ser desktop adaptado depois: a bottom nav é o caminho de navegação padrão no celular, não uma sidebar espremida.

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

Cobrem a regra de negócio, com preferência por teste unitário: validadores de parâmetro, tradução de erro HTTP em `AppError` no interceptor, autorização por papel no guard, e o comportamento do formulário de parâmetros.

Componentes de shell (topbar, sidebar, bottom-nav) e o serviço de tema não têm teste unitário de propósito — são casca de apresentação e manipulação de DOM, sem regra de negócio a proteger.
