namespace Agendella.Domain.Common;

public readonly record struct LocalTimeRange
{
    public LocalTimeRange(TimeOnly start, TimeOnly end)
    {
        if (end <= start)
        {
            throw new ArgumentException("End must be greater than start.", nameof(end));
        }

        Start = start;
        End = end;
    }

    public TimeOnly Start { get; }

    public TimeOnly End { get; }

    public TimeSpan Duration => End - Start;

    public bool Contains(TimeOnly instant) => instant >= Start && instant < End;

    public LocalTimeRange? Intersect(LocalTimeRange other)
    {
        var start = Start > other.Start ? Start : other.Start;
        var end = End < other.End ? End : other.End;

        return end <= start ? null : new LocalTimeRange(start, end);
    }
}
