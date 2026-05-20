import { parseReleasedDate } from './parse-released-date';

describe('parseReleasedDate', () => {
  it('should_return_date_for_year_only_string', () => {
    expect(parseReleasedDate('1990')).toEqual(
      new Date('1990-01-01T00:00:00.000Z'),
    );
  });

  it('should_return_date_for_iso_date_string', () => {
    expect(parseReleasedDate('1900-03-01')).toEqual(
      new Date('1900-03-01T00:00:00.000Z'),
    );
  });

  it('should_return_undefined_when_value_is_null', () => {
    expect(parseReleasedDate(null)).toBeUndefined();
  });

  it('should_return_undefined_when_value_is_undefined', () => {
    expect(parseReleasedDate(undefined)).toBeUndefined();
  });

  it('should_return_undefined_when_value_is_empty_string', () => {
    expect(parseReleasedDate('')).toBeUndefined();
    expect(parseReleasedDate('   ')).toBeUndefined();
  });

  it('should_return_undefined_when_value_is_unparseable', () => {
    expect(parseReleasedDate('not-a-date')).toBeUndefined();
    expect(parseReleasedDate('199')).toBeUndefined();
    expect(parseReleasedDate('19999')).toBeUndefined();
    expect(parseReleasedDate('1999-03-00')).toBeUndefined();
  });
});
