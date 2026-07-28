export function parseEventDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }

  return new Date(value);
}

export function formatEventDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return parseEventDate(value).toLocaleDateString('en-US', options);
}
