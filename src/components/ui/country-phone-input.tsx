"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { COUNTRIES, Country, DEFAULT_COUNTRY } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountryPhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  selectedCountry: Country;
  onCountryChange: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
}

export function CountryPhoneInput({
  id = "phone",
  value,
  onChange,
  selectedCountry = DEFAULT_COUNTRY,
  onCountryChange,
  placeholder,
  disabled = false,
  className,
  error,
}: CountryPhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filter countries by name, dialCode, or ISO code
  const filteredCountries = COUNTRIES.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and spaces
    const rawVal = e.target.value.replace(/[^\d\s]/g, "");
    // Check digit length
    const digitsOnly = rawVal.replace(/\s/g, "");
    if (digitsOnly.length <= (selectedCountry.maxLength || 15)) {
      onChange(rawVal);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className={cn(
          "flex items-center rounded-xl border bg-card text-foreground transition-all",
          error ? "border-red-500 focus-within:ring-1 focus-within:ring-red-500" : "border-border focus-within:border-cyan focus-within:ring-1 focus-within:ring-cyan",
          className
        )}
      >
        {/* Country Flag & Code Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 sm:h-10 shrink-0 items-center gap-1.5 rounded-l-xl border-r border-border/80 bg-surface/50 px-2.5 sm:px-3 text-xs sm:text-sm font-medium hover:bg-surface transition-colors focus:outline-none"
          title={`Selected: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span className="text-base sm:text-lg leading-none">{selectedCountry.flag}</span>
          <span className="text-xs font-semibold text-foreground">{selectedCountry.dialCode}</span>
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Phone Number Input */}
        <input
          id={id}
          type="tel"
          disabled={disabled}
          placeholder={placeholder || selectedCountry.placeholder}
          value={value}
          onChange={handlePhoneChange}
          className="h-9 sm:h-10 w-full rounded-r-xl bg-transparent px-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full max-w-[320px] rounded-xl border border-border bg-popover/98 backdrop-blur-xl p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95">
          {/* Search Bar */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan focus:outline-none"
            />
          </div>

          {/* Country List */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-border/20">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onCountryChange(c);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors hover:bg-cyan/15",
                      isSelected && "bg-cyan/20 font-bold text-cyan"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="truncate text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="font-mono text-muted-foreground text-[11px]">{c.dialCode}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-cyan" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
