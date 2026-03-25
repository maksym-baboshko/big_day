"use client";

function SkeletonLeaderRow() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent/18 bg-accent/7 p-4">
      {/* shimmer sweep */}
      <div className="live-leaderboard-shimmer pointer-events-none absolute inset-0 w-1/3 bg-linear-to-r from-transparent via-accent/10 to-transparent" />
      <div className="live-leaderboard-leader-pulse flex items-center gap-4">
        {/* rank placeholder */}
        <div className="font-cinzel w-10 text-center text-4xl text-accent/30">1</div>
        {/* avatar placeholder */}
        <div className="h-12 w-12 shrink-0 rounded-full bg-accent/15" />
        {/* name + points */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-28 rounded-full bg-accent/15" />
          <div className="h-2.5 w-16 rounded-full bg-accent/10" />
        </div>
        {/* points */}
        <div className="font-cinzel text-3xl text-accent/20">—</div>
      </div>
    </div>
  );
}

function SkeletonRegularRow({ rank, hideOnMobile }: { rank: number; hideOnMobile?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-bg-secondary/30 px-4 py-3 ${rank <= 3 ? "border-accent/14" : "border-accent/8"} ${hideOnMobile ? "hidden lg:block" : ""}`}
    >
      {/* shimmer */}
      <div className="live-leaderboard-shimmer pointer-events-none absolute inset-0 w-1/3 bg-linear-to-r from-transparent via-accent/8 to-transparent" />
      <div className="live-leaderboard-regular-pulse flex items-center gap-3">
        {/* rank */}
        <div className="font-cinzel w-7 text-center text-sm text-accent/25">{rank}</div>
        {/* avatar */}
        <div className="h-9 w-9 shrink-0 rounded-full bg-accent/12" />
        {/* name */}
        <div className="h-2.5 flex-1 rounded-full bg-accent/12" />
        {/* points */}
        <div className="h-2.5 w-10 rounded-full bg-accent/10" />
      </div>
    </div>
  );
}

export function LeaderboardEmptyState() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonLeaderRow />
      {([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((rank) => (
        <SkeletonRegularRow key={rank} rank={rank} hideOnMobile={rank > 7} />
      ))}
    </div>
  );
}
