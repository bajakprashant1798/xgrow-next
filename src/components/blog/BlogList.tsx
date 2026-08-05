"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { blogPosts } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";

export function BlogList() {
  const [selectedCat, setSelectedCat] = useState<string>("All");

  const categories = [
    "All",
    "AI",
    "SEO",
    "Website Development",
    "Digital Marketing",
    "Branding",
    "Case Studies",
    "Business Growth",
    "Tutorials",
    "Industry News",
  ];

  // Helper to map category tags to defined list
  const filteredPosts = selectedCat === "All"
    ? blogPosts
    : blogPosts.filter(p => p.category === selectedCat || p.tags.includes(selectedCat));

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Category Navigation */}
      <div className="flex flex-wrap justify-start gap-2 border-b border-border pb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
              selectedCat === cat
                ? "bg-primary text-primary-foreground shadow-md dark:bg-cyan dark:text-cyan-foreground"
                : "border border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">No articles found in this category yet.</p>
          <button
            onClick={() => setSelectedCat("All")}
            className="mt-4 text-cyan hover:underline font-semibold"
          >
            Clear filter
          </button>
        </div>
      ) : (
        /* Blog Grid */
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 80}>
              <article className="flex h-full flex-col rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan hover:shadow-2xl">
                {/* Visual placeholder representation of post cover */}
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

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {post.publishedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
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
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary dark:text-cyan">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {post.author.name}
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
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
