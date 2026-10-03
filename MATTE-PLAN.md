# Mattekoll – plan

En ny del i Klockkoll för addition och subtraktion. Målgruppen är dottern, 8 år, som tycker att **tvåsiffriga tal** är svåra. Hon övar tillsammans med en förälder. Det finns **ingen tidtagning**.

Mattekoll använder samma profiler, djurpark, vuxenläge och teknik som klockdelen. Startsidan får två val: 🕐 Klocka och ➕ Matte.

## Vad forskningen säger (kort)

- **Hundrarutan** visar tiosystemet. +10 är ett steg ner och +1 ett steg åt höger. Radbytet (19→20) och att "större tal ligger längre ner" kan förvirra.
- **Den tomma tallinjen** gör storlek och hopp tydliga. Bäst fungerar det att visa **samma hopp på rutan och på linjen samtidigt**.
- **Konkret → bild → symbol.** Först tiostavar och entalskuber, sedan rutan eller linjen, sist bara siffror.
- **Strategier före utantillkunskap.** Svårigheter med tvåsiffriga tal beror ofta på att tiotalsövergången (8+5) inte sitter. Starttestet kontrollerar därför grunden först.
- **Lgr22 åk 1–3:** huvudräkning och skriftliga metoder. I praktiken gäller talområdet 0–200.

## Verktyg (visuella modeller)

| Verktyg | Används till |
|---|---|
| **Tioruta** (2×5) | Tiokamrater och att fylla tian |
| **Tiostavar och entalskuber** | Att se 47 som 4 tiotal och 7 ental, och att växla ett tiotal |
| **Hundraruta** (1–100, går att växla till 0–99) | Hopp med 10 och med 1, och mönster |
| **Tom tallinje** | Barnet ritar hopp, t.ex. 38 → +20 → 58 → +5 → 63 |

Varje uppgift kan visas med valfritt verktyg. Föräldern väljer vilket i vuxenläget, eller också väljer barnet själv.

## Nivåer

Nivåerna 1–3 är grunden och ska repeteras snabbt. Fokus ligger på nivåerna 4–7.

| Nivå | Innehåll | Exempel | Huvudverktyg |
|---|---|---|---|
| 1 | Tiokamrater | 7 + _ = 10 | Tioruta |
| 2 | Fylla tian inom 20 | 8 + 5, 13 − 6 | Tioruta → tallinje |
| 3 | Hela tiotal | 30 + 40, 70 − 20 | Tiostavar |
| 4 | ±10 och ±tiotal från vilket tal som helst | 34 + 20, 67 − 30 | **Hundraruta** |
| 5 | Tvåsiffrigt ± ensiffrigt **över** tiotalet | 47 + 8, 52 − 6 | Hundraruta + tallinje |
| 6 | Tvåsiffrigt + tvåsiffrigt | 38 + 25 | Tallinje: "tiotal först, sedan ental" |
| 7 | Tvåsiffrigt − tvåsiffrigt | 52 − 17, 61 − 58 (räkna upp) | Tallinje |
| 8 | Lästal ur vardagen och upp till 200 | "Du har 45 kr och köper för 28 kr …" | Valfritt |

**Man låser upp nästa nivå** efter 8 rätt av de senaste 10, precis som i klockdelen. Varje pass blandar in 2 uppgifter från tidigare nivåer.

## Övningar

| Övning | Beskrivning |
|---|---|
| **Utforska rutan** | En fri hundraruta. Tryck på ett tal och se +1, +10, −1 och −10 lysa upp. Här visar och förklarar föräldern. |
| **Hoppa** | Barnet drar en pjäs på rutan eller ritar hopp på tallinjen för att lösa uppgiften. Appen visar hoppen som ett räknesätt, t.ex. 38 + 20 + 5 = 63. |
| **Vad blir det?** | Välj bland 3 svar. Felsvaren bygger på vanliga misstag, som 47 + 8 = 415 eller 52 − 17 = 45, där det minsta talet har dragits från det största i varje kolumn. |
| **Bygg talet** | Bygg ett tal med tiostavar och kuber, och växla ett tiotal till 10 ental vid subtraktion. |
| **Saknat tal** | 38 + _ = 50 och _ − 20 = 34. Övningen tränar sambandet mellan addition och subtraktion. |
| **Vilken väg?** | Visar två strategier för samma tal, t.ex. 38+25 som "38+20+5" eller "40+23". Barnet berättar för föräldern vilken som är enklast. Det finns inget rätt svar. |

## Pedagogiska principer

1. **Snälla fel.** Appen animerar rätt hopp och ger en kort förklaring, t.ex. "Du gick förbi 50 – där blev det ett nytt tiotal." Inga röda kryss.
2. **Ingen tidtagning** och ingen nedräkning.
3. **Tipsknapp för föräldern** vid varje uppgift, med en fråga att ställa:
   - "Hur många tiotal har 38?"
   - "Vad är nästa hela tiotal?"
   - "Kan du ta tiotalen först?"
4. **Prata strategi.** Efter rätt svar kommer ibland frågan "Hur tänkte du?" Föräldern och barnet pratar och trycker sedan Vidare.
5. **Uppläsning** på svenska ("trettioåtta plus tjugofem"). Den går att slå av.
6. **Korta pass** med 10 uppgifter, stjärnor och ett nytt djur i djurparken.

## Vuxenläge (tillägg)

- Se vilka **uppgiftstyper** som är svårast, t.ex. "subtraktion över tiotal: 4/10 rätt".
- Välja verktyg: hundraruta, tallinje, tiostavar eller blandat.
- Välja hundraruta 1–100 eller 0–99 (samma som i skolan).
- Flytta barnet manuellt mellan nivåer.

## Teknik

Mattekoll följer samma stack som Klockkoll.

| Fil | Innehåll |
|---|---|
| `js/math/levels.js` | Nivåer, uppgiftsgenerering och felsvar som bygger på typiska misstag |
| `js/math/grid.js` | Hundrarutan i SVG med tryck, drag och hopp-animation |
| `js/math/numberline.js` | Den tomma tallinjen med hoppbågar |
| `js/math/blocks.js` | Tiostavar och entalskuber |
| `js/math/numberText.js` | Tal till svensk text för uppläsning |
| `js/app.js` | Ny meny (Klocka / Matte) och egna framsteg per ämne i `storage.js` |
| `sw.js` | Höj VERSION och lägg till de nya filerna |

## Byggordning

1. Hundrarutan och Utforska, för att direkt få något att leka med.
2. Nivåerna 4–5 med Hoppa och Vad blir det?
3. Tallinjen och nivåerna 6–7.
4. Starttestet, som börjar på nivå 2 och ska hitta luckor i grunden.
5. Bygg talet, Saknat tal och Vilken väg?
6. Nivåerna 1–3 och 8, samt statistik i vuxenläget.

## Öppna frågor

- Använder skolan hundraruta 1–100 eller 0–99? Vilket läromedel används (t.ex. Favorit, Koll på matematik, Singma)?
- Vad tycker hon om, för ett eventuellt tema på uppgifterna (djur, pengar, sport …)?
- Är det addition eller subtraktion som är svårast, eller båda?
