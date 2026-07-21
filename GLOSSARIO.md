# GLOSSÁRIO — termos técnicos (A–Z)

> Definições curtas (2–4 linhas). Quando existe explicação aprofundada, o verbete
> aponta para o item correspondente em **CONCEITOS.md**. Extraído e generalizado a
> partir de material de estudo sobre uma aplicação Node.js/Express/SQLite real.

---

**API (Application Programming Interface)** — Conjunto de "portas de entrada" que um
programa oferece a outro. Exemplo: as rotas `/api/...` de um backend Express que o
frontend consome via `fetch`. Ver CONCEITOS.md §1–2.

**async/await** — Sintaxe do JavaScript para escrever código assíncrono como se fosse
sequencial: `await` espera uma Promise resolver sem travar o programa.
Ver CONCEITOS.md §19.

**Autenticação** — Provar quem você é (login). Diferente de *autorização* (o que você
pode fazer). Exemplo comum: `POST /login` devolve um token Bearer. Ver CONCEITOS.md §12.

**Backup** — Cópia de segurança dos dados. Aqui é literalmente copiar o arquivo
`banco.sqlite` para `backups/` com carimbo de data.

**Bearer token** — Esquema de autenticação HTTP: o cliente envia
`Authorization: Bearer <token>` em cada requisição; quem "porta" (bears) o token tem
acesso. Ver CONCEITOS.md §12.

**Blob** — Objeto do navegador que representa um arquivo em memória; base dos
downloads gerados no cliente. Ver CONCEITOS.md §28.

**BOM (Byte Order Mark)** — Bytes invisíveis no início de um arquivo de texto que
sinalizam a codificação. O CSV exportado inclui BOM para o Excel ler acentos; o importador de C.A. remove o BOM do arquivo do governo.

**Buffer** — Estrutura do Node.js para bytes crus (dados binários). Usado no parser
de ZIP/RAR. Ver CONCEITOS.md §25.

**C.A. (Certificado de Aprovação)** — Registro oficial do Ministério do Trabalho que
autoriza a venda/uso de um EPI no Brasil. O projeto mantém uma cópia local da base
oficial na tabela `cas_oficiais`.

**Callback** — Função passada como argumento para ser chamada depois ("quando
terminar, execute isto"). O driver `sqlite3` usa callbacks; o wrapper `sqlite`
converte para Promises. Ver CONCEITOS.md §8 e §19.

**Chart.js** — Biblioteca de gráficos em `<canvas>`, carregada via CDN. Usada nos
dashboards (, ). Ver CONCEITOS.md §23.

**child_process / spawn** — API do Node para rodar outro programa em processo
separado. Usada para a importação pesada da base C.A..
Ver CONCEITOS.md §24.

**CDN (Content Delivery Network)** — Servidores públicos que hospedam bibliotecas
(aqui, `cdn.jsdelivr.net` para Chart.js e SheetJS). Precisa estar liberado na CSP.
Ver CONCEITOS.md §16.

**CRUD** — Create, Read, Update, Delete: as 4 operações básicas sobre dados. Mapeiam
para POST, GET, PUT, DELETE nas rotas REST. Ver CONCEITOS.md §1–2.

**CSP (Content Security Policy)** — Header que diz ao navegador de quais origens ele
pode carregar scripts/estilos; bloqueia injeções mesmo que o HTML seja comprometido. Ver CONCEITOS.md §16.

**CSS custom properties (variáveis CSS)** — `--nome: valor` + `var(--nome)`; base do
tema claro/escuro. Ver CONCEITOS.md §26.

**CSV** — "Comma-Separated Values": tabela em texto puro, um registro por linha. O
exportador gera CSV com `;` (padrão do Excel pt-BR) em .

**dataset (atributo `data-*`)** — Atributos HTML livres (`data-del="3"`) lidos em JS
via `el.dataset.del`. Usados para levar dados até os botões das tabelas. Ver CONCEITOS.md §20.

**DDL / DML** — Subconjuntos do SQL: DDL define estrutura (CREATE/ALTER), DML mexe
nos dados (SELECT/INSERT/UPDATE/DELETE). Ver CONCEITOS.md §9.

**DOM (Document Object Model)** — Representação da página como árvore de objetos que
o JS manipula (`getElementById`, `innerHTML`...). Ver CONCEITOS.md §20.

**dotenv / .env** — Lib e arquivo para carregar variáveis de ambiente. Segredos ficam fora do código. Ver CONCEITOS.md §6.

**EPI (Equipamento de Proteção Individual)** — Capacete, luva, botina etc. Objeto de
negócio central do módulo EPI, regulado pela NR-6.

**Event loop** — Mecanismo que permite ao Node (single-thread) atender várias
operações intercalando esperas de I/O. Ver CONCEITOS.md §4.

**Evento (DOM)** — Sinal de interação (click, submit, input) que dispara funções
registradas (`addEventListener`, `onclick`). Ver CONCEITOS.md §20.

**Express** — Framework web minimalista do Node: rotas + middlewares. Ver CONCEITOS.md §7.

**fetch** — Função do navegador para requisições HTTP; retorna Promise de `Response`. Ver CONCEITOS.md §18.

**FTP** — Protocolo antigo de transferência de arquivos. A base oficial de C.A. é
baixada de um FTP do governo. Ver CONCEITOS.md §25.

**Hash (de senha)** — Transformação irreversível usada para guardar senhas com
segurança (bcrypt/argon2). **Este projeto não usa** — a senha vem do `.env`.
Ver CONCEITOS.md §14.

**Helmet** — Middleware que adiciona headers de segurança HTTP, incluindo a CSP. Ver CONCEITOS.md §16.

**HTTP** — Protocolo requisição/resposta da web: verbos (GET/POST/PUT/DELETE),
headers, corpo e códigos de status (200/400/403/...). Ver CONCEITOS.md §1.

**Idempotente** — Operação que pode ser repetida sem mudar o resultado além da
primeira vez. Ex.: `CREATE TABLE IF NOT EXISTS` e os `ALTER ... .catch()` da migração. Ver CONCEITOS.md §9.

**IIFE** — Função executada imediatamente `(function(){...})()`; cria escopo privado
sem "vazar" variáveis globais (, ). Ver CONCEITOS.md §22.

**Índice (SQL)** — Estrutura que acelera buscas por uma coluna
(`idx_mov_func`, ). Ver CONCEITOS.md §9.

**JSON** — Formato de texto para dados estruturados; idioma oficial entre o frontend
e a API (`JSON.stringify`/`r.json()`). Ver CONCEITOS.md §3.

**localStorage** — Armazenamento persistente chave→valor do navegador. Usos típicos:
token de autenticação, preferência de tema, rascunhos/templates do usuário.
Ver CONCEITOS.md §21.

**Media query (`@media`)** — CSS condicional por características do meio: largura de
tela (responsividade) ou impressão (`print`). Ver CONCEITOS.md §27.

**Middleware** — Função `(req, res, next)` que roda antes do handler da rota; pode
barrar (como o `auth`, ) ou preparar a requisição. Ver CONCEITOS.md §7.

**Migração (de schema)** — Evolução da estrutura do banco sem perder dados. Feita em
`migrar()`. Ver CONCEITOS.md §9 e §11.

**Monólito** — Arquitetura em que um único processo/aplicação faz tudo (estáticos +
API + banco). Ver ARQUITETURA.md §7.

**MPA (Multi-Page Application)** — App com várias páginas HTML e recarga a cada
navegação (oposto de SPA). É o modelo deste frontend. Ver ARQUITETURA.md §7.

**MutationObserver** — API do navegador que observa mudanças no DOM e chama um
callback. Ver CONCEITOS.md §20.

**Node.js** — Runtime que executa JavaScript fora do navegador; base do servidor.
Ver CONCEITOS.md §4.

**NR-6** — Norma Regulamentadora nº 6: obriga o empregador a fornecer e **registrar**
a entrega de EPIs. É o motivo de existir a Ficha de EPI e o snapshot `ca_no_ato`.

**npm** — Gerenciador de pacotes do Node; lê o `package.json` e instala em
`node_modules/`. Ver CONCEITOS.md §5.

**Placeholder (`?`)** — Marcador de posição em SQL preenchido com valores separados;
o mecanismo dos prepared statements. Ver CONCEITOS.md §10.

**Polling** — Perguntar repetidamente "já terminou?" em intervalos. O status da
importação de C.A. é consultado a cada 8 s.

**Prepared statement** — Query SQL pré-compilada com placeholders; defesa padrão
contra SQL injection e mais rápida em lote.
Ver CONCEITOS.md §10.

**Promise** — Objeto que representa um valor futuro (pendente → resolvida/rejeitada);
base do `async/await` e do `fetch`. Ver CONCEITOS.md §19.

**Query string** — Parte da URL após `?` com pares chave=valor
(`/api/movimentacoes?matricula=...&empresa=...`, ). Ver CONCEITOS.md §2.

**Rate limiting** — Limitar requisições por IP/tempo para frear força bruta. Ver CONCEITOS.md §15.

**REST** — Estilo de API: recursos em URLs, verbos HTTP com semântica, respostas com
códigos de status. Ver CONCEITOS.md §2.

**Rota (route)** — Associação método+URL → função handler
(`app.get('/api/epis', ...)`, ). Ver CONCEITOS.md §7.

**SheetJS (xlsx)** — Biblioteca que gera arquivos Excel reais (.xlsx) no navegador;
carregada sob demanda. Ver CONCEITOS.md §28.

**SPA (Single-Page Application)** — App de página única em que o JS troca as telas
sem recarregar (React/Vue). Este projeto **não** é SPA — é MPA.

**SQL injection** — Ataque que injeta SQL via entrada do usuário; neutralizado por
prepared statements e whitelist de colunas. Ver CONCEITOS.md §10.

**SQLite** — Banco SQL embutido num único arquivo, sem servidor (`banco.sqlite`).
Ver CONCEITOS.md §8.

**Stateless** — Propriedade do HTTP: cada requisição é independente, o servidor não
"lembra" de você — por isso o token vai em toda chamada. Ver CONCEITOS.md §12.

**Stream** — Processamento de dados em pedaços, sem carregar tudo na memória
(`res.pipe(out)`, ). Ver CONCEITOS.md §25.

**Template literal** — String com crases que aceita `${expressões}` e quebras de
linha; gera todo o HTML dinâmico do projeto. Ver CONCEITOS.md §22.

**Timing attack** — Descobrir segredos medindo o tempo de resposta de comparações;
mitigado por `crypto.timingSafeEqual`. Ver CONCEITOS.md §13.

**Token** — Credencial enviada a cada requisição para provar autenticação. Aqui, o
valor de `AUTH_TOKEN` guardado em `localStorage`. Ver CONCEITOS.md §12.

**Transação** — Grupo de comandos SQL "tudo ou nada" (BEGIN/COMMIT/ROLLBACK), como na
baixa de estoque. Ver CONCEITOS.md §11.

**Upsert** — INSERT que vira UPDATE se o registro já existe; no SQLite,
`INSERT OR REPLACE`. Ver CONCEITOS.md §9.

**Whitelist** — Lista fechada de valores permitidos; usada para nomes de coluna que
vêm do cliente (`ALLOWED_COLS`, ). Ver CONCEITOS.md §10.

**XSS (Cross-Site Scripting)** — Injeção de HTML/JS malicioso em páginas; bloqueado
pelo escape `esc()` + CSP. Ver CONCEITOS.md §17.
