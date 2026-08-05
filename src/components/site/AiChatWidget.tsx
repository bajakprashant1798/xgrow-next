"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { site } from "@/lib/site";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  options?: string[];
  form?: boolean;
};

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [currentStep, setCurrentStep] = useState<"chat" | "name" | "contact" | "done">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialOptions = [
    "What services do you offer?",
    "What are your pricing packages?",
    "Where is your office?",
    "Talk to a human (WhatsApp)",
  ];

  // Initialize chat
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: "Hi! I'm your XGRO growth assistant. How can I help you scale your business today?",
        options: initialOptions,
      },
    ]);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleOptionClick = (option: string) => {
    // Add user message
    const userMsgId = Math.random().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: option }]);

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = "";
      let nextOptions: string[] = [];

      if (option.includes("services")) {
        replyText = "We offer Website Development, Graphic Design, Content Marketing, SEO, AI Automation, Digital Marketing, and Branding. Which one would you like to explore?";
        nextOptions = ["Website Development", "AI Automation & Chatbots", "SEO & Marketing", "Back to main menu"];
      } else if (option.includes("pricing")) {
        replyText = "Our packages start at ₹14,999 for Starter, ₹39,999 for Growth, and custom quotes for Scale. All prices are fixed in writing before work starts.";
        nextOptions = ["Tell me about Starter", "Tell me about Growth", "Request a custom quote", "Back to main menu"];
      } else if (option.includes("office") || option.includes("location")) {
        replyText = `Our office is located at MDA, Moradabad, Uttar Pradesh, India. We are open Monday to Saturday, 10 AM to 7 PM. You can contact us at +91 ${site.phone}.`;
        nextOptions = ["Book consultation", "Back to main menu"];
      } else if (option.includes("WhatsApp") || option.includes("human")) {
        replyText = "Sure! You can chat directly with our founder on WhatsApp for immediate details.";
        nextOptions = ["Go to WhatsApp", "Back to main menu"];
      } else if (option.includes("Website Development")) {
        replyText = "We build high-performance business sites, landing pages, and ecommerce platforms designed to capture inquiries. All builds load under 2 seconds.";
        nextOptions = ["Request a custom quote", "Back to main menu"];
      } else if (option.includes("AI Automation")) {
        replyText = "We integrate interactive chatbots, CRM systems, and automated WhatsApp replies so you answer customers instantly 24/7.";
        nextOptions = ["Book consultation", "Back to main menu"];
      } else if (option.includes("SEO")) {
        replyText = "Our SEO specialists focus on local maps prominence and search rankings so regional buyers find you before your competitors.";
        nextOptions = ["Book consultation", "Back to main menu"];
      } else if (option.includes("Starter")) {
        replyText = "Starter package (₹14,999) includes a 5-page responsive site, mobile-first design, basic SEO, WhatsApp enquiry integration, and 1 month support.";
        nextOptions = ["Book consultation", "Back to main menu"];
      } else if (option.includes("Growth")) {
        replyText = "Growth package (₹39,999) includes up to 12 pages + blog, custom UI design, Local SEO maps setup, scripted chatbot widget, and 3 months support.";
        nextOptions = ["Book consultation", "Back to main menu"];
      } else if (option.includes("Go to WhatsApp")) {
        window.open(site.whatsapp, "_blank");
        replyText = "Opening WhatsApp chat...";
        nextOptions = ["Back to main menu"];
      } else if (option.includes("quote") || option.includes("consultation") || option.includes("Book")) {
        replyText = "Awesome! Let's get your details. First, what is your full name?";
        setCurrentStep("name");
      } else if (option.includes("Back to main menu")) {
        replyText = "How else can I assist you?";
        nextOptions = initialOptions;
      } else {
        replyText = "I'm not sure about that query, but I can get a growth strategist to call you back.";
        nextOptions = initialOptions;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: replyText,
          options: nextOptions.length > 0 ? nextOptions : undefined,
        },
      ]);
    }, 850);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) return;

    setMessages((prev) => [...prev, { id: Math.random().toString(), sender: "user", text: leadName }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: `Thanks, ${leadName}! What is the best phone number or email address to reach you?`,
        },
      ]);
      setCurrentStep("contact");
    }, 600);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadContact.trim()) return;

    setMessages((prev) => [...prev, { id: Math.random().toString(), sender: "user", text: leadContact }]);
    setIsTyping(true);

    // Simulate lead sync
    setTimeout(() => {
      setIsTyping(false);
      toast.success("Lead captured! We will contact you soon.");
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: "Perfect! We've received your request. A growth strategist will reach out to you via WhatsApp or Email within 24 hours.",
          options: initialOptions,
        },
      ]);
      setLeadName("");
      setLeadContact("");
      setCurrentStep("chat");
    }, 1200);
  };

  return (
    <>
      {/* FLOAT BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat assistant"
        className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-36 left-4 w-[min(380px,90vw)] z-50 rounded-3xl border border-border bg-popover shadow-2xl overflow-hidden flex flex-col h-[480px] transition-all sm:bottom-20 sm:left-6">
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">XGRO Assistant</h4>
                <span className="text-[10px] opacity-75 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close panel">
              <X className="h-5 w-5 opacity-70 hover:opacity-100" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card text-foreground border border-border rounded-tl-none"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Message Options */}
                  {m.options && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOptionClick(opt)}
                          className="w-full text-left rounded-lg border border-border bg-popover px-2.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Input Forms inside chat */}
            {currentStep === "name" && (
              <form onSubmit={handleNameSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Your Name..."
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                />
                <Button size="icon" className="h-8 w-8 shrink-0" type="submit">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}

            {currentStep === "contact" && (
              <form onSubmit={handleContactSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Phone or Email..."
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                />
                <Button size="icon" className="h-8 w-8 shrink-0" type="submit">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-none border border-border bg-card p-3 text-xs flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </>
  );
}
