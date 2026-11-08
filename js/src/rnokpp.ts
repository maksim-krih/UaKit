import { isDigits } from './digits.ts';

const WEIGHTS = [-1, 5, 7, 9, 4, 6, 10, 5, 7];
const EPOCH_UTC = Date.UTC(1899, 11, 31);
const DAY_MS = 86_400_000;

export type Sex = 'male' | 'female';

export interface RnokppInfo {
  /** Нормалізований 10-значний код. */
  code: string;
  /** Дата народження у форматі YYYY-MM-DD. */
  birthDate: string;
  /** Стать (9-та цифра: непарна — чоловіча, парна — жіноча). */
  sex: Sex;
}

/**
 * Перевіряє РНОКПП (ІПН): рівно 10 цифр і правильна контрольна цифра.
 * Пробіли на початку і в кінці ігноруються.
 */
export function isValidRnokpp(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  const c = code.trim();
  return c.length === 10 && isDigits(c) && rnokppCheckDigit(c.slice(0, 9)) === Number(c[9]);
}

/**
 * Перевіряє РНОКПП і повертає дату народження та стать,
 * або null, якщо код недійсний чи перші 5 цифр — нулі.
 */
export function parseRnokpp(code: unknown): RnokppInfo | null {
  if (!isValidRnokpp(code)) return null;
  const c = (code as string).trim();
  const days = Number(c.slice(0, 5));
  if (days === 0) return null;

  const birthDate = new Date(EPOCH_UTC + days * DAY_MS).toISOString().slice(0, 10);
  return { code: c, birthDate, sex: Number(c[8]) % 2 === 1 ? 'male' : 'female' };
}

/** Обчислює контрольну (10-ту) цифру для рівно 9 перших цифр РНОКПП. */
export function rnokppCheckDigit(first9: string): number {
  if (typeof first9 !== 'string' || first9.length !== 9 || !isDigits(first9)) {
    throw new TypeError('Потрібно рівно 9 цифр.');
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(first9[i]) * WEIGHTS[i];
  return (((sum % 11) + 11) % 11) % 10;
}
