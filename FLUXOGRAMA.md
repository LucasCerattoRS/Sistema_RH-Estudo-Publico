# FLUXOGRAMA — diagramas Mermaid do padrão monólito Node/Express + SQLite

> Material de estudo genérico. Companheiro de `ARQUITETURA.md` e `CONCEITOS.md`.
> Nenhuma referência a um sistema real — rotas e nomes são ilustrativos.
>
> **Como renderizar os diagramas:** no VS Code, instale a extensão *Markdown Preview
> Mermaid Support* e abra a pré-visualização (`Ctrl+Shift+V`); ou cole o bloco em
> https://mermaid.live; no GitHub eles renderizam sozinhos.

---

## (a) Boot — do duplo clique no script ao Express ouvindo

O usuário nunca digita `node server.js`: dá dois cliques num `.bat`/`.sh`. O script
checa o runtime, instala dependências na primeira execução, sobe o servidor (em
outra janela, se for Windows), espera alguns segundos e abre o navegador no login.
Dentro do processo Node: dotenv → middlewares globais → validação dos segredos
(aborta sem eles) → migração de schema → `app.listen`.

```mermaid
flowchart TD
    A["Usuário: 2 cliques no script de início"] --> B["Entra na pasta do próprio script"]
    B --> C{"Runtime instalado?"}
    C -- "não" --> C1["Mostra erro e para"]
    C -- "sim" --> D{"Dependências já instaladas?"}
    D -- "não" --> E["Instala dependências (primeira execução)"]
    E --> F
    D -- "sim" --> F["Sobe o servidor (nova janela/processo)"]
    F --> G["Espera alguns segundos"]
    G --> H["Abre o navegador na tela de login"]

    F -.inicia outro processo.-> I["Carrega variáveis de ambiente (.env)"]
    I --> J["Importa dependências: framework web, driver SQLite, segurança..."]
    J --> K["Middlewares globais: segurança/CSP → parse JSON → estáticos"]
    K --> L{"Segredos obrigatórios definidos?"}
    L -- "não" --> L1["Encerra o processo — recusa subir sem segredos"]
    L -- "sim" --> M["Cria o limitador de tentativas de login"]
    M --> N["Migração: cria/ajusta tabelas se necessário"]
    N --> O["app.listen(porta) → servidor no ar"]
```

---

## (b) Login / autenticação

Sem sessão nem JWT: o "login" valida usuário/senha contra os valores do ambiente
usando comparação em **tempo constante** (evita timing attack) e, se ok, devolve um
**token estático**. O cliente guarda no `localStorage` e passa a enviá-lo como
`Authorization: Bearer <token>` em todas as chamadas. Um rate limiter protege contra
força bruta.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant B as Browser (login)
    participant RL as Rate limiter
    participant E as Express (POST /login)

    U->>B: preenche usuário e senha, submit
    B->>B: evento.preventDefault()
    B->>RL: POST /login {usuario, senha} (fetch JSON)
    alt muitas tentativas na janela de tempo
        RL-->>B: 429 Too Many Requests
    else dentro do limite
        RL->>E: next()
        E->>E: compara credenciais em tempo constante
        alt credenciais corretas
            E-->>B: 200 {sucesso:true, token}
            B->>B: localStorage.setItem('token', token)
            B->>B: redireciona para o painel
        else incorretas
            E-->>B: 401 {sucesso:false, mensagem:'credenciais inválidas'}
            B->>B: mostra a mensagem de erro
        end
    end
```

---

## (c) CRUD com chave composta

Quando um recurso não tem `id` único global — a identidade é composta por duas ou
mais colunas (ex.: "matrícula + empresa", "usuário + tenant") — o `PUT`/`DELETE`
carrega a chave **antiga** na URL, e o corpo carrega os campos novos. A violação de
unicidade não precisa ser testada com `SELECT` prévio: o código tenta inserir e
traduz o erro de constraint do banco em mensagem amigável — o banco é a autoridade.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant B as Browser
    participant S as Express
    participant DB as SQLite

    U->>B: preenche formulário, submit
    B->>S: POST /api/recurso {campos} — ou PUT /api/recurso/:chaveAntigaA/:chaveAntigaB
    S->>S: auth (Bearer token)
    S->>S: valida o payload
    alt payload inválido
        S-->>B: 400 {sucesso:false, mensagem: erro}
    else válido
        S->>DB: INSERT ... — ou UPDATE ... WHERE chave_a=? AND chave_b=?
        alt chave única violada
            DB-->>S: erro de constraint
            S-->>B: 400 "já existe um registro com essa chave"
        else UPDATE sem alvo (0 linhas afetadas)
            S-->>B: 404 "registro não encontrado"
        else ok
            S-->>B: 200 {sucesso:true}
            B->>S: GET /api/recurso — recarrega a lista inteira
            S->>DB: SELECT * FROM recurso
            DB-->>S: rows
            S-->>B: JSON → tabela re-renderizada (servidor como fonte da verdade)
        end
    end
```

---

## (d) Snapshot histórico — congelar o valor vigente no momento do evento

Padrão de auditoria: ao registrar um evento sobre um item (entrega, movimentação,
transação), o servidor **congela** o valor vigente daquele item na própria linha do
evento. Se o item mudar de valor no futuro, o histórico continua provando o que
valia **na data do evento** — útil sempre que existir requisito documental/legal.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant B as Browser
    participant S as Express
    participant DB as SQLite

    U->>B: seleciona item, tipo de evento, submit
    B->>S: POST /api/eventos {item_id, tipo, data, ...}
    S->>S: valida o payload
    S->>DB: SELECT item vigente (para capturar o valor atual)
    alt item não existe
        S-->>B: 400 {mensagem: "item não encontrado"}
    else ok
        S->>DB: INSERT evento (..., valor_no_ato = item.valor_atual)
        Note right of DB: snapshot: o campo "no_ato" nunca muda depois,<br/>mesmo que o item seja editado
        S-->>B: 200 {sucesso:true}
        B->>B: recarrega a lista de eventos
    end
```

---

## (e) Exportação — tudo no cliente

Exportar **não precisa passar pelo servidor**: um módulo de exportação recebe os
dados que a página já buscou da API, abre um modal de configuração (formato, colunas,
tema) e gera o arquivo **no navegador**. Formatos comuns: `.xlsx` (biblioteca
carregada sob demanda de um CDN), `.xls` (na prática, HTML estilizado que o Excel
aceita), `.csv` (com separador e BOM ajustados pro locale) e cópia direta pra área de
transferência.

```mermaid
flowchart TD
    A["Botão Exportar"] --> B["Página coleta os dados já carregados da API"]
    B --> C["Abre modal: dataset, colunas, formato, tema"]
    C --> D{"Formato escolhido"}
    D -- "xlsx" --> F["Carrega a lib de planilha sob demanda (CDN)"]
    F --> F1{"CDN acessível?"}
    F1 -- "não" --> F2["Erro: 'Falha ao carregar biblioteca' — exige internet"]
    F1 -- "sim" --> G["Monta a planilha, 1 aba por dataset"]
    D -- "xls" --> H["Tabela HTML estilizada num Blob (Excel abre)"]
    D -- "csv" --> I["Formata células, junta com separador, adiciona BOM"]
    D -- "clipboard" --> J["Junta linhas com TAB → área de transferência"]
    G --> K["Gera Blob e dispara o download"]
    H --> K
    I --> K
    J --> L["Colar direto no Excel/Sheets"]
    K --> M["Navegador baixa o arquivo — servidor nunca soube da exportação"]
```

---

## (f) Backup — cópia fria com retenção

Um módulo de backup tem tipicamente **duas portas de entrada**: um botão na
interface e a execução direta via linha de comando/agendador (o mesmo arquivo
funciona como lib **e** CLI). O backup é uma **cópia fria** do arquivo do banco.

```mermaid
flowchart TD
    A1["Interface: botão Backup"] --> R
    A2["Terminal/agendador: execução direta"] --> R
    R["runBackup()"] --> B["Cria a pasta de backups se não existir"]
    B --> C["Gera o carimbo de data/hora (formato ISO, ordenável)"]
    C --> D["Copia o arquivo do banco para backups/banco_<carimbo>.sqlite"]
    D --> E["Grava metadados do último backup"]
    E --> F{"Mais backups que o limite de retenção?"}
    F -- "sim" --> G["Apaga os mais antigos (ordenação lexicográfica = cronológica)"]
    F -- "não" --> H
    G --> H["Responde com sucesso + timestamp + nome do arquivo"]
```

**Avisos que valem a leitura:** (1) a retenção por ordenação lexicográfica só
funciona **porque** o carimbo usa formato `AAAA-MM-DD` com zero à esquerda — ordem
alfabética vira ordem cronológica; (2) copiar o arquivo do banco com o servidor no ar
é *backup a quente sem lock* — se uma escrita estiver no meio do caminho, a cópia
pode sair inconsistente. O jeito canônico seria usar a API de backup nativa do banco
(ex.: `VACUUM INTO` no SQLite); para um app local mono-usuário, o risco real é baixo,
mas vale saber nomeá-lo.

---

## Índice dos fluxos

| Fluxo | Diagrama |
|---|---|
| Boot (script → Express) | (a) |
| Login / token | (b) |
| CRUD com chave composta | (c) |
| Snapshot histórico | (d) |
| Exportação (cliente) | (e) |
| Backup + retenção | (f) |
