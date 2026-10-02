# Klockkoll – plan

En webbapp för att lära två barn (6 och 8 år) den analoga klockan. Den ska fungera på dator och mobil och gå att installera på hemskärmen. Barnen övar oftast **tillsammans med en förälder**.

## Barnen

| | Kan idag | Startar på |
|---|---|---|
| Sonen, 6 år | Hela timmar | Nivå 3 (halvtimmar). Nivå 1–2 finns som snabb repetition. |
| Dottern, 8 år | Okänt | Ett kort **starttest** placerar henne på rätt nivå. Det ställer 2 frågor per nivå och slutar vid första felet, så det blir högst 12 frågor. |

## Nivåer (progression)

| Nivå | Innehåll | Exempel |
|---|---|---|
| 1 | Urtavlan och visarna | "Tryck på den korta visaren!" |
| 2 | Hela timmar | klockan tre |
| 3 | Halvtimmar. Den svenska fällan: halv fyra = 3:30 | halv fyra |
| 4 | Kvart över / kvart i | kvart i sju |
| 5 | Fem och tio över/i | tio över två |
| 6 | Runt halv: fem i halv, fem över halv, tjugo över/i | fem i halv tre |
| 7 | Digital tid och 24-timmarsklocka | 14:30 = halv tre |
| 8 | Tid som går | "Hur länge är det från kvart över tre till fyra?" |

**Man låser upp nästa nivå** efter 8 rätt av de senaste 10. Varje pass blandar in 2 uppgifter från tidigare nivåer som repetition.

## Pedagogiska principer

1. **Konkret först.** Visarna är kopplade som på en riktig klocka: timvisaren glider med när minutvisaren går. Vid halv fyra syns alltså att timvisaren står *mellan* 3 och 4.
2. **Färgade zoner** som stöd på urtavlan, och de går att slå av:
   - högra halvan heter "över" och vänstra halvan heter "i"
   - från nivå 6 markeras också "i halv" och "över halv" runt sexan
   - minutsiffror (5, 10, 15 …) i en yttre ring
3. **Uppläsning.** Tiden läses upp på svenska (Web Speech, sv-SE). Uppläsningen går att slå av.
4. **Snälla fel.** Vid fel ställer klockan sig på rätt tid med en animation och får en kort förklaring, till exempel "Timvisaren har passerat 3, så det är *halv fyra*." Inga röda kryss och inga poängavdrag.
5. **Korta pass** med 10 uppgifter och en tydlig avslutning som ger belöning.
6. **Föräldrastöd.** Eftersom ni oftast övar tillsammans finns en tipsknapp per uppgift med en fråga att ställa till barnet, till exempel "Var pekar den korta visaren?"
7. **Koppling till vardagen** genom "Min dag".

## Övningar

| Övning | Beskrivning | Nivåer |
|---|---|---|
| **Utforska** | En fri klocka att snurra på, som läser upp tiden. Här visar och förklarar föräldern. | alla |
| **Vad är klockan?** | En klocka visas och barnet väljer bland 3 svar. Felsvaren är vanliga missförstånd, t.ex. "halv tre" när det är halv fyra. | 1–7 |
| **Ställ klockan** | Barnet får en tid och drar visarna rätt. Minutvisaren snäpper i 5-minuterssteg. | 2–8 |
| **Para ihop** | Klockor paras ihop med tid i ord (eller digital tid från nivå 7). | från 3 |
| **Min dag** | Familjens rutiner: "Skolan börjar kvart över åtta. Ställ klockan!" | alla |
| **Hur lång tid?** | Två klockor, och barnet svarar på hur lång tid som gått, eller ställer klockan "om en halvtimme". | 8 |

## Belöningar

- **Stjärnor:** 1–3 per pass beroende på antal rätt.
- **Djurpark:** varje avklarat pass ger ett nytt djur. Den som klarar en ny nivå får ett extra fint djur (guld). Djuren samlas i en egen djurpark per barn.
- Ingen jämförelse mellan syskonen. Var och en ser bara sina egna framsteg.

## Föräldraläge

Föräldraläget är skyddat med en enkel spärr, "håll inne i 1,5 sekunder". Där kan man:
- redigera "Min dag", med händelse, tid och emoji (gemensam för alla barn)
- se framsteg per barn: nivå, träffsäkerhet och vilka tider som är svårast
- flytta ett barn manuellt upp eller ner en nivå
- slå av eller på zoner, uppläsning och tipsknapp

## Teknik

- Vanlig HTML, CSS och JavaScript utan byggsteg (som i Veckopeng).
- Klockan är en SVG med pekar-händelser, så den går att dra med både mus och finger.
- Designen utgår från mobilen: stora tryckytor och en klocka som fyller skärmen.
- PWA med manifest och service worker, så den kan installeras och fungerar offline.
- Profiler, framsteg och "Min dag" sparas i `localStorage` på varje enhet. Framstegen synkas alltså inte mellan dator och telefon i version 1.
- Hosting på GitHub Pages ger en egen länk.

### Filstruktur
```
index.html
style.css
js/
  app.js        – navigering och profiler
  clock.js      – SVG-klockan, dragning och koppling mellan visarna
  timeText.js   – tid till svensk text ("fem i halv tre")
  levels.js     – nivåer och generering av uppgifter
  rewards.js    – stjärnor, djurpark och nivåupplåsning
  storage.js    – localStorage
  speech.js     – uppläsning
manifest.json
sw.js           – offline-cache (höj VERSION vid ändringar)
serve.ps1       – lokal testserver: http://localhost:8080
icons/
```

## Status (2026-09-27)

Version 1 är byggd: alla 8 nivåer, starttest, Utforska, Min dag, Para ihop, djurpark och vuxenläge. Den är testad lokalt i mobil- och datorstorlek.

Kvar:
- **Publicering på GitHub Pages.** Kräver `gh auth login` och ett repo.
- Testa uppläsningen på barnens riktiga enheter, eftersom tillgången på svensk röst varierar.

## Idéer till senare
- Synk av framsteg mellan enheter.
- "Min dag" per barn.
- Ljudeffekter vid rätt svar.
