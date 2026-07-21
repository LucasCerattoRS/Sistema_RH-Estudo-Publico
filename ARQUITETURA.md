# ARQUITETURA — padrão de um monólito Node.js/Express + SQLite

> Material de estudo genérico, extraído e generalizado a partir de uma aplicação real
> de gestão interna (Node.js/Express/SQLite). Nenhuma referência ao sistema original —
> os exemplos de rota, tabela e trade-off aqui são ilustrativos.

---

## 1. Visão geral em uma frase

Um **monólito Node.js/Express** que serve uma **aplicação multi-página em JavaScript
puro** (sem framework de frontend) e expõe uma **API REST interna** protegida por
token, com todos os dados em **um único arquivo SQLite** — um padrão comum para apps
internos de uso único ou de pequena equipe, pensados para rodar localmente.

```
Navegador (login.html / painel.html / ...)
        │  fetch() com header Authorization: Bearer <token>
        ▼
Express (servidor, porta 3000)
        │  driver assíncrono, prepared statements
        ▼
banco.sqlite  ──(cópia periódica)──▶  backups/banco_<timestamp>.sqlite
```

## 2. Árvore de pastas típica

```
app/
├── iniciar.bat / iniciar.sh   # Ponto de entrada do usuário: checa runtime,
│                               # instala dependências se preciso, sobe o servidor.
├── server.js                  # Express + segurança (headers, rate limit, auth) +
│                               # migração de schema + rotas da API.
├── backup.js                  # Módulo de backup: copia o banco, grava metadados,
│                               # apaga cópias antigas (retenção).
├── package.json                # Dependências e scripts.
├── .env                        # Segredos (NÃO versionar): token de admin, senha.
├── banco.sqlite                 # O banco de dados inteiro, em um arquivo.
├── backups/                     # Cópias do banco + metadados.
└── public/                      # Servido estático pelo Express.
    ├── login.html / login.js    # Tela de login → POST /login → guarda token.
    ├── painel.html / app.js     # Painel principal: CRUD, filtros, gráficos.
    └── style.css                # Estilo global: variáveis CSS, tema dark, @media.
```

## 3. Sequência de boot típica

1. `require('dotenv').config()` carrega o `.env` para `process.env`.
2. Importa dependências e cria o `app` Express, registrando middlewares
   **globais** nesta ordem: headers de segurança → `express.json()` →
   `express.static('public')`.
3. Lê os segredos do ambiente (token de admin, usuário, senha); se faltar algum,
   **encerra o processo** — "fail fast": melhor não subir do que subir inseguro.
4. Cria o limitador de tentativas de login (rate limiter).
5. Roda a migração de schema: cria/ajusta tabelas (`CREATE TABLE IF NOT EXISTS` +
   `ALTER TABLE ... ` tolerante a erro para colunas novas).
6. Define rotas e sobe o servidor: `app.listen(PORT)`.

> Detalhe de estudo: se a migração for assíncrona e disparada "em paralelo" com o
> `listen`, existe uma corrida teórica (a primeira requisição pode chegar antes da
> migração terminar). Num app local de baixo tráfego costuma ser inofensivo na
> prática, mas o design mais rigoroso seria `await migrar()` antes do `listen`.

## 4. Fluxo de uma requisição típica

Exemplo: usuário clica em "Adicionar item" numa tela de cadastro.

```
1. BROWSER   o submit do formulário é interceptado (ev.preventDefault())
2. BROWSER   fetch('/api/itens', { method:'POST', body: JSON.stringify(...) })
             — um wrapper injeta o header Authorization: Bearer <token do localStorage>
3. REDE      HTTP POST /api/itens (JSON no corpo)
4. EXPRESS   middlewares globais: headers de segurança, express.json() transforma
             o corpo em req.body
5. EXPRESS   casa com app.post('/api/itens', auth, handler)
6. AUTH      middleware auth(): extrai o token do header Bearer, compara com o
             token esperado (idealmente em tempo constante); inválido → 403 e para
7. HANDLER   valida os campos; erro → res.status(400).json({...})
8. SQLITE    db.run('INSERT INTO itens (...) VALUES (?,?,...)', valores)
             — prepared statement: os "?" impedem SQL injection; driver assíncrono → await
9. EXPRESS   res.json({ sucesso: true })
10. BROWSER  trata a resposta: sucesso → mensagem + recarrega a lista (novo GET)
```

Pontos didáticos desse fluxo:

- **O servidor não renderiza HTML** (fora casos pontuais de documento pronto pra
  impressão): ele devolve JSON e o *cliente* constrói a tela — padrão "API + frontend
  consome".
- **Erro 403 com tratamento global no cliente**: o wrapper de fetch detecta 403,
  apaga o token e redireciona pro login — logout forçado.
- **Re-render simples**: em vez de atualizar só a linha alterada (como faria um
  framework reativo), o código comum nesse padrão refaz a lista inteira. Menos
  eficiente, muito mais simples — escolha consciente para volumes pequenos de dados.

## 5. Modelo de rotas (padrão REST)

| Área | Rota | Observação |
|---|---|---|
| Auth | `POST /login` | com rate limiter; compara credenciais em tempo constante; devolve o token |
| Recurso | `GET /api/itens` | lista |
| Recurso | `POST /api/itens` | cria |
| Recurso | `PUT /api/itens/:id` | edita |
| Recurso | `DELETE /api/itens/:id` | remove |
| Backup | `POST /api/backup` | dispara cópia do banco |

Todas exigem `Authorization: Bearer <token>`, exceto o login.

## 6. Stack — o porquê de cada escolha típica

| Camada | Escolha comum | Por quê | Típico ou atípico? |
|---|---|---|---|
| Runtime | **Node.js** | Uma linguagem só (JS) no front e no back; instalação simples. | Típico p/ apps locais pequenos. |
| Web | **Express** | Roteamento + middlewares com pouco código; documentação enorme. | Muito típico. |
| Banco | **SQLite** (driver assíncrono) | Zero servidor de banco: o banco é um arquivo, o backup é uma cópia de arquivo. Perfeito p/ single-user local. | Muito típico p/ desktop/local. |
| Segurança HTTP | **Headers de segurança (tipo Helmet) + CSP** | Protege contra classes inteiras de ataque com pouco código. | Boa prática mesmo em app local. |
| Força bruta | **Rate limiting no login** | Poucas tentativas por IP/janela de tempo. | Típico. |
| Config | **dotenv + `.env`** | Segredos fora do código versionado; servidor recusa subir sem eles. | Típico. |
| Frontend | **JS vanilla, multi-page** | Sem build, sem transpiler: abre e funciona. Cada página tem seu JS. | Atípico no mercado atual (que usa SPA/React/Vue), mas ótimo p/ aprender: você vê o DOM, o fetch e o evento "crus". |
| Auth | **Token estático em `localStorage`** | Simples: login certo → servidor devolve um token fixo; cliente guarda e manda como `Bearer` em tudo. | **Atípico/simplificado** — ver §7. |

## 7. Padrões presentes — e os desvios conscientes de "boas práticas de produção"

### Padrões que esse tipo de projeto costuma usar

1. **Monólito** — um processo serve estáticos E API. Para 1 máquina/1 usuário é a
   arquitetura certa; microserviços aqui seriam complexidade gratuita.
2. **Multi-Page Application (MPA)** — cada tela é um `.html` com seu `.js`; navegação
   é recarga de página. Estado global entre páginas vive no `localStorage` (token,
   tema) e no servidor (dados).
3. **API REST interna** — recursos em URLs, verbos HTTP com semântica correta,
   respostas JSON com códigos de status apropriados.
4. **Middleware pipeline** — segurança → parse do corpo → estáticos → auth por rota
   → handler.
5. **Snapshot histórico** — ao registrar um evento, gravar os valores vigentes NO
   MOMENTO junto com o registro, para que edições futuras não reescrevam o passado.
   Boa prática para qualquer sistema com valor de auditoria.

### Onde desvia das "boas práticas" de mercado — e quando é aceitável

| Desvio | O mercado faria | Quando é aceitável |
|---|---|---|
| **Token único e estático**, sem expiração, sem usuário individual | Sessões ou JWT por usuário, com expiração e refresh | Num sistema local de usuário único atrás de `localhost`. Inaceitável se exposto à internet: token vazou = acesso eterno. |
| **Senha sem hash**, comparada em texto puro | `bcrypt`/`argon2` + senhas por usuário no banco | Só defensável quando há um único usuário, a senha não está no banco nem no código versionado, e o app roda local — e mesmo assim, a comparação deve ser em **tempo constante**. Para multiusuário, hash é obrigatório. |
| **Token em `localStorage`** | Cookie `HttpOnly` (imune a leitura por JS/XSS) | Risco real de XSS ler o token. Mitigado se TODO dado renderizado é escapado e há uma CSP. Em app local, risco baixo; num app exposto, prefira cookies. |
| **HTTP sem TLS** | HTTPS sempre | `http://localhost` não sai da máquina — ok localmente, nunca em produção real. |
| **Sem testes automatizados** | Testes de rota/unidade | Desvio real: qualquer refactor passa a depender de teste manual. |
| **Migração "na marra"** (`ALTER TABLE` tolerante a erro) | Ferramenta de migração versionada | Idempotente e suficiente p/ 1 banco local; arriscado em produção multi-ambiente. |

**Resumo da moral**: quase todos os desvios acima são trocas deliberadas de
*robustez de produção* por *simplicidade de operação local*. O que vale levar para
projetos "de verdade": hash de senha, tokens com expiração, testes automatizados, e
divisão em módulos.
