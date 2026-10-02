// Tid -> svensk text ("fem i halv tre") och pedagogiska förklaringar.

const HOUR_WORDS = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
const NUM_WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio',
  'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton', 'tjugo'];

function h12(h) { return ((h % 12) + 12) % 12 || 12; }
function hourWord(h) { return HOUR_WORDS[h12(h)]; }
function nextHourWord(h) { return HOUR_WORDS[h12(h + 1)]; }

function minuteWord(n) {
  return n === 1 ? 'en minut' : NUM_WORDS[n] + ' minuter';
}

// Returnerar tiden i ord, t.ex. "halv fyra". Utan "klockan är".
function timeToWords(h, m) {
  const cur = hourWord(h);
  const nxt = nextHourWord(h);
  switch (m) {
    case 0: return cur;
    case 5: return 'fem över ' + cur;
    case 10: return 'tio över ' + cur;
    case 15: return 'kvart över ' + cur;
    case 20: return 'tjugo över ' + cur;
    case 25: return 'fem i halv ' + nxt;
    case 30: return 'halv ' + nxt;
    case 35: return 'fem över halv ' + nxt;
    case 40: return 'tjugo i ' + nxt;
    case 45: return 'kvart i ' + nxt;
    case 50: return 'tio i ' + nxt;
    case 55: return 'fem i ' + nxt;
  }
  if (m < 20) return minuteWord(m) + ' över ' + cur;
  if (m < 30) return minuteWord(30 - m) + ' i halv ' + nxt;
  if (m <= 40) return minuteWord(m - 30) + ' över halv ' + nxt;
  return minuteWord(60 - m) + ' i ' + nxt;
}

// Alternativa sätt att säga samma tid (som också är rätt).
function altWords(h, m) {
  if (m === 20) return 'tio i halv ' + nextHourWord(h);
  if (m === 40) return 'tio över halv ' + nextHourWord(h);
  return null;
}

// Som timeToWords, men "klockan sex" för jämna timmar (låter naturligare i frågor och svar).
function timePhrase(h, m) {
  return m === 0 ? 'klockan ' + hourWord(h) : timeToWords(h, m);
}

function sentence(h, m) {
  const w = timeToWords(h, m);
  return 'Klockan är ' + w + '.';
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function pad(n) { return String(n).padStart(2, '0'); }
function digital12(h, m) { return h12(h) + ':' + pad(m); }
function digital24(h, m) { return pad(((h % 24) + 24) % 24) + ':' + pad(m); }

function partOfDay(h) {
  h = ((h % 24) + 24) % 24;
  if (h < 5) return 'på natten';
  if (h < 10) return 'på morgonen';
  if (h < 12) return 'på förmiddagen';
  if (h < 18) return 'på eftermiddagen';
  if (h < 22) return 'på kvällen';
  return 'på natten';
}

function durationWords(min) {
  const map = { 5: 'fem minuter', 10: 'tio minuter', 15: 'en kvart', 20: 'tjugo minuter', 30: 'en halvtimme',
    45: 'tre kvart', 60: 'en timme', 90: 'en och en halv timme', 120: 'två timmar', 180: 'tre timmar' };
  return map[min] || (min + ' minuter');
}

// Pedagogisk förklaring av varför tiden heter som den heter.
function explain(h, m) {
  const cur = hourWord(h);
  const nxt = nextHourWord(h);
  const words = timeToWords(h, m);
  const pos = m === 0 ? 12 : m / 5;
  if (m === 0) {
    return `Den långa visaren pekar rakt upp på 12 – då är det jämnt. Den korta visaren pekar på ${h12(h)}. Klockan är ${words}.`;
  }
  if (m === 30) {
    return `Den långa visaren pekar rakt ner på 6 – det är halv. Den korta visaren har gått förbi ${h12(h)} och är halvvägs till ${h12(h + 1)}. Därför heter det halv ${nxt}.`;
  }
  if (m === 15) {
    return `Den långa visaren pekar på 3 – det är kvart över. Den korta visaren har precis gått förbi ${h12(h)}. Det blir kvart över ${cur}.`;
  }
  if (m === 45) {
    return `Den långa visaren pekar på 9 – det är kvart i. Den korta visaren är nästan framme vid ${h12(h + 1)}. Det blir kvart i ${nxt}.`;
  }
  if (m % 5 !== 0) {
    return `Klockan är ${words}.`;
  }
  if (m < 25) {
    return `Den långa visaren pekar på ${pos} – det är ${m} minuter. Den är på över-sidan, och den korta visaren har gått förbi ${h12(h)}. Det blir ${words}.`;
  }
  if (m === 25) {
    return `Den långa visaren pekar på 5. Det är fem minuter kvar tills den når 6 (halv). Därför heter det fem i halv ${nxt}.`;
  }
  if (m === 35) {
    return `Den långa visaren pekar på 7. Den har gått fem minuter förbi 6 (halv). Därför heter det fem över halv ${nxt}.`;
  }
  return `Den långa visaren pekar på ${pos}. Den är på i-sidan – det är ${60 - m} minuter kvar tills den når 12. Den korta visaren är nästan framme vid ${h12(h + 1)}. Det blir ${words}.`;
}

function partOfDayNoun(h) {
  return partOfDay(h).replace('på ', '').replace(/en$/, '');
}
