// Com UMA conexão compartilhada, BEGIN simultâneos colidem. Esta fila executa
// uma transação por vez; o ROLLBACK só roda se o BEGIN desta mesma transação deu certo.
// Limites (didático): a fila é global ao módulo, não por conexão; NÃO chame
// transacao() dentro de transacao() (a interna espera a externa e trava para sempre);
// e TODA escrita deve passar pela fila, pois um db.run() solto durante uma
// transação aberta entra nela e é desfeito se ela der ROLLBACK.
let fila = Promise.resolve();

function transacao(db, fn) {
  const rodar = async () => {
    await db.run('BEGIN');
    try {
      const r = await fn(db);
      await db.run('COMMIT');
      return r;
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  };
  const p = fila.then(rodar);
  fila = p.catch(() => {});
  return p;
}

module.exports = { transacao };
