# Material de estudo — monólito Node.js/Express/SQLite

Material didático sobre o padrão arquitetural de um app web interno pequeno:
**Node.js + Express + SQLite, multi-página, autenticado por token**. Extraído e
generalizado a partir do estudo de uma aplicação real de gestão interna — sem
nenhuma referência ao sistema original, código-fonte ou nomes reais.

## Conteúdo

- **[CONCEITOS.md](CONCEITOS.md)** — 28 conceitos de desenvolvimento web explicados
  do zero, cada um com explicação teórica + exemplo próprio ilustrativo. Do básico
  (cliente-servidor, JSON) ao intermediário/avançado (prepared statements, timing
  attack, transações ACID, streams e parsing binário).
- **[GLOSSARIO.md](GLOSSARIO.md)** — dicionário rápido (A–Z) dos mesmos termos, pra
  consulta pontual.
- **[ARQUITETURA.md](ARQUITETURA.md)** — como esse padrão de app costuma se organizar:
  árvore de pastas, sequência de boot, fluxo de uma requisição, mapa de rotas REST,
  e uma tabela do porquê de cada escolha de stack.
- **[FLUXOGRAMA.md](FLUXOGRAMA.md)** — 6 diagramas Mermaid dos fluxos principais
  (boot, login, CRUD com chave composta, snapshot histórico, exportação, backup).

## Pra quem é

Quem está aprendendo desenvolvimento web backend/full-stack e quer ver os conceitos
amarrados a um exemplo coerente — não só teoria solta, mas também não um tutorial de
"cole isso aqui" sem entender o porquê.

## Como usar

Se está começando do zero, siga `CONCEITOS.md` na ordem. Se já tem alguma base, comece
por `ARQUITETURA.md` pra ver o quadro geral, use `FLUXOGRAMA.md` pra visualizar os
fluxos, e volte pra `CONCEITOS.md`/`GLOSSARIO.md` quando precisar aprofundar um termo
específico.

## Licença

Ver [LICENSE.md](LICENSE.md) — CC BY-NC-SA 4.0.
