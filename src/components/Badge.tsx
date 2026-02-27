type BadgeVariant = "dry_run" | "pending" | "approved" | "executed";

const variantClasses: Record<BadgeVariant, string> = {
  dry_run:
    "border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300",
  pending:
    "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  approved:
    "border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300",
  executed:
    "border-purple-500 text-purple-700 dark:border-purple-400 dark:text-purple-300",
};

export default function Badge({
  variant,
  children,
}: Readonly<{
  variant: BadgeVariant;
  children: React.ReactNode;
}>) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
