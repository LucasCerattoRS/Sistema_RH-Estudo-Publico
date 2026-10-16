# CONCEITOS — explicados do zero, com exemplos próprios

> Cada conceito traz: (1) explicação do zero, (2) um exemplo próprio ilustrativo.
> Extraído e generalizado a partir de material de estudo sobre uma aplicação
> Node.js/Express/SQLite real — sem referências ao projeto original.

---

## 1. Cliente–servidor e HTTP

A web funciona em pares de mensagens: o **cliente** (navegador) manda uma **requisição**
e o **servidor** devolve uma **resposta**. Cada requisição tem:

- um **verbo** (método): `GET` (ler), `POST` (criar), `PUT` (substituir/editar),
  `DELETE` (remover);
- uma **URL** (`/api/epis/3`);
- **headers** (metadados, ex.: `Content-Type: application/json`,
  `Authorization: Bearer abc123`);
- opcionalmente um **corpo** (o JSON com os dados).

A resposta tem um **código de status**: `200` ok, `400` requisição inválida,
`401` não autenticado, `403` proibido, `404` não existe, `500` erro interno.

**Exemplo próprio:**
```http
POST /api/login HTTP/1.1
Content-Type: application/json

{"usuario":"ana","senha":"1234"}
```

---

## 2. REST

REST é um estilo de organizar a API: cada **recurso** (funcionário, EPI, empresa) tem
uma URL, e o **verbo HTTP diz a ação** — em vez de URLs tipo `/deletarEpi?id=3`, usa-se
`DELETE /api/epis/3`. Parâmetros de rota (`:id`) identificam um item; query string
(`?matricula=...`) filtra coleções.

**Exemplo próprio:** `GET /livros` lista, `POST /livros` cria, `PUT /livros/7` edita o
livro 7, `DELETE /livros/7` apaga.

---

## 3. JSON

JSON (JavaScript Object Notation) é o formato de texto usado para trafegar dados:
objetos `{}`, arrays `[]`, strings, números, `true/false/null`. Em JS:
`JSON.stringify(obj)` → texto; `JSON.parse(texto)` → objeto.

**Exemplo próprio:** `JSON.parse('{"nome":"Luva","ca":12345}')` vira um objeto com
`.nome` e `.ca`.

---

## 4. Node.js e o event loop

Node.js executa JavaScript fora do navegador, em **uma única thread**, com um
**event loop**: operações lentas (disco, rede, banco) são disparadas e o Node continua
atendendo outras coisas; quando a operação termina, o *callback*/Promise é retomado.
Por isso código Node é cheio de `async/await` — **nunca** se deve bloquear a thread.

**Exemplo próprio:**
```js
console.log('A');
setTimeout(() => console.log('C'), 0); // vai para a fila do event loop
console.log('B'); // imprime A, B, C
```

---

## 5. npm e package.json

`npm` é o gerenciador de pacotes do Node. O `package.json` declara as dependências e
scripts; `npm install` baixa tudo para `node_modules/`. O `^` em `"express": "^5.2.1"`
significa "aceito versões compatíveis 5.x".

---

## 6. Variáveis de ambiente e dotenv

Segredos (senhas, tokens) não devem ficar no código (que vai pro Git). Ficam em
**variáveis de ambiente**, lidas via `process.env`. A lib `dotenv` carrega um arquivo
`.env` local para dentro de `process.env`.

**Exemplo próprio:** `.env` com `API_KEY=xyz` → `process.env.API_KEY === 'xyz'`.

---

## 7. Express e middlewares

Express é um framework minimalista: você registra **rotas** (`app.get('/x', handler)`)
e **middlewares** — funções `(req, res, next)` que rodam em fila antes do handler.
Cada middleware pode modificar `req`/`res`, **encerrar** a resposta, ou chamar
`next()` para passar adiante.

**Exemplo próprio:**
```js
function logger(req, res, next) { console.log(req.method, req.url); next(); }
app.use(logger);
app.get('/oi', (req, res) => res.send('olá'));
```

---

## 8. SQLite e o driver usado (sqlite3 + sqlite — assíncrono)

SQLite é um banco SQL completo que vive **num único arquivo** (`banco.sqlite`), sem
servidor separado. Este material usa **duas** libs (veja `exemplos/package.json`):

- `sqlite3` — o driver em si, com API de *callbacks*;
- `sqlite` — um wrapper fino que converte tudo para **Promises**, permitindo
  `await db.get(...)`, `await db.all(...)`, `await db.run(...)`.

> Importante: **não** é o `better-sqlite3` (driver síncrono popular). Aqui o acesso ao
> banco é **assíncrono** — todo uso vem com `await`.

**Exemplo próprio:**
```js
const db = await open({ filename: 'meu.sqlite', driver: sqlite3.Database });
const um  = await db.get('SELECT * FROM livros WHERE id = ?', 7); // 1 linha
const tds = await db.all('SELECT * FROM livros');                 // todas
await db.run('DELETE FROM livros WHERE id = ?', 7);               // sem retorno de linhas
```

---

## 9. SQL: DDL, DML e índices

SQL tem dois grandes grupos: **DDL** define estrutura (`CREATE TABLE`, `ALTER TABLE`,
`CREATE INDEX`) e **DML** mexe nos dados (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
**Índices** aceleram buscas por uma coluna (troca espaço por velocidade).

---

## 10. Prepared statements e SQL injection

**SQL injection** é o ataque nº 1 contra apps com banco: se você concatenar entrada do
usuário na query (`"... WHERE nome = '" + nome + "'"`), alguém digita
`' OR '1'='1` e altera a query. A defesa é o **prepared statement**: a query tem
*placeholders* `?` e os valores viajam separados — o banco nunca os interpreta como SQL.

**Exemplo próprio (vulnerável × seguro):**
```js
db.all(`SELECT * FROM usuarios WHERE nome = '${nome}'`);   // NUNCA
db.all('SELECT * FROM usuarios WHERE nome = ?', nome);     // sempre
```

---

## 11. Transações (ACID)

Transação agrupa vários comandos em um "tudo ou nada": `BEGIN` → comandos → `COMMIT`
(confirma) ou `ROLLBACK` (desfaz tudo). Evita estados pela metade (ex.: baixar o saldo
sem gravar o histórico).

**Cuidado com conexão única compartilhada:** se duas requisições fizerem `BEGIN` ao
mesmo tempo na mesma conexão, o segundo `BEGIN` falha, o `ROLLBACK` do tratamento de
erro desfaz a transação da *outra* e o `COMMIT` dela também falha — o resultado
depende da ordem dos comandos (a escrita da outra pode até ficar gravada fora de
transação), ou seja, sem atomicidade.
A solução é serializar as transações numa fila; veja
[`exemplos/src/transacao.js`](exemplos/src/transacao.js) e os testes em
[`exemplos/test/`](exemplos/test/exemplos.test.js).

---

> **Limites da fila em `exemplos/src/transacao.js`:** ela é global ao módulo (não por conexão); chamar `transacao()` dentro de outra `transacao()` trava para sempre; e toda escrita precisa passar pela fila, porque um `db.run()` fora dela, durante uma transação aberta, entra nessa transação e some se ela der `ROLLBACK`.

## 12. Autenticação por token (Bearer)

Como o HTTP é *stateless* (cada requisição é independente), o cliente precisa provar
quem é a cada chamada. O esquema **Bearer token**: no login o servidor entrega um
token; o cliente o envia sempre em `Authorization: Bearer <token>`.

**Uma implementação simplificada comum (token estático):**
1. `POST /login` compara usuário/senha com valores guardados fora do código
   (variáveis de ambiente); acertou → devolve um token fixo.
2. O cliente guarda o token em `localStorage`.
3. Toda chamada injeta o header `Authorization: Bearer <token>`.
4. Um middleware de autenticação extrai o token do header e compara com o valor
   esperado; inválido → `403`.
5. O cliente trata `403` globalmente: apaga o token e volta ao login.

**Diferença para o mercado:** aqui o token é **estático e único** (não expira, não
identifica usuário) — jeito simples de proteger um app de usuário único, local.
Sistemas com múltiplos usuários usam sessões com cookie `HttpOnly` ou JWT com
expiração, identificando quem é quem a cada requisição.

---

## 13. Comparação em tempo constante (timing attack)

Comparar strings com `===` retorna mais rápido quando o primeiro caractere já difere.
Medindo tempos, um atacante paciente descobre a senha caractere a caractere.
`crypto.timingSafeEqual` compara **sempre no mesmo tempo** — mas **lança erro**
(`ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`) se os dois buffers têm tamanhos diferentes,
e o que o usuário digitou raramente tem o tamanho certo: sem tratamento, uma senha
errada de outro comprimento vira `500` em vez de "credencial inválida". A saída é
aplicar um hash (SHA-256) aos dois lados antes de comparar:

```js
const { igualSeguro } = require('./src/comparar'); // exemplos/src/comparar.js
igualSeguro('1234', '12345'); // false, sem lançar
```

Código executável e teste em [`exemplos/`](exemplos/).

---

## 14. Hashing de senha — o que seria (e por que aqui NÃO tem)

Senha nunca deve ser **guardada**: guarda-se o **hash** (bcrypt/argon2 — lentos de
propósito e com *salt*), e no login compara-se hash com hash. Um app de usuário único
e local às vezes opta por guardar a senha em texto numa variável de ambiente (fora do
código versionado) e comparar direto — defensável só nesse cenário restrito. No
momento em que existir uma tabela de usuários (múltiplas contas), o hash se torna
obrigatório:

```js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(senha, 12);      // no cadastro
const ok   = await bcrypt.compare(senha, hash); // no login
```

---

## 15. Rate limiting

Limitar tentativas por IP/janela de tempo derruba ataques de força bruta: mesmo com
senha fraca, 10 tentativas a cada 15 minutos tornam o ataque inviável.

---

## 16. Helmet e Content Security Policy (CSP)

Helmet adiciona headers de segurança à resposta. O mais poderoso é o
`Content-Security-Policy`: uma lista de **de onde** o navegador pode carregar
scripts/estilos/etc. Mesmo que um atacante injete `<script src="https://mal.com/x.js">`,
o navegador bloqueia se a origem não estiver na lista.

---

## 17. XSS e escape de HTML

**Cross-Site Scripting**: se você joga texto do usuário direto em `innerHTML`, um nome
como `<img src=x onerror=alert(1)>` vira código executando na página (e poderia roubar
o token do `localStorage`). Defesa: **escapar** os 5 caracteres especiais
(`& < > " '`) antes de inserir.

---

## 18. fetch API

`fetch(url, opções)` é a função do navegador para fazer requisições HTTP. Retorna uma
Promise de `Response`; o corpo é lido com `await r.json()` ou `await r.text()`.
`r.ok`/`r.status` indicam o resultado.

---

## 19. Promises e async/await

Uma **Promise** representa um valor futuro (pendente → resolvida/rejeitada).
`async/await` é açúcar sintático: `await` pausa a função (sem travar o programa) até a
Promise resolver; erros viram `try/catch`. `Promise.all([...])` espera várias **em
paralelo**.

**Exemplo próprio:**
```js
async function carrega() {
  const [a, b] = await Promise.all([fetch('/a'), fetch('/b')]); // juntas
  return (await a.json()).total + (await b.json()).total;
}
```

---

## 20. Manipulação de DOM e eventos

O DOM é a árvore de objetos que representa a página. JS lê/escreve nela:
`getElementById`, `querySelectorAll`, `innerHTML`, `textContent`, `classList`.
**Eventos** conectam ações do usuário a funções: `addEventListener('submit', fn)`,
`onclick`, e `ev.preventDefault()` impede o comportamento padrão (ex.: form recarregar
a página).

---

## 21. localStorage

Armazenamento chave→valor **persistente** no navegador (sobrevive a fechar a aba),
sempre em strings, isolado por origem (`http://localhost:3000`). API:
`setItem/getItem/removeItem`.

**Usos típicos:**
1. **Auth**: guardar o token de sessão, removido no logout e ao receber `403`;
2. **Preferência de UI**: uma chave como `tema`, lida cedo (antes da primeira pintura)
   para evitar *flash* de tema errado;
3. **Rascunhos/templates do usuário**: objetos serializados em JSON numa chave própria.

---

## 22. Template literals e IIFE

**Template literals** (crases) permitem interpolação `${expr}` e múltiplas linhas —
jeito comum de gerar HTML dinâmico sem template engine.

**IIFE** (Immediately Invoked Function Expression) — `(function(){ ... })()` — cria um
escopo privado: as variáveis internas não vazam para o global; só o que você quiser é
exposto. Um módulo inteiro pode viver dentro de uma IIFE, publicando só uma API
pública (ex.: `window.MeuModulo = { fazerAlgo }`) — um "módulo" antes de existir
`import/export` nativo do JS.

---

## 23. Chart.js

Biblioteca de gráficos em `<canvas>`: `new Chart(elemento, { type, data, options })`.
Tipos usados aqui: `bar` e `doughnut`. Ao re-renderizar, é preciso `destroy()` no
gráfico anterior, senão eles se acumulam no mesmo canvas.

---

## 24. child_process.spawn (processo em segundo plano)

Node pode disparar **outro processo** do sistema operacional. `spawn` roda um comando
sem bloquear o processo pai — ideal para tarefas longas que não podem travar o
servidor (lembre: o Node tem uma thread só).

---

## 25. Buffer, streams e parsing binário

**Buffer** é a estrutura do Node para bytes crus; **stream** processa dados em pedaços
(`res.pipe(out)` grava o download direto no disco sem carregar tudo na RAM).
Formatos binários têm **assinaturas**: ZIP começa com `PK` (`0x04034b50`), RAR com
`Rar!` — dá para identificar o formato lendo os primeiros bytes.

---

## 26. CSS custom properties (variáveis) e tema escuro

Variáveis CSS são declaradas com `--nome: valor` e usadas com `var(--nome)`. Definidas
em `:root`, valem para a página toda — e podem ser **redefinidas por contexto**, que é
o truque clássico de dark mode: um atributo no `<html>` troca todas as cores de uma vez.

**Exemplo próprio:**
```css
:root { --bg: white; }
:root[data-theme="dark"] { --bg: black; }
body { background: var(--bg); }
```

---

## 27. Media queries: responsividade e impressão

`@media` aplica CSS condicionalmente. `(max-width: 900px)` → telas estreitas
(responsividade); `print` → quando a página vai para a impressora.

---

## 28. Blob e download gerado no cliente

Um **Blob** é um "arquivo em memória" no navegador. Para baixá-lo:
`URL.createObjectURL(blob)` → cria uma URL temporária → um `<a download>` invisível é
clicado via JS → `URL.revokeObjectURL` libera a memória.

**Exemplo de uso real:** uma função de exportação client-side normalmente serve vários
formatos com o mesmo ritual — `.xlsx` binário (via lib tipo SheetJS), `.xls` que na
verdade é HTML estilizado (o Excel abre normalmente, inclusive com o comentário
condicional `<!--[if gte mso 9]>` para configurar a planilha), e `.csv` com separador
`;` e **BOM** (para o Excel em português reconhecer acentos corretamente). Bônus: cópia
para a área de transferência com `navigator.clipboard.writeText` em formato TSV.
