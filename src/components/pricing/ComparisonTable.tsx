"use client";

import { Check, Minus } from "lucide-react";
import { pricingComparison } from "@/lib/site";

export function ComparisonTable() {
  const renderCell = (val: boolean | string) => {
    if (typeof val === "boolean") {
      return val ? (
        <Check className="mx-auto h-5 w-5 text-cyan" />
      ) : (
        <Minus className="mx-auto h-5 w-5 text-muted-foreground/35" />
      );
    }
    return <span className="text-sm font-medium">{val}</span>;
  };

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-6 py-5 text-sm font-bold text-foreground">Feature</th>
              <th className="px-6 py-5 text-center text-sm font-bold text-foreground">Starter</th>
              <th className="px-6 py-5 text-center text-sm font-bold text-primary dark:text-cyan">
                Growth
              </th>
              <th className="px-6 py-5 text-center text-sm font-bold text-foreground">Scale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pricingComparison.map((group) => (
              <tr key={group.groupName} className="bg-muted/40">
                <td colSpan={4} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/70">
                  {group.groupName}
                </td>
              </tr>
            ))}
            {pricingComparison.flatMap((group) =>
              group.features.map((feat) => (
                <tr key={feat.name} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-6 py-4.5 text-left text-sm font-medium text-foreground">
                    {feat.name}
                  </td>
                  <td className="px-6 py-4.5 text-center text-muted-foreground">
                    {renderCell(feat.starter)}
                  </td>
                  <td className="px-6 py-4.5 text-center text-foreground font-semibold bg-primary/5 dark:bg-cyan/5">
                    {renderCell(feat.growth)}
                  </td>
                  <td className="px-6 py-4.5 text-center text-muted-foreground">
                    {renderCell(feat.scale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
