import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type TruthTopic = CollectionEntry<'truthTopics'>;
export type TruthLesson = CollectionEntry<'truthLessons'>;

export async function getPublishedTopics(): Promise<TruthTopic[]> {
  const topics = await getCollection('truthTopics', ({ data }) => !data.draft);
  return topics.sort((a, b) => a.data.order - b.data.order);
}

export async function getPublishedLessons(): Promise<TruthLesson[]> {
  const lessons = await getCollection('truthLessons', ({ data }) => !data.draft);
  return lessons.sort(
    (a, b) => b.data.publishedDate.getTime() - a.data.publishedDate.getTime(),
  );
}

export async function getTopicForLesson(lesson: TruthLesson): Promise<TruthTopic> {
  const topic = await getEntry(lesson.data.topic);
  if (!topic || topic.data.draft) {
    throw new Error(`Không tìm thấy topic đã xuất bản cho lesson ${lesson.id}`);
  }
  return topic;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
