import { moneyToWords, numberToWords, isValidEdrpou, edrpouCheckDigit, parseRnokpp, rnokppCheckDigit } from './uakit/index.js';

const $ = (id) => document.getElementById(id);

function show(out, text, isError = false) {
  out.textContent = text;
  out.classList.toggle('error', isError);
}

function updateAmount() {
  const raw = $('amount').value.replace(/\s/g, '');
  const out = $('amount-out');
  if (!raw) return show(out, 'Введіть суму', true);
  try {
    show(out, moneyToWords(raw, {
      currency: $('currency').value,
      fractionAsWords: $('fractionWords').checked,
      capitalize: $('capitalize').checked,
      apostrophe: $('plainApos').checked ? "'" : '’',
    }));
  } catch {
    show(out, 'Некоректна сума. Приклад: 1250,50', true);
  }
}

function updateNumber() {
  const raw = $('number').value.replace(/\s/g, '');
  const out = $('number-out');
  if (!raw) return show(out, 'Введіть ціле число', true);
  try {
    show(out, numberToWords(raw, { gender: $('gender').value }));
  } catch {
    show(out, 'Потрібне ціле число, наприклад 21 або -5', true);
  }
}

function status(el, kind, html) {
  el.className = 'status' + (kind ? ' ' + kind : '');
  el.innerHTML = html;
}

function updateEdrpou() {
  const v = $('edrpou-in').value.replace(/\s/g, '');
  const out = $('edrpou-out');
  if (!v) return status(out, '', '');
  if (!/^\d+$/.test(v)) return status(out, 'bad', 'Код має складатися лише з цифр.');
  if (v.length !== 8) return status(out, 'bad', `Потрібно 8 цифр, зараз ${v.length}.`);
  if (isValidEdrpou(v)) return status(out, 'ok', '✓ Код ЄДРПОУ правильний.');
  const expected = edrpouCheckDigit(v.slice(0, 7));
  status(out, 'bad', `✗ Неправильна контрольна цифра: для <strong>${v.slice(0, 7)}</strong> остання цифра має бути <strong>${expected}</strong>.`);
}

function age(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const now = new Date();
  let years = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) years--;
  return years;
}

function yearsWord(n) {
  const lastTwo = n % 100, last = n % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'років';
  if (last === 1) return 'рік';
  if (last >= 2 && last <= 4) return 'роки';
  return 'років';
}

function updateIpn() {
  const v = $('ipn-in').value.replace(/\s/g, '');
  const out = $('ipn-out');
  if (!v) return status(out, '', '');
  if (!/^\d+$/.test(v)) return status(out, 'bad', 'РНОКПП має складатися лише з цифр.');
  if (v.length !== 10) return status(out, 'bad', `Потрібно 10 цифр, зараз ${v.length}.`);
  const info = parseRnokpp(v);
  if (!info) {
    const expected = rnokppCheckDigit(v.slice(0, 9));
    return status(out, 'bad', `✗ Неправильна контрольна цифра: остання цифра має бути <strong>${expected}</strong>.`);
  }
  const [y, m, d] = info.birthDate.split('-');
  const a = age(info.birthDate);
  status(out, 'ok',
    `✓ РНОКПП правильний.<br>Дата народження: <strong>${d}.${m}.${y}</strong> (${a} ${yearsWord(a)})<br>Стать: <strong>${info.sex === 'male' ? 'чоловіча' : 'жіноча'}</strong>`);
}

for (const id of ['amount', 'currency', 'fractionWords', 'capitalize', 'plainApos']) $(id).addEventListener('input', updateAmount);
for (const id of ['number', 'gender']) $(id).addEventListener('input', updateNumber);
$('edrpou-in').addEventListener('input', updateEdrpou);
$('ipn-in').addEventListener('input', updateIpn);

for (const btn of document.querySelectorAll('.copy')) {
  btn.addEventListener('click', async () => {
    const text = $(btn.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Скопійовано';
    } catch {
      btn.textContent = 'Не вдалося';
    }
    setTimeout(() => { btn.textContent = 'Копіювати'; }, 1500);
  });
}

// Підставити суму з адреси: ?suma=1250,50
const params = new URLSearchParams(location.search);
if (params.get('suma')) $('amount').value = params.get('suma');

updateAmount();
updateNumber();
