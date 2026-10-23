# iPagato ☕

Chi offre il caffè oggi? Una ruota che gira a caso, ma **truccata verso l'equità**: nel tempo ognuno paga in proporzione a quanto ha consumato.

- **Wizard** al primo avvio: nomi del gruppo e regole.
- **Oggi**: chi c'è → chi ha la macchina / chi prende un extra → **gira la ruota**. Gli spicchi sono grandi quanto la probabilità di ognuno.
- **Extra modificabili dopo** l'estrazione (dal risultato o dallo **Storico**, dove si corregge anche chi c'era e chi ha pagato).
- **Saldi**: presenze, volte pagato, caffè offerti, extra, macchina, saldo.
- **Regole**: amici, parametri dell'algoritmo, backup JSON.

### Interfaccia

Pensata come un'app iOS (Human Interface Guidelines, Liquid Glass):
- **tema chiaro e scuro** automatici, numeri in SF Pro Rounded, colori di sistema Apple ad alto contrasto;
- **ruota** con pioli che ticchettano (suono + vibrazione, disattivabili), si lancia anche **trascinandola col dito**; all'arrivo coriandoli e chicchi di caffè, lo spicchio vincente resta acceso;
- pulsante principale sempre **a portata di pollice** sopra la tab bar;
- liste raggruppate come Impostazioni, interruttori iOS, **fogli che si chiudono trascinandoli giù**;
- niente popup del browser: alert iOS per le azioni irreversibili, **toast con "Annulla"** per le eliminazioni;
- nello Storico **scorri a sinistra per eliminare**; **Condividi** il risultato nel gruppo WhatsApp;
- rispetta "Riduci movimento" e "Riduci trasparenza".

I dati restano **solo su questo telefono** (localStorage). Per cambiare telefono: Regole → Esporta / Importa.

## L'algoritmo (`lib/fairness.ts`)

Tutto si misura in caffè.

1. **Libro mastro**, ricalcolato sempre dallo storico (per questo modificare un extra dopo aggiorna tutto):
   - ogni presente consuma `1 + x` (x = valore dell'extra, se l'ha preso; default 1);
   - chi paga versa la somma dei consumi dei presenti;
   - chi guida guadagna `k` caffè di credito (default 1), pagati in parti uguali dai passeggeri;
   - **saldo = consumato − versato ± macchina**. Positivo = deve offrire. La somma dei saldi è sempre 0.
2. **Punteggio di oggi** = saldo + extra di oggi ± macchina di oggi.
3. **Probabilità** = softmax: `p_i = e^(β·punteggio_i) / Σ e^(β·punteggio_j)`.
   Ogni caffè di debito moltiplica le chance di `e^β`:

   | Equità | β | ×caffè |
   | --- | --- | --- |
   | Fortuna | 0 | ×1 (lotteria pura) |
   | Bassa | 0,4 | ×1,5 |
   | Media | 0,8 | ×2,2 |
   | Alta | 1,5 | ×4,5 |

   Nessuno arriva mai allo 0%. Chi viene di rado consuma poco e quindi paga di rado: la presenza è già nel saldo.
4. **Estrazione** con `crypto.getRandomValues`, pesata sulle probabilità; la ruota atterra in un punto casuale dello spicchio vincente. L'estrazione si salva appena parte la ruota.

Esempio: 5 amici, ieri A ha pagato per tutti → saldo A −4, altri +1 → oggi A ha ~0,5%, gli altri ~25%.

Simulazione su 800 pranzi con presenze, extra e autisti casuali (`tests/fairness.test.ts`): lo scarto massimo dal pari è ~270 caffè con la sola fortuna, ~7 con equità media.

## Sviluppo

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # algoritmo, simulazione, geometria della ruota
npm run lint
npm run build   # sito statico in out/
```

Deploy: qualunque hosting statico (Vercel la rileva come app Next.js). Su iPhone: Safari → Condividi → **Aggiungi a Home**.
