namespace UaKit;

internal static class Digits
{
    public static bool All(string s)
    {
        foreach (var c in s)
            if (c < '0' || c > '9') return false;
        return true;
    }
}
