import { defineField, defineType } from "sanity";

export const postType = defineType({
  name: "post",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Short Excerpt / Summary",
      type: "text",
      rows: 3,
      description: "Brief summary used in cards and search engine snippets",
      validation: (Rule) => Rule.required().max(250),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "AI", value: "AI" },
          { title: "SEO", value: "SEO" },
          { title: "Website Development", value: "Website Development" },
          { title: "Digital Marketing", value: "Digital Marketing" },
          { title: "Branding", value: "Branding" },
          { title: "Case Studies", value: "Case Studies" },
          { title: "Business Growth", value: "Business Growth" },
          { title: "Tutorials", value: "Tutorials" },
          { title: "Industry News", value: "Industry News" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "mainImage",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "readTime",
      title: "Estimated Read Time",
      type: "string",
      description: "e.g. '4 min read'",
    }),
    defineField({
      name: "body",
      title: "Content Body",
      type: "blockContent",
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "mainImage",
      category: "category",
    },
    prepare(selection) {
      const { author, category } = selection;
      return {
        ...selection,
        subtitle: `${category || "Uncategorized"} • By ${author || "XGRO Team"}`,
      };
    },
  },
});
