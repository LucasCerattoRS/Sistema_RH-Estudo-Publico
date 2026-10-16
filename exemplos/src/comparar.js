const crypto = require('crypto');

// timingSafeEqual lança RangeError se os buffers têm tamanhos diferentes,
// e TypeError se a entrada não é string/Buffer. Aplicar SHA-256 antes iguala
// o tamanho e evita que uma senha "de outro tamanho" derrube o login com 500.
function igualSeguro(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { igualSeguro };
