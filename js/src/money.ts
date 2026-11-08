import { applyApostrophe, magnitudeToWords, plural, type Gender } from './words.ts';

export interface CurrencyForms {
  one: string;
  few: string;
  many: string;
  gender: Gender;
  fractionOne: string;
  fractionFew: string;
  fractionMany: string;
  fractionGender: Gender;
}

export const CURRENCIES = {
  UAH: { one: 'гривня', few: 'гривні', many: 'гривень', gender: 'feminine', fractionOne: 'копійка', fractionFew: 'копійки', fractionMany: 'копійок', fractionGender: 'feminine' },
  USD: { one: 'долар США', few: 'долари США', many: 'доларів США', gender: 'masculine', fractionOne: 'цент', fractionFew: 'центи', fractionMany: 'центів', fractionGender: 'masculine' },
  EUR: { one: 'євро', few: 'євро', many: 'євро', gender: 'masculine', fractionOne: 'цент', fractionFew: 'центи', fractionMany: 'центів', fractionGender: 'masculine' },
} as const satisfies Record<string, CurrencyForms>;

export interface MoneyWordsOptions {
  /** Код валюти або власні форми. За замовчуванням 'UAH'. */
  currency?: keyof typeof CURRENCIES | CurrencyForms;
  /** Копійки словами («п’ятдесят копійок») замість цифр («50 копійок»). За замовчуванням false. */
  fractionAsWords?: boolean;
  /** Перша літера велика. За замовчуванням true. */
  capitalize?: boolean;
  /** Символ апострофа. За замовчуванням ’ (U+2019). */
  apostrophe?: string;
}

/**
 * Сума прописом: 1250.5 → «Одна тисяча двісті п’ятдесят гривень 50 копійок».
 * Округлює до копійок (0.5 — від нуля) у десятковій арифметиці, тож 1.005 → 1.01.
 * Приймає number, bigint або рядок ("1250.50" чи "1250,50").
 */
export function moneyToWords(amount: number | bigint | string, options: MoneyWordsOptions = {}): string {
  const currency: CurrencyForms =
    typeof options.currency === 'object' ? options.currency : CURRENCIES[options.currency ?? 'UAH'];

  const { negative, units, cents } = parseAmount(amount);

  const unitsWords = magnitudeToWords(units, currency.gender);
  const unitsName = plural(units, currency.one, currency.few, currency.many);
  const fractionText = options.fractionAsWords
    ? magnitudeToWords(BigInt(cents), currency.fractionGender)
    : String(cents).padStart(2, '0');
  const fractionName = plural(cents, currency.fractionOne, currency.fractionFew, currency.fractionMany);

  let result = `${negative ? 'мінус ' : ''}${unitsWords} ${unitsName} ${fractionText} ${fractionName}`;
  result = applyApostrophe(result, options.apostrophe ?? '’');
  if (options.capitalize ?? true) result = result[0].toUpperCase() + result.slice(1);
  return result;
}

function parseAmount(amount: number | bigint | string): { negative: boolean; units: bigint; cents: number } {
  let s: string;
  if (typeof amount === 'bigint') s = amount.toString();
  else if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) throw new RangeError('Сума має бути скінченним числом.');
    s = expandExponent(String(amount));
  } else if (typeof amount === 'string') s = amount.trim().replace(',', '.');
  else throw new TypeError('Очікується число або рядок.');

  const m = /^(-)?(\d+)(?:\.(\d*))?$/.exec(s);
  if (!m) throw new TypeError(`Некоректна сума: "${String(amount)}".`);

  let units = BigInt(m[2]);
  const frac = (m[3] ?? '').padEnd(3, '0');
  let cents = Number(frac.slice(0, 2));
  if (Number(frac[2]) >= 5) cents++;
  if (cents === 100) {
    cents = 0;
    units++;
  }
  const negative = m[1] === '-' && (units > 0n || cents > 0);
  return { negative, units, cents };
}

/** "1e-7" → "0.0000001", "1.5e+21" → "1500000000000000000000". */
function expandExponent(s: string): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/i.exec(s);
  if (!m) return s;
  const [, sign, int, frac = '', expStr] = m;
  const exp = Number(expStr);
  const digits = int + frac;
  const point = int.length + exp;
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return sign + digits + '0'.repeat(point - digits.length);
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}
