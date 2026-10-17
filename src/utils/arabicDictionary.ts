/**
 * Unified Massive Arabic Dictionary & Word Validation Engine ("طق عصي")
 * High-performance lexicon connected to 41,775+ authentic Arabic words.
 * Strictly rejects gibberish and invalid letter combinations.
 */

class ArabicDictionaryService {
  private wordsSet: Set<string> = new Set();
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  public wordleTargets: string[] = [
    'سفينه', 'صحراء', 'بركان', 'كواكب', 'ياقوت', 'اشجار', 'ازهار', 'اطفال', 'امطار',
    'انهار', 'بحيره', 'بستان', 'تاريخ', 'تجاره', 'تسامح', 'تعاون', 'تفكير', 'تلميذ',
    'ثروات', 'ثعالب', 'جامعه', 'جزيره', 'جمارك', 'جمهور', 'حدائق', 'حقائق', 'حكماء',
    'حيوان', 'خرائط', 'خزائن', 'خطوات', 'دفاتر', 'دلائل', 'ذكريات', 'روائع', 'رياضه',
    'زبائن', 'زراعه', 'سحائب', 'سرادق', 'سلاسل', 'سلطان', 'شواطئ', 'صناديق', 'ضفائر',
    'طبيعه', 'طرقات', 'ظواهر', 'عواطف', 'فاروق', 'فرسان', 'قوافل', 'قوانين', 'قصائد',
    'متحف', 'مدرسه', 'مكتبه', 'ملاعب', 'مناطق', 'مواكب', 'نوافذ', 'هدايا', 'واحات',
    'وديان', 'وسائد', 'ياسمين', 'ينابيع', 'كتابه', 'قراءه', 'سباحه', 'طيران', 'رساله',
    'حكايه', 'روايه', 'فرسان', 'سياحه', 'حديقه', 'مدينه', 'طبيبه', 'مهندس', 'طياره'
  ];

  constructor() {
    this.wordleTargets.forEach(w => this.wordsSet.add(this.normalize(w)));
  }

  public normalize(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const res = await fetch('/data/arabic_words.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const words: string[] = await res.json();
        words.forEach((w) => {
          const norm = this.normalize(w);
          if (norm) this.wordsSet.add(norm);
        });
        this.isLoaded = true;
        console.log(`[ArabicDictionary] Loaded ${this.wordsSet.size} Arabic words.`);
      } catch (err) {
        console.warn('[ArabicDictionary] Fetch warn, relying on bundled dataset:', err);
      }
    })();

    return this.loadPromise;
  }

  public isValid(word: string, length?: number): boolean {
    if (!word) return false;
    const clean = this.normalize(word);
    if (!clean) return false;
    if (length && clean.length !== length) return false;

    // Strictly reject words not present in the dictionary
    return this.wordsSet.has(clean);
  }

  public getRandomWordleTarget(): string {
    const pool = this.wordleTargets.length > 0
      ? this.wordleTargets
      : ['سفينه', 'صحراء', 'بركان', 'كواكب', 'ياقوت'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  public getWordsForLetters(letters: string[], minLength = 3, maxLength = 6): string[] {
    const normLetters = letters.map(l => this.normalize(l));
    const letterSet = new Set(normLetters);
    const matches: string[] = [];

    for (const word of this.wordsSet) {
      if (word.length < minLength || word.length > maxLength) continue;
      let canForm = true;
      for (const ch of word) {
        if (!letterSet.has(ch)) {
          canForm = false;
          break;
        }
      }
      if (canForm) {
        matches.push(word);
      }
    }
    return matches;
  }

  public get size(): number {
    return this.wordsSet.size;
  }
}

export const arabicDict = new ArabicDictionaryService();
export const normalizeArabic = (text: string) => arabicDict.normalize(text);
export const isValidArabicWord = (word: string, length?: number) => arabicDict.isValid(word, length);
export const getRandomWordleTarget = () => arabicDict.getRandomWordleTarget();
export const getWordsForLetters = (letters: string[], minLength = 3, maxLength = 6) =>
  arabicDict.getWordsForLetters(letters, minLength, maxLength);
