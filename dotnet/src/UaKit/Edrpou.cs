namespace UaKit;

/// <summary>
/// Код ЄДРПОУ — 8-значний ідентифікатор юридичної особи в Україні.
/// </summary>
public static class Edrpou
{
    private static readonly int[] WeightsLow = { 1, 2, 3, 4, 5, 6, 7 };
    private static readonly int[] WeightsMid = { 7, 1, 2, 3, 4, 5, 6 };

    /// <summary>
    /// Перевіряє формат (рівно 8 цифр) і контрольну цифру коду ЄДРПОУ.
    /// Пробіли на початку і в кінці ігноруються.
    /// </summary>
    public static bool IsValid(string? code)
    {
        if (code is null) return false;
        code = code.Trim();
        if (code.Length != 8 || !Digits.All(code)) return false;

        var number = int.Parse(code);
        var useMid = number >= 30_000_000 && number <= 60_000_000;
        return CheckDigit(code, useMid) == code[7] - '0';
    }

    /// <summary>
    /// Обчислює контрольну (8-му) цифру для перших 7 цифр коду.
    /// </summary>
    /// <param name="first7">Рівно 7 цифр.</param>
    public static int ComputeCheckDigit(string first7)
    {
        if (first7 is null) throw new ArgumentNullException(nameof(first7));
        if (first7.Length != 7 || !Digits.All(first7))
            throw new ArgumentException("Потрібно рівно 7 цифр.", nameof(first7));

        var prefix = int.Parse(first7);
        var useMid = prefix >= 3_000_000 && prefix < 6_000_000;
        return CheckDigit(first7, useMid);
    }

    private static int CheckDigit(string code, bool useMid)
    {
        var weights = useMid ? WeightsMid : WeightsLow;
        var control = WeightedSum(code, weights, 0) % 11;
        if (control == 10)
        {
            control = WeightedSum(code, weights, 2) % 11;
            if (control == 10) control = 0;
        }
        return control;
    }

    private static int WeightedSum(string code, int[] weights, int shift)
    {
        var sum = 0;
        for (var i = 0; i < 7; i++)
            sum += (code[i] - '0') * (weights[i] + shift);
        return sum;
    }
}
