namespace Agendella.Domain.Common;

public readonly record struct DateTimeRange
{
    public DateTimeRange(DateTimeOffset start, DateTimeOffset end)
    {
        if (end <= start)
        {
            throw new ArgumentException("End must be greater than start.", nameof(end));
        }

        Start = start;
        End = end;
    }

    public DateTimeOffset Start { get; }

    public DateTimeOffset End { get; }

    public TimeSpan Duration => End - Start;

    public bool Contains(DateTimeOffset instant) => instant >= Start && instant < End;

    public bool Overlaps(DateTimeRange other) => Start < other.End && End > other.Start;

    public bool Touches(DateTimeRange other) => End == other.Start || Start == other.End;
}
