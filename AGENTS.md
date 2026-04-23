# AGENTS.md

## Scopo del progetto

Dashboard React per l'analisi operativa e commerciale delle pratiche KEL12 / KLSGP.

L'app permette di:

- importare export Excel KLSGP (`.xls`, `.xlsx`) e database cumulativi JSON
- normalizzare e persistere i dati lato client
- filtrare le pratiche per esercizio, stato, classificazione, canale e destinazione
- visualizzare KPI, grafici, anomalie, dettaglio pratiche e confronto year-over-year
- esportare o riutilizzare dataset consolidati tra più import

Riferimento dominio dati: `docs/klsgp-format.md`

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Zustand con persistenza locale
- Recharts per i grafici
- Radix UI per componenti base
- `xlsx` per import Excel
- `jspdf` e `html2canvas` per export/reportistica

## Comandi principali

- installazione: `npm install`
- sviluppo locale: `npm run dev`
- build produzione: `npm run build`
- lint: `npm run lint`
- preview build: `npm run preview`

## Struttura del repository

- `src/App.tsx`: shell principale del dashboard e tab navigation
- `src/components/`: componenti UI e feature del dashboard
- `src/components/charts/`: grafici e chart card
- `src/components/ui/`: primitive UI riusabili
- `src/lib/store.ts`: stato globale Zustand e filtri
- `src/lib/import.ts`: parsing, mapping e normalizzazione dati in ingresso
- `src/lib/types.ts`: tipi dominio e filtri
- `docs/`: documentazione di formato e dominio dati
- `.github/workflows/deploy.yml`: build e deploy su GitHub Pages

## Convenzioni operative

- mantenere TypeScript stretto e preferire tipi espliciti sul dominio (`Pratica`, `Filters`)
- non introdurre logica dominio dentro i componenti di presentazione se può stare in `src/lib/`
- usare `useStore()` come singola fonte di verità per dataset caricato, filtri e viste derivate
- preservare naming coerente con il dominio KLSGP anche quando i campi hanno spazi o nomi legacy
- evitare refactor gratuiti su UI e naming se non servono al task
- quando si tocca l'import, verificare compatibilità con `docs/klsgp-format.md`
- quando si toccano filtri o KPI, controllare anche impatti su grafici, tabella dettaglio e confronto YoY
- non committare output generati come `dist/` salvo richiesta esplicita

## Linee guida per modifiche

1. Capire se il task impatta import dati, store o sola presentazione.
2. Limitare le modifiche al layer corretto:
   - parsing/mapping in `src/lib/import.ts`
   - stato e filtri in `src/lib/store.ts`
   - rendering in `src/components/` e `src/App.tsx`
3. Se si aggiunge un nuovo campo dati:
   - aggiornare i tipi in `src/lib/types.ts`
   - aggiornare import e normalizzazione
   - aggiornare filtri/KPI/grafici solo se realmente necessario
4. Se si aggiunge una nuova vista:
   - mantenerla coerente con il pattern tab esistente
   - privilegiare componenti piccoli e composti

## Checklist finale

Prima di chiudere una modifica:

- eseguire `npm run lint`
- eseguire `npm run build`
- verificare che l'import di file Excel e JSON continui a funzionare
- verificare che il dashboard si apra correttamente anche con store vuoto
- controllare regressioni su tab `Overview`, `Anomalie`, `Dettaglio pratiche` e `Confronto YoY`

## Note

- Il `README.md` attuale è ancora quello del template Vite e non descrive il progetto reale.
- Il deploy automatico avviene su push a `main` tramite GitHub Pages.
