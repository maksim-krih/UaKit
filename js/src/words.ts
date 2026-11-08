export type Gender = 'masculine' | 'feminine' | 'neuter';

const ONES = ['', 'один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"];
const TEENS = [
  'десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять',
  "п'ятнадцять", 'шістнадцять', 'сімнадцять', 'вісімнадцять', "дев'ятнадцять",
];
const TENS = ['', '', 'двадцять', 'тридцять', 'сорок', "п'ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев'яносто"];
const HUNDREDS = ['', 'сто', 'двісті', 'триста', 'чотириста', "п'ятсот", 'шістсот', 'сімсот', 'вісімсот', "дев'ятсот"];

const SCALES: [string, string, string, Gender][] = [
  ['', '', '', 'masculine'],
  ['тисяча', 'тисячі', 'тисяч', 'feminine'],
  ['мільйон', 'мільйони', 'мільйонів', 'masculine'],
  ['мільярд', 'мільярди', 'мільярдів', 'masculine'],
  ['трильйон', 'трильйони', 'трильйонів', 'masculine'],
  ['квадрильйон', 'квадрильйони', 'квадрильйонів', 'masculine'],
  ['квінтильйон', 'квінтильйони', 'квінтильйонів', 'masculine'],
  ['секстильйон', 'секстильйони', 'секстильйонів', 'masculine'],
  ['септильйон', 'септильйони', 'септильйонів', 'masculine'],
];

export interface NumberWordsOptions {
  /** Рід іменника, з яким узгоджується число. За замовчуванням 'masculine'. */
  gender?: Gender;
  /** Символ апострофа. За замовчуванням ’ (U+2019). */
  apostrophe?: string;
}

/**
 * Записує ціле число словами: 21 → «двадцять один», 2 (feminine) → «дві».
 * Приймає number (ціле, безпечне), bigint або рядок з цілим числом.
 */
export function numberToWords(n: number | bigint | string, options: NumberWordsOptions = {}): string {
  const value = toBigInt(n);
  const negative = value < 0n;
  let words = magnitudeToWords(negative ? -value : value, options.gender ?? 'masculine');
  if (negative) words = 'мінус ' + words;
  return applyApostrophe(words, options.apostrophe ?? '’');
}

/**
 * Обирає форму іменника за числом: 1 → one, 2–4 → few, інакше many
 * (11–14 → many).
 */
export function plural(n: number | bigint, one: string, few: string, many: string): string {
  const v = BigInt(n) < 0n ? -BigInt(n) : BigInt(n);
  const lastTwo = v % 100n;
  if (lastTwo >= 11n && lastTwo <= 14n) return many;
  const last = v % 10n;
  if (last === 1n) return one;
  if (last >= 2n && last <= 4n) return few;
  return many;
}

/** @internal */
export function magnitudeToWords(value: bigint, gender: Gender): string {
  if (value === 0n) return 'нуль';

  const groups: number[] = [];
  while (value > 0n) {
    groups.push(Number(value % 1000n));
    value /= 1000n;
  }
  if (groups.length > SCALES.length) throw new RangeError('Число завелике.');

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;
    const [one, few, many, scaleGender] = SCALES[i];
    appendGroup(words, group, i === 0 ? gender : scaleGender);
    if (i > 0) words.push(plural(group, one, few, many));
  }
  return words.join(' ');
}

/** @internal */
export function applyApostrophe(s: string, apostrophe: string): string {
  return apostrophe === "'" ? s : s.split("'").join(apostrophe);
}

function appendGroup(words: string[], group: number, gender: Gender): void {
  push(words, HUNDREDS[Math.floor(group / 100)]);
  const rest = group % 100;
  if (rest >= 10 && rest < 20) {
    push(words, TEENS[rest - 10]);
    return;
  }
  push(words, TENS[Math.floor(rest / 10)]);
  const unit = rest % 10;
  if (unit === 1) push(words, gender === 'feminine' ? 'одна' : gender === 'neuter' ? 'одне' : 'один');
  else if (unit === 2) push(words, gender === 'feminine' ? 'дві' : 'два');
  else push(words, ONES[unit]);
}

function push(words: string[], w: string): void {
  if (w) words.push(w);
}

function toBigInt(n: number | bigint | string): bigint {
  if (typeof n === 'bigint') return n;
  if (typeof n === 'number') {
    if (!Number.isSafeInteger(n)) throw new RangeError('Потрібне ціле число в безпечному діапазоні; для більших використовуйте bigint або рядок.');
    return BigInt(n);
  }
  if (typeof n === 'string' && /^\s*-?\d+\s*$/.test(n)) return BigInt(n.trim());
  throw new TypeError('Очікується ціле число.');
}
