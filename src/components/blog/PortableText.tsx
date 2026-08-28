import {
  PortableText as PortableTextComponent,
  type PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import { urlForImage } from "@/sanity/lib/image";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-6 leading-relaxed text-foreground/80">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-3 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 text-lg font-bold text-foreground">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-cyan pl-4 italic text-foreground/90 font-medium">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-6 list-disc list-inside space-y-2 text-foreground/80">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-6 list-decimal list-inside space-y-2 text-foreground/80">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm text-cyan">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const target = (value?.href || "").startsWith("http")
        ? "_blank"
        : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === "_blank" ? "noindex nofollow noreferrer" : undefined}
          className="text-cyan underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-video w-full">
            <Image
              src={urlForImage(value).width(1200).height(675).url()}
              alt={value.alt || "Article illustration"}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="p-3 text-center text-xs text-muted-foreground border-t border-border">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomPortableText({ value }: { value: any }) {
  if (!value) return null;
  return (
    <div className="prose dark:prose-invert max-w-none">
      <PortableTextComponent value={value} components={components} />
    </div>
  );
}
