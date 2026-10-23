/** Aggiunge o toglie un id da una lista, senza duplicati. */
export function toggleId(list: readonly string[], id: string, on: boolean): string[] {
  const rest = list.filter((x) => x !== id);
  return on ? [...rest, id] : rest;
}
