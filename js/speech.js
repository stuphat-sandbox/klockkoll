// Uppläsning på svenska via Web Speech API.

let svVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  svVoice = voices.find(v => v.lang === 'sv-SE' && /natural|online/i.test(v.name))
    || voices.find(v => v.lang === 'sv-SE')
    || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('sv'))
    || null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

function canSpeak() { return 'speechSynthesis' in window; }

function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'sv-SE';
  if (svVoice) u.voice = svVoice;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}
