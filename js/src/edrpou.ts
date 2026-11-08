import { isDigits } from './digits.ts';

const WEIGHTS_LOW = [1, 2, 3, 4, 5, 6, 7];
const WEIGHTS_MID = [7, 1, 2, 3, 4, 5, 6];

/**
 * Перевіряє код ЄДРПОУ: рівно 8 цифр і правильна контрольна цифра.
 * Пробіли на початку і в кінці ігноруються.
 */
export function isValidEdrpou(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  const c = code.trim();
  if (c.length !== 8 || !isDigits(c)) return false;

  const n = Number(c);
  return checkDigit(c, n >= 30_000_000 && n <= 60_000_000) === Number(c[7]);
}

/** Обчислює контрольну (8-му) цифру для рівно 7 перших цифр коду ЄДРПОУ. */
export function edrpouCheckDigit(first7: string): number {
  if (typeof first7 !== 'string' || first7.length !== 7 || !isDigits(first7)) {
    throw new TypeError('Потрібно рівно 7 цифр.');
  }
  const prefix = Number(first7);
  return checkDigit(first7, prefix >= 3_000_000 && prefix < 6_000_000);
}

function checkDigit(code: string, useMid: boolean): number {
  const weights = useMid ? WEIGHTS_MID : WEIGHTS_LOW;
  let control = weightedSum(code, weights, 0) % 11;
  if (control === 10) {
    control = weightedSum(code, weights, 2) % 11;
    if (control === 10) control = 0;
  }
  return control;
}

function weightedSum(code: string, weights: number[], shift: number): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += Number(code[i]) * (weights[i] + shift);
  return sum;
}
