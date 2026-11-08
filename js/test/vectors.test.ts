import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isValidEdrpou, edrpouCheckDigit, isValidRnokpp, parseRnokpp,
  numberToWords, moneyToWords, type Gender,
} from '../src/index.ts';

const vectors = JSON.parse(readFileSync(new URL('../../shared/test-vectors.json', import.meta.url), 'utf8'));

test('EDRPOU: valid codes', () => {
  for (const code of vectors.edrpou.valid) {
    assert.equal(isValidEdrpou(code), true, code);
    assert.equal(edrpouCheckDigit(code.trim().slice(0, 7)), Number(code.trim()[7]), code);
  }
});

test('EDRPOU: invalid codes', () => {
  for (const code of vectors.edrpou.invalid) assert.equal(isValidEdrpou(code), false, code);
  assert.equal(isValidEdrpou(14360570), false);
  assert.equal(isValidEdrpou(null), false);
});

test('RNOKPP: parse', () => {
  for (const v of vectors.rnokpp.parse) {
    assert.equal(isValidRnokpp(v.code), true, v.code);
    assert.deepEqual(parseRnokpp(v.code), { code: v.code, birthDate: v.birthDate, sex: v.sex });
  }
});

test('RNOKPP: invalid', () => {
  for (const code of vectors.rnokpp.invalid) assert.equal(parseRnokpp(code), null, code);
});

test('numberToWords', () => {
  for (const v of vectors.numberToWords) {
    assert.equal(numberToWords(v.n, { gender: v.gender as Gender }), v.words, v.n);
  }
  assert.equal(numberToWords(21, { gender: 'feminine' }), 'двадцять одна');
  assert.equal(numberToWords(-9223372036854775808n).startsWith('мінус дев’ять квінтильйонів'), true);
  assert.throws(() => numberToWords(1.5));
  assert.throws(() => numberToWords(2 ** 60));
});

test('moneyToWords', () => {
  for (const v of vectors.moneyToWords) {
    const { amount, words, ...options } = v;
    assert.equal(moneyToWords(amount, options), words, amount);
  }
});

test('moneyToWords: number and other inputs', () => {
  assert.equal(moneyToWords(1250.5), 'Одна тисяча двісті п’ятдесят гривень 50 копійок');
  assert.equal(moneyToWords(1.005), 'Одна гривня 01 копійка');
  assert.equal(moneyToWords('1250,50'), 'Одна тисяча двісті п’ятдесят гривень 50 копійок');
  assert.equal(moneyToWords(1e-7), 'Нуль гривень 00 копійок');
  assert.equal(moneyToWords(-0.001), 'Нуль гривень 00 копійок');
  assert.equal(moneyToWords(5n), 'П’ять гривень 00 копійок');
  assert.throws(() => moneyToWords(NaN));
  assert.throws(() => moneyToWords('12abc'));
});
