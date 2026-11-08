namespace UaKit;

/// <summary>Валюта: форми назв основної та дробової одиниці і їхній рід.</summary>
public sealed class Currency
{
    /// <summary>Створює опис валюти.</summary>
    public Currency(
        string one, string few, string many, Gender gender,
        string fractionOne, string fractionFew, string fractionMany, Gender fractionGender)
    {
        One = one; Few = few; Many = many; Gender = gender;
        FractionOne = fractionOne; FractionFew = fractionFew; FractionMany = fractionMany; FractionGender = fractionGender;
    }

    /// <summary>Гривня / копійка.</summary>
    public static Currency Uah { get; } =
        new("гривня", "гривні", "гривень", Gender.Feminine, "копійка", "копійки", "копійок", Gender.Feminine);

    /// <summary>Долар США / цент.</summary>
    public static Currency Usd { get; } =
        new("долар США", "долари США", "доларів США", Gender.Masculine, "цент", "центи", "центів", Gender.Masculine);

    /// <summary>Євро / цент.</summary>
    public static Currency Eur { get; } =
        new("євро", "євро", "євро", Gender.Masculine, "цент", "центи", "центів", Gender.Masculine);

#pragma warning disable CS1591
    public string One { get; }
    public string Few { get; }
    public string Many { get; }
    public Gender Gender { get; }
    public string FractionOne { get; }
    public string FractionFew { get; }
    public string FractionMany { get; }
    public Gender FractionGender { get; }
#pragma warning restore CS1591
}

/// <summary>Налаштування <see cref="MoneyToWords"/>.</summary>
public sealed class MoneyWordsOptions
{
    /// <summary>Копійки словами («п’ятдесят копійок») замість цифр («50 копійок»). За замовчуванням false.</summary>
    public bool FractionAsWords { get; set; }

    /// <summary>Перша літера велика. За замовчуванням true.</summary>
    public bool Capitalize { get; set; } = true;

    /// <summary>Символ апострофа. За замовчуванням ’ (U+2019).</summary>
    public string Apostrophe { get; set; } = "’";
}

/// <summary>Сума прописом: 1250.50 → «Одна тисяча двісті п’ятдесят гривень 50 копійок».</summary>
public static class MoneyToWords
{
    /// <summary>Записує грошову суму словами. Сума округлюється до 2 знаків (0.5 — від нуля).</summary>
    /// <param name="amount">Сума.</param>
    /// <param name="currency">Валюта; за замовчуванням гривня.</param>
    /// <param name="options">Налаштування форматування.</param>
    public static string ToWords(decimal amount, Currency? currency = null, MoneyWordsOptions? options = null)
    {
        currency ??= Currency.Uah;
        options ??= new MoneyWordsOptions();

        var rounded = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        var negative = rounded < 0;
        var abs = Math.Abs(rounded);
        var whole = Math.Truncate(abs);
        if (whole > ulong.MaxValue) throw new ArgumentOutOfRangeException(nameof(amount), "Сума завелика.");

        var units = (ulong)whole;
        var fraction = (ulong)((abs - whole) * 100);

        var unitsWords = NumberToWords.ToWords(units, currency.Gender);
        var unitsName = NumberToWords.Plural(units, currency.One, currency.Few, currency.Many);
        var fractionText = options.FractionAsWords
            ? NumberToWords.ToWords(fraction, currency.FractionGender)
            : fraction.ToString("D2");
        var fractionName = NumberToWords.Plural(fraction, currency.FractionOne, currency.FractionFew, currency.FractionMany);

        var result = $"{(negative ? "мінус " : "")}{unitsWords} {unitsName} {fractionText} {fractionName}";
        result = NumberToWords.ApplyApostrophe(result, options.Apostrophe);

        if (options.Capitalize)
            result = char.ToUpperInvariant(result[0]) + result.Substring(1);
        return result;
    }
}
