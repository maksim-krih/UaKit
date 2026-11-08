namespace UaKit;

/// <summary>Стать, закодована в РНОКПП (9-та цифра).</summary>
public enum Sex
{
    /// <summary>Жіноча (парна 9-та цифра).</summary>
    Female,
    /// <summary>Чоловіча (непарна 9-та цифра).</summary>
    Male,
}

/// <summary>Дані, розібрані з РНОКПП.</summary>
public sealed class RnokppInfo
{
    internal RnokppInfo(string code, DateTime birthDate, Sex sex)
    {
        Code = code;
        BirthDate = birthDate;
        Sex = sex;
    }

    /// <summary>Нормалізований 10-значний код.</summary>
    public string Code { get; }

    /// <summary>Дата народження (перші 5 цифр — кількість днів від 31.12.1899).</summary>
    public DateTime BirthDate { get; }

    /// <summary>Стать.</summary>
    public Sex Sex { get; }
}

/// <summary>
/// РНОКПП (раніше ІПН) — 10-значний реєстраційний номер облікової картки платника податків, фізичної особи.
/// </summary>
public static class Rnokpp
{
    private static readonly int[] Weights = { -1, 5, 7, 9, 4, 6, 10, 5, 7 };
    private static readonly DateTime Epoch = new(1899, 12, 31);

    /// <summary>
    /// Перевіряє формат (рівно 10 цифр) і контрольну цифру РНОКПП.
    /// Пробіли на початку і в кінці ігноруються.
    /// </summary>
    public static bool IsValid(string? code)
    {
        if (code is null) return false;
        code = code.Trim();
        return code.Length == 10 && Digits.All(code) && ComputeCheckDigit(code.Substring(0, 9)) == code[9] - '0';
    }

    /// <summary>
    /// Перевіряє РНОКПП і повертає дату народження та стать.
    /// Повертає false, якщо код недійсний або перші 5 цифр — нулі.
    /// </summary>
    public static bool TryParse(string? code, out RnokppInfo? info)
    {
        info = null;
        if (!IsValid(code)) return false;

        var normalized = code!.Trim();
        var days = int.Parse(normalized.Substring(0, 5));
        if (days == 0) return false;

        var sex = (normalized[8] - '0') % 2 == 1 ? Sex.Male : Sex.Female;
        info = new RnokppInfo(normalized, Epoch.AddDays(days), sex);
        return true;
    }

    /// <summary>Обчислює контрольну (10-ту) цифру для перших 9 цифр.</summary>
    /// <param name="first9">Рівно 9 цифр.</param>
    public static int ComputeCheckDigit(string first9)
    {
        if (first9 is null) throw new ArgumentNullException(nameof(first9));
        if (first9.Length != 9 || !Digits.All(first9))
            throw new ArgumentException("Потрібно рівно 9 цифр.", nameof(first9));

        var sum = 0;
        for (var i = 0; i < 9; i++)
            sum += (first9[i] - '0') * Weights[i];
        return ((sum % 11) + 11) % 11 % 10;
    }
}
