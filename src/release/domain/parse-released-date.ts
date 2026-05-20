const YEAR_ONLY = /^\d{4}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseReleasedDate(
  value: string | null | undefined,
): Date | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }

  let iso: string;
  if (YEAR_ONLY.test(trimmed)) {
    iso = `${trimmed}-01-01`;
  } else if (ISO_DATE.test(trimmed)) {
    iso = trimmed;
  } else {
    return undefined;
  }

  const time = Date.parse(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(time)) {
    return undefined;
  }

  return new Date(time);
}
