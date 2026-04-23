# Formato file KLSGP

Documentazione di riferimento per i file esportati dal gestionale KLSGP e caricati nel dashboard.

---

## Tipi di file supportati

| Tipo | Estensione | Note |
|------|-----------|-------|
| Export KLSGP | `.xls` / `.xlsx` | Foglio `GridSelPreventivi` |
| Database cumulativo | `.json` | Generato da "Salva database" nell'app |

---

## Struttura del file Excel

### Foglio
Il file contiene sempre un unico foglio chiamato **`GridSelPreventivi`**.

### Intestazioni
Le intestazioni di colonna possono contenere ritorni a capo (`\r\n` nei `.xls`, `\r\r\n` nei `.xlsx`). L'import normalizza tutto con `\s+ → ' '` prima di fare il lookup.

---

## Colonne

### Importate e mappate

| Colonna nel file | Campo app (`Pratica`) | Tipo | Note |
|---|---|---|---|
| `Nr Pratica` | `Nr Pratica` | string | Identificativo pratica (es. `2025146414`) |
| `Anno` | `Anno` | number | **Anno solare di fine esercizio** — `2025` = esercizio `2024/2025`. Usato per derivare `Esercizio`. |
| `Data Inserimento` | `Data Inserimento` | string ISO | Serial Excel → `YYYY-MM-DD` |
| `Data Scadenza` | `Data Scadenza` | string ISO | Serial Excel → `YYYY-MM-DD`, spesso vuoto |
| `Partenza` | `Partenza` | string ISO | Serial Excel → `YYYY-MM-DD` |
| `Itinerario` | `Itinerario` | string | Descrizione testuale del viaggio |
| `Stato` | `Stato` | string | Vedi §Stati sotto |
| `Gestore Pratica` | `Gestore Pratica` | string | |
| `Travel Consultant` | `Travel Consultant` | string | |
| `Classificazione` | `Classificazione` | string | `Preventivo` / `Pratica` / ecc. |
| `Canale di vendita` | `Canale di vendita` | string | Es. `Agenzia di Viaggio`, `Diretto` |
| `Id Agenzia` | `Id Agenzia` | number | ID numerico nel KLSGP |
| `Agenzia Viaggi` | `Agenzia Viaggi` | string | Ragione sociale agenzia |
| `Id Filiale` | `Id Filiale` | number | ID numerico filiale |
| `Filiale` | `Filiale` | string | Ragione sociale filiale (spesso coincide con agenzia) |
| `Intestatario` | `Intestatario` | string | Holder della pratica |
| `Pax` | `Intestatario Cliente` | string | Nome passeggero/cliente (alias di Intestatario nella maggior parte dei casi) |
| `Intestatario Cliente` | `Intestatario Cliente` | string | Stesso campo, usato in alcune versioni |
| `Area geografica` | `Area geografica` | string | Es. `AFRICA - AUSTRALE E DELL'EST` |
| `Prezzo` | `Prezzo` | number | Prezzo di vendita (€) |
| `Incasso` | `Incasso` | number | Importo già incassato (€) |
| `Da Incassare` | `Da Incassare` | number | Differenza `Prezzo - Incasso` |
| `Macro-categoria` | `Macro-categoria` | string | Es. `Viaggi Individuali`, `Gruppi Chiusi` |
| `Continenti` | `Continenti` | string | Spesso vuoto |
| `Nazioni` | `Nazioni` | string | Può essere multiplo: `Vietnam, Cambogia` |
| `Tour Operator` | `Tour Operator` | string | Spesso vuoto |
| `Data Evasione` | `Data Evasione` | string ISO | Serial Excel → `YYYY-MM-DD` |
| `UltimoIncasso` | `Ultimo Incasso` | string ISO | Data dell'ultimo incasso ricevuto |

### Escluse (non importate)

| Colonna | Motivo |
|---|---|
| `Note` | Note interne operative |
| `Stato Voli` | Campo operativo voli, sempre vuoto |
| `Visibile` | Flag sistema (`Y`/`N`) |
| `Tipo Pratica` | Sempre `VENDITA`, non informativo |
| `Conferma Inviata` | Flag operativo |
| `Contatto` | Email cliente (PII) |
| `Adeg. Valutario` | Flag aggiustamento valutario (`Y`/`N`) |
| `Data scadenza sconto` | Data operativa sconto, raramente compilata |

---

## Colonna derivata: `Esercizio`

**Non è presente nel file.** Viene calcolata dall'app con questa priorità:

1. **Colonna `Anno`** (fonte più affidabile): `Anno = N` → esercizio `N-1/N`
   - Es. `Anno = 2025` → `2024/2025`
2. **Fallback `Data Inserimento`**: regola sett–apr:
   - Mesi 9–12 (settembre–dicembre) → `ANNO/ANNO+1`
   - Mesi 1–4 (gennaio–aprile) → `ANNO-1/ANNO`
   - Mesi 5–8 (maggio–agosto): non rientrano nell'esercizio standard, ignorati
3. **Ultimo fallback**: anni nel nome file (`KLSGP ... 2024 ... 2025.xls`)

### Definizione esercizio
Un esercizio va dal **1° settembre** dell'anno N al **30 aprile** dell'anno N+1.
- Esercizio `2024/2025`: 01/09/2024 → 30/04/2025
- Esercizio `2025/2026`: 01/09/2025 → 30/04/2026

---

## Stati (`Stato`)

Categorizzazione usata nel dashboard:

| Valore | Badge | Categoria |
|---|---|---|
| `Confermata definitiva` | 🟢 success | Confermata |
| `Confermata con servizi su richiesta` | 🟢 success | Confermata |
| `Scaduta/Cancellata` | 🔴 danger | **Anomalia** |
| `Annullata con penali` | 🔴 danger | **Anomalia** |
| `Annullata senza penali` | 🔴 danger | **Anomalia** |
| `Non accettato` | ⚫ neutral | **Anomalia** |
| Tutti gli altri | 🟡 warning | In lavorazione |

---

## File JSON cumulativo

Il JSON salvato dall'app è un array piatto di oggetti `Pratica[]` con la stessa struttura sopra, già convertiti (date ISO, Esercizio valorizzato). Può essere ricaricato direttamente. È il modo consigliato per caricare più esercizi insieme senza ri-importare tutti i file Excel.

---

## Note tecniche

- I serial date Excel vengono convertiti con epoca `1899-12-30` (standard XLSX)
- Il dedup avviene su hash JSON di tutti i campi: stessa riga caricata due volte viene deduplicata
- La colonna `Pax` è un alias di `Intestatario Cliente`; se entrambe sono presenti nel file vince l'ultima
