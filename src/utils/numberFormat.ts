const ARABIC_DIGITS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

export const toArabicDigits = (val: string | number): string => {
  return String(val).replace(/[0-9]/g, (digit) => ARABIC_DIGITS[digit] || digit);
};

export const toArabicNumber = (num: number): string => {
  return toArabicDigits(num);
};

export const formatPoints = (points: number): string => {
  return `+${toArabicNumber(points)}`;
};

export const formatPercent = (percent: number): string => {
  return `${toArabicNumber(Math.round(percent))}٪`;
};

export const formatSecondsToTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return toArabicDigits(`${mm}:${ss}`);
};
