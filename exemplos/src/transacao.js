// Com UMA conexão compartilhada, BEGIN simultâneos colidem. Esta fila executa
// uma transação por vez; o ROLLBACK só roda se o BEGIN desta mesma transação deu certo.
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
