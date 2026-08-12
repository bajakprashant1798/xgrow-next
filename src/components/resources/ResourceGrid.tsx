"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Gift,
  Bot,
  CheckCircle2,
  BookOpen,
  Calculator,
  ShieldCheck,
  Zap,
  ShoppingCart,
  FileSpreadsheet,
  Search,
  Sparkles,
  ExternalLink,
  Copy,
  Eye,
  Calendar,
  Layers,
  Filter,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RESOURCE_CATEGORIES,
  initialResources,
  ResourceCategory,
  ResourceItem,
} from "@/lib/resourcesData";
import { QuotationDownloadModal } from "./QuotationDownloadModal";
import { PromptCopyModal } from "./PromptCopyModal";
import { useRouter } from "next/navigation";

export function ResourceGrid() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>("All");

  // Modals state
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [activeDownloadTitle, setActiveDownloadTitle] = useState("");
  const [activeDownloadType, setActiveDownloadType] = useState<"pricelist" | "resource" | "calculator">("resource");

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [activePromptResource, setActivePromptResource] = useState<ResourceItem | null>(null);

  // Filtered resources calculation
  const filteredResources = useMemo(() => {
    return initialResources.filter((res) => {
      const matchesCategory =
        selectedCategory === "All" || res.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleActionClick = (res: ResourceItem) => {
    if (res.type === "prompt") {
      setActivePromptResource(res);
      setPromptModalOpen(true);
    } else if (res.type === "canva" || res.type === "link") {
      if (res.linkUrl) {
        if (res.linkUrl.startsWith("/")) {
          router.push(res.linkUrl);
        } else {
          window.open(res.linkUrl, "_blank");
        }
      }
    } else if (res.type === "tool") {
      if (res.linkUrl) router.push(res.linkUrl);
    } else {
      // PDF or Checklist -> open Lead & Download Modal
      setActiveDownloadTitle(res.title);
      setActiveDownloadType(res.category === "PDF Guides" ? "pricelist" : "resource");
      setLeadModalOpen(true);
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Search & Filter Bar */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan" />
            <Input
              type="text"
              placeholder="Search prompts, Canva templates, PDFs, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border-border/80 bg-card pl-11 pr-4 text-sm font-medium focus:border-cyan shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Layers className="h-4 w-4 text-cyan" />
            <span>Showing {filteredResources.length} Free Resources</span>
          </div>
        </div>

        {/* Category Pills Slider / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {RESOURCE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All"
                ? initialResources.length
                : initialResources.filter((r) => r.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all duration-200 shrink-0 ${
                  isSelected
                    ? "border-cyan bg-cyan text-slate-950 shadow-md font-black"
                    : "border-border/80 bg-card text-muted-foreground hover:border-cyan/50 hover:bg-secondary hover:text-foreground"
                }`}
              >
                {cat} <span className="ml-1 opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan hover:shadow-2xl"
            >
              <div>
                {/* Visual Thumbnail Cover Banner */}
                <div
                  className={`h-32 w-full bg-gradient-to-r ${res.gradient} p-4 flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20" />

                  <div className="relative z-10 flex items-center justify-between">
                    <Badge className="bg-slate-950/80 text-white border-white/20 text-[10px] font-bold backdrop-blur-md px-2.5 py-0.5">
                      {res.fileFormat}
                    </Badge>
                    {res.featured && (
                      <Badge className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 flex items-center gap-1 shadow-md">
                        <Flame className="h-3 w-3 fill-slate-950" /> FEATURED
                      </Badge>
                    )}
                  </div>

                  <div className="relative z-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan drop-shadow-md">
                      {res.category}
                    </span>
                    <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-3">
                      <span>{res.fileSize}</span>
                      <span>•</span>
                      <span>{res.downloadCount.toLocaleString()} downloads</span>
                    </div>
                  </div>
                </div>

                {/* Card Body Content */}
                <CardContent className="p-6">
                  <h3 className="text-base font-black text-foreground group-hover:text-cyan transition-colors line-clamp-2">
                    {res.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {res.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {res.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="p-6 pt-0 border-t border-border/40 mt-auto">
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-cyan" /> {res.dateAdded}
                  </span>

                  <Button
                    onClick={() => handleActionClick(res)}
                    className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-5 py-4 shadow-md transition-all hover:scale-105"
                  >
                    {res.type === "prompt" ? (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Prompt
                      </>
                    ) : res.type === "canva" || res.type === "link" ? (
                      <>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Template
                      </>
                    ) : res.type === "tool" ? (
                      <>
                        <Zap className="mr-1.5 h-3.5 w-3.5" /> Launch Tool
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Free Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-cyan mb-3" />
          <h4 className="text-lg font-bold text-foreground">No resources found</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No items matched your search query "{searchQuery}". Try selecting another category or resetting filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-4 rounded-full text-xs font-bold"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Lead & PDF Download Modal */}
      <QuotationDownloadModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        type={activeDownloadType}
        resourceTitle={activeDownloadTitle}
      />

      {/* Prompt Copy Modal */}
      <PromptCopyModal
        resource={activePromptResource}
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
      />
    </div>
  );
}
