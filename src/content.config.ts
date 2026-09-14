import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const slugSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ dùng chữ thường, số và dấu gạch ngang');

const truthTopics = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/truth-topics' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(2).max(80),
      slug: slugSchema,
      description: z.string().min(20).max(220),
      order: z.number().int().nonnegative(),
      icon: z.enum(['compass', 'seedling', 'lamp']),
      coverImage: image().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const truthLessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/truth-lessons' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(4).max(120),
      slug: slugSchema,
      description: z.string().min(20).max(240),
      topic: reference('truthTopics'),
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().min(2).max(80).optional(),
      coverImage: image().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      seoTitle: z.string().max(65).optional(),
      seoDescription: z.string().max(160).optional(),
    }),
});

export const collections = { truthTopics, truthLessons };
