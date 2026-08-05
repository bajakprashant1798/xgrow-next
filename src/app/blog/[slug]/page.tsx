import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { blogPosts } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = blogPosts.find((p) => p.slug === resolvedParams.slug);

  if (!post) return {};

  return {
    title: `${post.title} | XGRO Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = blogPosts.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Related posts: choose all posts other than current one
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  // Article Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": new Date(post.publishedAt).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "jobTitle": post.author.role,
    },
    "publisher": {
      "@type": "Organization",
      "name": "XGRO",
      "logo": {
        "@type": "ImageObject",
        "url": "https://xgro.in/xlogo.png",
      },
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      {/* Header */}
      <header className="mt-8 border-b border-border pb-8">
        <span className="rounded-full bg-cyan/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan">
          {post.category}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary dark:text-cyan">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs leading-none">{post.author.name}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-1">{post.author.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {post.publishedAt}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {post.readTime}
          </div>
        </div>
      </header>

      {/* Article Body Content */}
      <div 
        className="mt-10 max-w-none text-base leading-relaxed text-foreground/80 space-y-6 prose dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-h3:text-lg prose-blockquote:border-l-4 prose-blockquote:border-cyan prose-blockquote:pl-4 prose-blockquote:italic"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      <div className="mt-10 flex flex-wrap gap-2 border-y border-border py-6">
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            #{tag}
          </span>
        ))}
      </div>

      {/* Inner Article CTA */}
      <section className="mt-12 rounded-3xl bg-radial from-slate-900 via-slate-950 to-[#0B1120] border border-white/10 p-8 text-center text-white">
        <h3 className="text-2xl font-bold">Ready to implement these growth frameworks?</h3>
        <p className="mt-2 text-sm text-slate-300">
          Our team constructs bespoke websites, automated WhatsApp campaigns, and SEO systems.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90">
            <Link href="/contact">Book Free Consultation</Link>
          </Button>
        </div>
      </section>

      {/* Related Posts */}
      <section className="mt-20 border-t border-border pt-16">
        <h2 className="text-2xl font-bold text-foreground">Related articles</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {related.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group rounded-2xl border border-border p-5 bg-card hover:border-cyan transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan">
                {p.category}
              </span>
              <h4 className="mt-2 text-base font-bold text-foreground group-hover:text-cyan transition-colors">
                {p.title}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
