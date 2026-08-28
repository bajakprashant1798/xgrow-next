import { groq } from "next-sanity";
import { sanityFetch } from "./client";
import { isSanityConfigured } from "../env";
import { blogPosts } from "@/lib/site";

export type SanityPost = {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  readTime?: string;
  category: string;
  tags?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage?: any;
  author?: {
    name: string;
    role?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image?: any;
    bio?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  content?: string; // fallback for static mock articles
};

export const postsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    readTime,
    category,
    tags,
    mainImage,
    author-> {
      name,
      role,
      image
    }
  }
`;

export const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    readTime,
    category,
    tags,
    mainImage,
    body,
    author-> {
      name,
      role,
      image,
      bio
    }
  }
`;

export const postSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)] {
    "slug": slug.current
  }
`;

export const relatedPostsQuery = groq`
  *[_type == "post" && slug.current != $slug] | order(publishedAt desc)[0...2] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    category
  }
`;

/**
 * Fetch all posts: Queries Sanity if configured, falls back to static mock data.
 */
export async function getAllPosts(): Promise<SanityPost[]> {
  if (isSanityConfigured) {
    const sanityData = await sanityFetch<SanityPost[]>({
      query: postsQuery,
      revalidate: 60,
      tags: ["post"],
    });

    if (Array.isArray(sanityData) && sanityData.length > 0) {
      return sanityData;
    }
  }

  // Graceful fallback to existing mock posts in src/lib/site.ts
  return blogPosts.map((p) => ({
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    category: p.category,
    publishedAt: p.publishedAt,
    readTime: p.readTime,
    tags: p.tags,
    author: p.author,
    content: p.content,
  }));
}

/**
 * Fetch single post by slug: Queries Sanity first, falls back to static mock data.
 */
export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  if (isSanityConfigured) {
    const sanityData = await sanityFetch<SanityPost>({
      query: postQuery,
      params: { slug },
      revalidate: 60,
      tags: [`post:${slug}`],
    });

    if (sanityData) {
      return sanityData;
    }
  }

  const staticPost = blogPosts.find((p) => p.slug === slug);
  if (staticPost) {
    return {
      title: staticPost.title,
      slug: staticPost.slug,
      excerpt: staticPost.excerpt,
      category: staticPost.category,
      publishedAt: staticPost.publishedAt,
      readTime: staticPost.readTime,
      tags: staticPost.tags,
      author: staticPost.author,
      content: staticPost.content,
    };
  }

  return null;
}

/**
 * Fetch all slugs for generateStaticParams and sitemap.
 */
export async function getAllSlugs(): Promise<{ slug: string }[]> {
  if (isSanityConfigured) {
    const slugs = await sanityFetch<{ slug: string }[]>({
      query: postSlugsQuery,
      revalidate: 60,
    });
    if (Array.isArray(slugs) && slugs.length > 0) {
      return slugs;
    }
  }

  return blogPosts.map((p) => ({ slug: p.slug }));
}

/**
 * Fetch related posts for an article.
 */
export async function getRelatedPosts(currentSlug: string): Promise<SanityPost[]> {
  if (isSanityConfigured) {
    const related = await sanityFetch<SanityPost[]>({
      query: relatedPostsQuery,
      params: { slug: currentSlug },
      revalidate: 60,
    });
    if (Array.isArray(related) && related.length > 0) {
      return related;
    }
  }

  return blogPosts
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 2)
    .map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      category: p.category,
      publishedAt: p.publishedAt,
      readTime: p.readTime,
      tags: p.tags,
      author: p.author,
    }));
}
