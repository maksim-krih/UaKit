using System.Text;

namespace UaKit;

/// <summary>Граматичний рід, з яким узгоджуються «один/одна/одне» та «два/дві».</summary>
public enum Gender
{
    /// <summary>Чоловічий: один, два.</summary>
    Masculine,
    /// <summary>Жіночий: одна, дві.</summary>
    Feminine,
    /// <summary>Середній: одне, два.</summary>
    Neuter,
}

/// <summary>Цілі числа словами українською.</summary>
public static class NumberToWords
{
    private static readonly string[] Ones =
        { "", "один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять" };

    private static readonly string[] Teens =
    {
        "десять", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять",
        "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять",
    };

    private static readonly string[] Tens =
        { "", "", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто" };

    private static readonly string[] Hundreds =
        { "", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот" };

    private static readonly (string One, string Few, string Many, Gender Gender)[] Scales =
    {
        ("", "", "", Gender.Masculine),
        ("тисяча", "тисячі", "тисяч", Gender.Feminine),
        ("мільйон", "мільйони", "мільйонів", Gender.Masculine),
        ("мільярд", "мільярди", "мільярдів", Gender.Masculine),
        ("трильйон", "трильйони", "трильйонів", Gender.Masculine),
        ("квадрильйон", "квадрильйони", "квадрильйонів", Gender.Masculine),
        ("квінтильйон", "квінтильйони", "квінтильйонів", Gender.Masculine),
    };

    /// <summary>Записує ціле число словами: 21 → «двадцять один», 2 (Feminine) → «дві».</summary>
    /// <param name="number">Число; від’ємні отримують префікс «мінус».</param>
    /// <param name="gender">Рід іменника, з яким узгоджується число.</param>
    /// <param name="apostrophe">Символ апострофа (за замовчуванням ’).</param>
    public static string ToWords(long number, Gender gender = Gender.Masculine, string apostrophe = "’")
    {
        var magnitude = number < 0 ? (ulong)(-(number + 1)) + 1 : (ulong)number;
        var words = ToWords(magnitude, gender);
        if (number < 0) words = "мінус " + words;
        return ApplyApostrophe(words, apostrophe);
    }

    internal static string ToWords(ulong number, Gender gender)
    {
        if (number == 0) return "нуль";

        var groups = new List<int>();
        while (number > 0)
        {
            groups.Add((int)(number % 1000));
            number /= 1000;
        }

        var sb = new StringBuilder();
        for (var i = groups.Count - 1; i >= 0; i--)
        {
            var group = groups[i];
            if (group == 0) continue;

            var scale = Scales[i];
            AppendGroup(sb, group, i == 0 ? gender : scale.Gender);
            if (i > 0) Append(sb, Plural((ulong)group, scale.One, scale.Few, scale.Many));
        }
        return sb.ToString();
    }

    /// <summary>
    /// Обирає форму іменника за числом: 1 → one, 2–4 → few, 0 і 5–20 → many
    /// (з урахуванням 11–14 → many).
    /// </summary>
    public static string Plural(ulong n, string one, string few, string many)
    {
        var lastTwo = n % 100;
        if (lastTwo >= 11 && lastTwo <= 14) return many;
        return (n % 10) switch
        {
            1 => one,
            2 or 3 or 4 => few,
            _ => many,
        };
    }

    internal static string ApplyApostrophe(string s, string apostrophe) =>
        apostrophe == "'" ? s : s.Replace("'", apostrophe);

    private static void AppendGroup(StringBuilder sb, int group, Gender gender)
    {
        Append(sb, Hundreds[group / 100]);
        var rest = group % 100;
        if (rest >= 10 && rest < 20)
        {
            Append(sb, Teens[rest - 10]);
            return;
        }

        Append(sb, Tens[rest / 10]);
        var unit = rest % 10;
        Append(sb, unit switch
        {
            1 => gender switch { Gender.Feminine => "одна", Gender.Neuter => "одне", _ => "один" },
            2 => gender == Gender.Feminine ? "дві" : "два",
            _ => Ones[unit],
        });
    }

    private static void Append(StringBuilder sb, string word)
    {
        if (word.Length == 0) return;
        if (sb.Length > 0) sb.Append(' ');
        sb.Append(word);
    }
}
