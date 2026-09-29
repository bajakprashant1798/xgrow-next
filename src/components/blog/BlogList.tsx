"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import type { SanityPost } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";

interface BlogListProps {
  initialPosts?: SanityPost[];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogList({ initialPosts = [] }: BlogListProps) {
  const [selectedCat, setSelectedCat] = useState<string>("All");

  // Derive categories dynamically from available posts with preferred ordering
  const categories = useMemo(() => {
    const rawCategories = initialPosts
      .map((p) => p.category?.trim())
      .filter((c): c is string => Boolean(c));
    const unique = Array.from(new Set(rawCategories));

    const preferredOrder = [
      "AI",
      "SEO",
      "Website Development",
      "Digital Marketing",
      "Branding",
      "Business Growth",
    ];

    unique.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ["All", ...unique];
  }, [initialPosts]);

  // Helper to count posts in a category
  const getCategoryCount = (cat: string) => {
    if (cat === "All") return initialPosts.length;
    return initialPosts.filter(
      (p) =>
        p.category?.toLowerCase() === cat.toLowerCase() ||
        p.tags?.some((t) => t.toLowerCase() === cat.toLowerCase())
    ).length;
  };

  // Helper to filter posts by category or tag
  const filteredPosts =
    selectedCat === "All"
      ? initialPosts
      : initialPosts.filter(
          (p) =>
            p.category?.toLowerCase() === selectedCat.toLowerCase() ||
            p.tags?.some((t) => t.toLowerCase() === selectedCat.toLowerCase())
        );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Category Tabs (styled like Services page) */}
      <div className="flex flex-wrap justify-center gap-2 border-b border-border pb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
              selectedCat === cat
                ? "bg-primary text-primary-foreground shadow-lg dark:bg-cyan dark:text-cyan-foreground"
                : "border border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {cat} {cat !== "All" && `(${getCategoryCount(cat)})`}
          </button>
        ))}
      </div>

      {/* Blog Grid with stable container min-height */}
      <div className="mt-16 min-h-[400px]">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              No articles found in this category yet.
            </p>
            <button
              onClick={() => setSelectedCat("All")}
              className="mt-4 text-cyan hover:underline font-semibold text-sm"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan hover:shadow-2xl animate-in fade-in-50 duration-200"
              >
                {/* Visual Cover Image or Gradient */}
                {post.mainImage?.asset ? (
                  <div className="relative h-48 w-full overflow-hidden border-b border-border">
                    <Image
                      src={urlForImage(post.mainImage).width(600).height(340).url()}
                      alt={post.mainImage.alt || post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-background/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan border border-border/50">
                        {post.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-primary/20 via-surface to-cyan/10 p-6 flex flex-col justify-between border-b border-border">
                    <span className="w-fit rounded-full bg-cyan/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan">
                      {post.category}
                    </span>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                        XGRO Insights
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}
                      </span>
                      {post.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {post.readTime}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-foreground line-clamp-2 hover:text-cyan transition-colors">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-border pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary dark:text-cyan overflow-hidden">
                        {post.author?.image?.asset ? (
                          <Image
                            src={urlForImage(post.author.image).width(56).height(56).url()}
                            alt={post.author.name}
                            width={28}
                            height={28}
                            className="object-cover"
                          />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {post.author?.name || "XGRO Team"}
                      </span>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-1 text-xs font-bold text-cyan hover:underline"
                    >
                      Read <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

