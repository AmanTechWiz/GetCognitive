'use client';

export function ContributorCounter({
  repoOwner,
  repoName,
}: {
  repoOwner: string;
  repoName: string;
}) {
  return (
    <div className="rounded-xl border bg-fd-secondary p-4">
      <p className="font-mono text-3xl font-bold">400+</p>
      <p className="mt-1 text-sm text-fd-muted-foreground">
        contributors across {repoOwner}/{repoName}
      </p>
    </div>
  );
}
