import sangTheKy from './sang-the-ky.json';
import thiThien from './thi-thien.json';

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  book: string;
  slug: string;
  abbreviation: string;
  testament: 'old' | 'new';
  chapters: BibleChapter[];
}

export const bibleBooks: BibleBook[] = [sangTheKy, thiThien] as BibleBook[];

export function getBibleBook(slug: string): BibleBook | undefined {
  return bibleBooks.find((book) => book.slug === slug);
}

export function getBibleChapter(book: BibleBook, chapterNumber: number): BibleChapter | undefined {
  return book.chapters.find((chapter) => chapter.chapter === chapterNumber);
}
