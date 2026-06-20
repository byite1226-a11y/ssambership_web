export const MINIMUM_SIGNUP_AGE = 14 as const;

type BirthDateParts = {
  year: number;
  month: number;
  day: number;
};

export function parseBirthDateParts(value: string): BirthDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

function todayParts(at: Date): BirthDateParts {
  return {
    year: at.getFullYear(),
    month: at.getMonth() + 1,
    day: at.getDate(),
  };
}

export function calculateFullAge(birthDate: string, at = new Date()): number | null {
  const birth = parseBirthDateParts(birthDate);
  if (!birth) return null;
  const today = todayParts(at);
  let age = today.year - birth.year;
  const birthdayPassed = today.month > birth.month || (today.month === birth.month && today.day >= birth.day);
  if (!birthdayPassed) age -= 1;
  return age;
}

export function isFutureBirthDate(birthDate: string, at = new Date()): boolean {
  const birth = parseBirthDateParts(birthDate);
  if (!birth) return false;
  const today = todayParts(at);
  if (birth.year !== today.year) return birth.year > today.year;
  if (birth.month !== today.month) return birth.month > today.month;
  return birth.day > today.day;
}

export function isUnderMinimumSignupAge(birthDate: string, at = new Date()): boolean {
  const age = calculateFullAge(birthDate, at);
  return age !== null && age < MINIMUM_SIGNUP_AGE;
}