/** Numero casuale in [0, 1) da crypto, non prevedibile come Math.random. */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/** Indice estratto in proporzione ai pesi (non serve che sommino a 1). */
export function pickWeighted(weights: readonly number[], rand: () => number = secureRandom): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

export function uid(): string {
  return crypto.randomUUID();
}
