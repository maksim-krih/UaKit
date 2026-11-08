# UaKit: сума прописом, ЄДРПОУ, ІПН для .NET і JavaScript

[![NuGet](https://img.shields.io/nuget/v/UaKit?label=NuGet)](https://www.nuget.org/packages/UaKit)
[![npm](https://img.shields.io/npm/v/uakit?label=npm)](https://www.npmjs.com/package/uakit)
[![CI](https://github.com/maksim-krih/UaKit/actions/workflows/ci.yml/badge.svg)](https://github.com/maksim-krih/UaKit/actions/workflows/ci.yml)

**Сума прописом**, число прописом, перевірка **ЄДРПОУ** та **ІПН (РНОКПП)** для C#/.NET і JavaScript/TypeScript, без залежностей.
Спробувати в браузері: **[Сума прописом онлайн](https://maksim-krih.github.io/UaKit/)**.

*Ukrainian amount in words (UAH, USD, EUR), number to words, EDRPOU and RNOKPP (tax ID) validation for .NET and JS.*

Що вміє:

- **ЄДРПОУ**: перевірка контрольної цифри;
- **РНОКПП (ІПН)**: перевірка, дата народження, стать;
- **Сума прописом**: гривні, долари, євро («Одна тисяча двісті п’ятдесят гривень 50 копійок»);
- **Числа словами** з узгодженням роду («одна», «дві», «одне»).

Обидві реалізації проходять один набір тестових векторів ([`shared/test-vectors.json`](shared/test-vectors.json)), тому на однакових даних вони дають однаковий результат.

## .NET

```bash
dotnet add package UaKit
```

Цільові платформи: `netstandard2.0`, `net8.0`, `net10.0`.

```csharp
using UaKit;

Edrpou.IsValid("14360570");                // true
Edrpou.ComputeCheckDigit("1436057");       // 0

Rnokpp.IsValid("3287301233");              // true
if (Rnokpp.TryParse("3287301233", out var info))
{
    // info.BirthDate == 1990-01-01, info.Sex == Sex.Male
}

MoneyToWords.ToWords(1250.50m);
// "Одна тисяча двісті п’ятдесят гривень 50 копійок"

MoneyToWords.ToWords(1250.50m, Currency.Uah, new MoneyWordsOptions { FractionAsWords = true });
// "Одна тисяча двісті п’ятдесят гривень п’ятдесят копійок"

MoneyToWords.ToWords(21m, Currency.Usd);   // "Двадцять один долар США 00 центів"

NumberToWords.ToWords(2, Gender.Feminine); // "дві"
NumberToWords.Plural(5, "гривня", "гривні", "гривень"); // "гривень"
```

## JavaScript / TypeScript

```bash
npm install uakit
```

ESM, типи в комплекті, Node 18+ і браузери.

```ts
import { isValidEdrpou, isValidRnokpp, parseRnokpp, moneyToWords, numberToWords } from 'uakit';

isValidEdrpou('14360570');        // true
isValidRnokpp('3287301233');      // true
parseRnokpp('3287301233');        // { code: '3287301233', birthDate: '1990-01-01', sex: 'male' }

moneyToWords(1250.5);             // "Одна тисяча двісті п’ятдесят гривень 50 копійок"
moneyToWords('1250,50');          // те саме, кома теж підходить
moneyToWords(1.005);              // "Одна гривня 01 копійка": округлення десяткове, без похибки float
moneyToWords(2, { currency: 'EUR' });               // "Два євро 00 центів"
moneyToWords(5, { fractionAsWords: true, apostrophe: "'" }); // "П'ять гривень нуль копійок"

numberToWords(21, { gender: 'feminine' });          // "двадцять одна"
numberToWords(10n ** 18n);                          // "один квінтильйон"
```

## Налаштування суми прописом

| .NET (`MoneyWordsOptions`) | JS | За замовчуванням | Що робить |
|---|---|---|---|
| `FractionAsWords` | `fractionAsWords` | `false` | копійки словами замість цифр |
| `Capitalize` | `capitalize` | `true` | перша літера велика |
| `Apostrophe` | `apostrophe` | `’` (U+2019) | символ апострофа, напр. `'` |
| параметр `currency` | `currency` | гривня | `UAH`, `USD`, `EUR` або власні форми |

Округлення до копійок: 0.5 округлюється від нуля (`0.995 → 1.00`).

## Алгоритми

- **ЄДРПОУ**: ваги `1…7` (для кодів від 30000000 до 60000000 ваги `7,1…6`), сума mod 11. Якщо вийшло 10, ваги збільшуються на 2 і рахунок повторюється; якщо знову 10, контрольна цифра 0.
- **РНОКПП**: ваги `-1,5,7,9,4,6,10,5,7`, контрольна цифра = сума mod 11 mod 10. Перші 5 цифр означають кількість днів від 31.12.1899; 9-та цифра непарна в чоловіків і парна в жінок.

Перевірка контрольної цифри означає лише, що номер правильно сформований, а не те, що такий платник існує в реєстрі.

## Розробка

```bash
cd dotnet && dotnet test
cd js && npm install && npm test
```

Новий випадок спершу додавайте в `shared/test-vectors.json`: його перевірять обидві реалізації.

### Реліз

CI проганяє тести обох пакетів на кожен push і PR. Публікація запускається тегом, з якого береться версія для NuGet і npm:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

Секрети не потрібні: NuGet і npm приймають публікацію з `publish.yml` через Trusted Publishing (OIDC).
