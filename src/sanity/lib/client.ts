import { createClient, type QueryParams } from "next-sanity";
import { apiVersion, dataset, projectId, isSanityConfigured } from "../env";

export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sanityFetch<T = any>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T | null> {
  if (!isSanityConfigured) {
    return null;
  }

  try {
    return await client.fetch<T>(query, params, {
      next: {
        revalidate: tags.length ? false : revalidate,
        tags,
      },
    });
  } catch (error) {
    console.error("Error fetching from Sanity:", error);
    return null;
  }
}
