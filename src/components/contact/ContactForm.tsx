"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { getServices, subscribeToDataChanges } from "@/lib/db";
import { services as fallbackServices } from "@/lib/site";
import { ServiceModel } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number").regex(/^[0-9+ ]+$/, "Only numbers and + are allowed"),
  serviceNeeded: z.string().min(1, "Please select the service of interest"),
  details: z.string().min(10, "Please share some details about your project (minimum 10 characters)"),
});

type ContactFormInput = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [servicesList, setServicesList] = useState<ServiceModel[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormInput, string>>>({});
  const [formData, setFormData] = useState<ContactFormInput>({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    serviceNeeded: "",
    details: "",
  });

  const loadServices = async () => {
    const data = await getServices();
    const published = data.filter((s) => s.status === "published");
    setServicesList(published.length > 0 ? published : (fallbackServices as any));
  };

  useEffect(() => {
    loadServices();
    return subscribeToDataChanges(loadServices);
  }, []);

  const displayServices = servicesList.length > 0 ? servicesList : (fallbackServices as any);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on input edit
    if (errors[name as keyof ContactFormInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ContactFormInput, string>> = {};
      validation.error.issues.forEach((err) => {
        const field = err.path[0] as keyof ContactFormInput;
        if (field) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Consultation booked! A growth expert will contact you within 24 hours.");
      setFormData({
        name: "",
        businessName: "",
        email: "",
        phone: "",
        serviceNeeded: "",
        details: "",
      });
    } catch {
      toast.error("Something went wrong. Please check your connection or contact us via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
      <h3 className="text-xl font-bold text-foreground">Schedule Your Free Growth Consultation</h3>
      <p className="text-xs text-muted-foreground">
        We'll audit your current site, evaluate your search competitors, and outline a strategy call.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-foreground">
            Your Name *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Karan Patel"
            className="mt-2 h-11"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="businessName" className="block text-sm font-semibold text-foreground">
            Business Name (Optional)
          </label>
          <Input
            id="businessName"
            name="businessName"
            type="text"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="My Retail Shop"
            className="mt-2 h-11"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground">
            Email Address *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="karan@gmail.com"
            className="mt-2 h-11"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-foreground">
            Phone Number *
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="6395319725"
            className="mt-2 h-11"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="serviceNeeded" className="block text-sm font-semibold text-foreground">
          Primary Service Needed *
        </label>
        <select
          id="serviceNeeded"
          name="serviceNeeded"
          required
          value={formData.serviceNeeded}
          onChange={handleChange}
          className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-11 text-foreground"
        >
          <option value="">Select a service...</option>
          {displayServices.map((s: any) => (
            <option key={s.id || s.slug} value={s.title}>
              {s.title}
            </option>
          ))}
          <option value="Other">Other Custom Automation</option>
        </select>
        {errors.serviceNeeded && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.serviceNeeded}</p>}
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-foreground">
          Briefly Describe Your Project *
        </label>
        <Textarea
          id="details"
          name="details"
          required
          value={formData.details}
          onChange={handleChange}
          placeholder="E.g., We need a direct booking hotel site with local SEO set up..."
          className="mt-2 min-h-28"
        />
        {errors.details && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.details}</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full h-11 rounded-full">
        {loading ? "Scheduling Consultation..." : "Submit Consultation Request"}
      </Button>
    </form>
  );
}
