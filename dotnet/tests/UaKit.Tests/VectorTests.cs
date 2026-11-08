using System.Globalization;
using System.Text.Json;

namespace UaKit.Tests;

public class VectorTests
{
    private static readonly JsonElement Vectors = Load();

    private static JsonElement Load()
    {
        var dir = AppContext.BaseDirectory;
        while (dir is not null && !File.Exists(Path.Combine(dir, "shared", "test-vectors.json")))
            dir = Path.GetDirectoryName(dir);
        if (dir is null) throw new FileNotFoundException("shared/test-vectors.json not found");
        return JsonDocument.Parse(File.ReadAllText(Path.Combine(dir, "shared", "test-vectors.json"))).RootElement;
    }

    private static IEnumerable<object[]> Strings(string section, string key) =>
        Vectors.GetProperty(section).GetProperty(key).EnumerateArray().Select(e => new object[] { e.GetString()! });

    private static IEnumerable<object[]> Objects(string section) =>
        (Vectors.GetProperty(section).ValueKind == JsonValueKind.Array
            ? Vectors.GetProperty(section)
            : Vectors.GetProperty(section).GetProperty("parse"))
        .EnumerateArray().Select(e => new object[] { e.GetRawText() });

    public static IEnumerable<object[]> EdrpouValid() => Strings("edrpou", "valid");
    public static IEnumerable<object[]> EdrpouInvalid() => Strings("edrpou", "invalid");
    public static IEnumerable<object[]> RnokppInvalid() => Strings("rnokpp", "invalid");
    public static IEnumerable<object[]> RnokppParse() => Objects("rnokpp");
    public static IEnumerable<object[]> Numbers() => Objects("numberToWords");
    public static IEnumerable<object[]> Money() => Objects("moneyToWords");

    [Theory, MemberData(nameof(EdrpouValid))]
    public void Edrpou_valid(string code) => Assert.True(Edrpou.IsValid(code));

    [Theory, MemberData(nameof(EdrpouInvalid))]
    public void Edrpou_invalid(string code) => Assert.False(Edrpou.IsValid(code));

    [Theory, MemberData(nameof(EdrpouValid))]
    public void Edrpou_compute_check_digit(string code)
    {
        code = code.Trim();
        Assert.Equal(code[7] - '0', Edrpou.ComputeCheckDigit(code.Substring(0, 7)));
    }

    [Theory, MemberData(nameof(RnokppParse))]
    public void Rnokpp_parse(string json)
    {
        var v = JsonDocument.Parse(json).RootElement;
        var code = v.GetProperty("code").GetString()!;

        Assert.True(Rnokpp.IsValid(code));
        Assert.True(Rnokpp.TryParse(code, out var info));
        Assert.Equal(DateTime.Parse(v.GetProperty("birthDate").GetString()!, CultureInfo.InvariantCulture), info!.BirthDate);
        Assert.Equal(v.GetProperty("sex").GetString() == "male" ? Sex.Male : Sex.Female, info.Sex);
    }

    [Theory, MemberData(nameof(RnokppInvalid))]
    public void Rnokpp_invalid(string code) => Assert.False(Rnokpp.TryParse(code, out _));

    [Theory, MemberData(nameof(Numbers))]
    public void Number_to_words(string json)
    {
        var v = JsonDocument.Parse(json).RootElement;
        var n = long.Parse(v.GetProperty("n").GetString()!, CultureInfo.InvariantCulture);
        var gender = v.GetProperty("gender").GetString() switch
        {
            "feminine" => Gender.Feminine,
            "neuter" => Gender.Neuter,
            _ => Gender.Masculine,
        };
        Assert.Equal(v.GetProperty("words").GetString(), NumberToWords.ToWords(n, gender));
    }

    [Theory, MemberData(nameof(Money))]
    public void Money_to_words(string json)
    {
        var v = JsonDocument.Parse(json).RootElement;
        var amount = decimal.Parse(v.GetProperty("amount").GetString()!, CultureInfo.InvariantCulture);
        var currency = (v.TryGetProperty("currency", out var c) ? c.GetString() : "UAH") switch
        {
            "USD" => Currency.Usd,
            "EUR" => Currency.Eur,
            _ => Currency.Uah,
        };
        var options = new MoneyWordsOptions
        {
            FractionAsWords = v.TryGetProperty("fractionAsWords", out var f) && f.GetBoolean(),
            Capitalize = !v.TryGetProperty("capitalize", out var cap) || cap.GetBoolean(),
            Apostrophe = v.TryGetProperty("apostrophe", out var a) ? a.GetString()! : "’",
        };
        Assert.Equal(v.GetProperty("words").GetString(), MoneyToWords.ToWords(amount, currency, options));
    }

    [Fact]
    public void Number_to_words_long_min_value() =>
        Assert.StartsWith("мінус дев’ять квінтильйонів", NumberToWords.ToWords(long.MinValue));
}
