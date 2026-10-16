const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { igualSeguro } = require('../src/comparar');
const { transacao } = require('../src/transacao');

test('CONCEITOS §13: timingSafeEqual cru quebra com tamanhos diferentes (reprodução)', () => {
  assert.throws(
    () => crypto.timingSafeEqual(Buffer.from('abc'), Buffer.from('abcd')),
    { code: 'ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH' }
  );
});

test('CONCEITOS §13: igualSeguro não lança e compara corretamente', () => {
  assert.strictEqual(igualSeguro('1234', '1234'), true);
  assert.strictEqual(igualSeguro('1234', '12345'), false);
  assert.strictEqual(igualSeguro('', '1234'), false);
  assert.strictEqual(igualSeguro(undefined, '1234'), false);
  assert.strictEqual(igualSeguro({}, '1234'), false);
});

async function banco() {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.run('CREATE TABLE livros (id INTEGER PRIMARY KEY, nome TEXT)');
  return db;
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

test('CONCEITOS §11: BEGIN concorrente na mesma conexão corrompe a transação alheia (reprodução)', async () => {
  const db = await banco();
  const ingenua = async (id, ms) => {
    try {
      await db.run('BEGIN');
      await db.run('INSERT INTO livros VALUES (?, ?)', id, 'x');
      await espera(ms);
      await db.run('COMMIT');
      return 'ok';
    } catch (e) {
      try { await db.run('ROLLBACK'); } catch {}
      return 'erro';
    }
  };
  const res = await Promise.all([ingenua(1, 50), ingenua(2, 10)]);
  assert.deepStrictEqual(res, ['erro', 'erro']);
  assert.deepStrictEqual(await db.all('SELECT id FROM livros'), []);
  await db.close();
});

test('CONCEITOS §11: fila de transações permite as duas e faz rollback só da que falha', async () => {
  const db = await banco();
  const grava = (id, ms) => transacao(db, async (d) => {
    await d.run('INSERT INTO livros VALUES (?, ?)', id, 'x');
    await espera(ms);
  });
  await Promise.all([grava(1, 50), grava(2, 10)]);
  assert.deepStrictEqual((await db.all('SELECT id FROM livros ORDER BY id')).map((r) => r.id), [1, 2]);

  await assert.rejects(
    transacao(db, async (d) => { await d.run('INSERT INTO livros VALUES (3, ?)', 'x'); throw new Error('falha'); }),
    /falha/
  );
  await grava(4, 1); // a fila continua funcionando após erro
  assert.deepStrictEqual((await db.all('SELECT id FROM livros ORDER BY id')).map((r) => r.id), [1, 2, 4]);
  await db.close();
});
