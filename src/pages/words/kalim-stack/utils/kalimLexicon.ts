import { isValidArabicWord, normalizeArabic } from '../../../../utils/arabicDictionary';
import { LetterCard, BoardSlot, MoveValidationResult } from '../types';

export const ARABIC_ALPHABET_WEIGHTED = [
  'ا', 'ا', 'ا', 'ب', 'ب', 'ت', 'ت', 'ث',
  'ج', 'ح', 'خ', 'د', 'د', 'ذ', 'ر', 'ر',
  'ز', 'س', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'ع', 'غ', 'ف', 'ف', 'ق', 'ق', 'ك',
  'ك', 'ل', 'ل', 'ل', 'م', 'م', 'م', 'ن',
  'ن', 'هـ', 'و', 'و', 'ي', 'ي'
];

export const STARTER_WORDS_BANK: string[] = [
  'كتب', 'علم', 'نصر', 'ذهب', 'حمد', 'شكر', 'ملك', 'حكم',
  'درس', 'صنع', 'قفل', 'فتح', 'رسم', 'جمع', 'طرد', 'قصد',
  'بحر', 'شمس', 'قمر', 'نجم', 'عقل', 'قلب', 'صوت', 'نور',
  'سعد', 'وصل', 'وقف', 'فهم', 'حفظ', 'زرع', 'شرب', 'اكل',
  'ضرب', 'نظر', 'طلب', 'عرف', 'عقد', 'نقل', 'صبر', 'فرح',
  'سبح', 'قطع', 'رفع', 'وضع', 'سكن', 'دخل', 'خرج', 'رجع'
];

export const generateRandomHand = (count: number = 7): LetterCard[] => {
  return Array.from({ length: count }, () => {
    const letter = ARABIC_ALPHABET_WEIGHTED[Math.floor(Math.random() * ARABIC_ALPHABET_WEIGHTED.length)];
    return {
      id: 'c_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 9)),
      letter,
      points: Math.floor(Math.random() * 3) + 1
    };
  });
};

export const generateStarterBoard = (): [BoardSlot, BoardSlot, BoardSlot] => {
  const chosenWord = STARTER_WORDS_BANK[Math.floor(Math.random() * STARTER_WORDS_BANK.length)];
  const letters = chosenWord.split('');

  return [
    {
      positionIndex: 0,
      topCard: {
        id: 'start_0_' + Date.now(),
        letter: letters[0] || 'ك',
        points: 1
      },
      stackHistory: []
    },
    {
      positionIndex: 1,
      topCard: {
        id: 'start_1_' + Date.now(),
        letter: letters[1] || 'ت',
        points: 1
      },
      stackHistory: []
    },
    {
      positionIndex: 2,
      topCard: {
        id: 'start_2_' + Date.now(),
        letter: letters[2] || 'ب',
        points: 1
      },
      stackHistory: []
    }
  ];
};

export const validateKalimPlacement = (
  currentBoard: [BoardSlot, BoardSlot, BoardSlot],
  slotIndex: 0 | 1 | 2,
  newLetter: string
): MoveValidationResult => {
  // Construct candidate 3-letter word
  const letters = currentBoard.map((slot, idx) => (idx === slotIndex ? newLetter : slot.topCard.letter));
  const candidateWord = letters.join('');
  const normalizedCandidate = normalizeArabic(candidateWord);

  // Check if same letter placed on same slot (no change)
  if (currentBoard[slotIndex].topCard.letter === newLetter) {
    return {
      isValid: false,
      resultingWord: candidateWord,
      errorMessage: 'الحرف مطابق للحرف الموجود بالفعل على الأرض!'
    };
  }

  // Validate against Arabic dictionary
  const isValid = isValidArabicWord(normalizedCandidate, 3) || isValidArabicWord(candidateWord, 3) || STARTER_WORDS_BANK.includes(normalizedCandidate);

  return {
    isValid,
    resultingWord: candidateWord,
    errorMessage: isValid ? undefined : `كلمة (${candidateWord}) غير مقبولة في المعجم العربي!`
  };
};
