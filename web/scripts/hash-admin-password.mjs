import { pbkdf2Sync, randomBytes } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  // eslint-disable-next-line no-console
  console.error('Uso: node scripts/hash-admin-password.mjs "SENHA_FORTE"');
  process.exit(1);
}

const iterations = 600_000;
const salt = randomBytes(16);
const keylen = 32;
const digest = 'sha256';

const hash = pbkdf2Sync(password, salt, iterations, keylen, digest);

const encoded = [
  'pbkdf2_sha256',
  String(iterations),
  salt.toString('base64'),
  hash.toString('base64'),
].join('$');

// eslint-disable-next-line no-console
console.log(encoded);

