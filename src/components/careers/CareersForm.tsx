"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { jobs } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const careerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  portfolio: z.string().refine((val) => val === "" || /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(val), {
    message: "Please enter a valid portfolio or LinkedIn URL (including http/https)",
  }),
  about: z.string().min(15, "Please tell us about yourself (minimum 15 characters)"),
});

type CareerFormInput = z.infer<typeof careerSchema>;

export function CareersForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CareerFormInput, string>>>({});
  const [formData, setFormData] = useState<CareerFormInput>({
    name: "",
    email: "",
    role: "",
    portfolio: "",
    about: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on type
    if (errors[name as keyof CareerFormInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = careerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CareerFormInput, string>> = {};
      validation.error.issues.forEach((err) => {
        const field = err.path[0] as keyof CareerFormInput;
        if (field) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      toast.error("Please correct the errors in the form.");
      return;
    }

    // Simulate API lead ingestion
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Application received! We'll review your details and contact you shortly.");
      setFormData({
        name: "",
        email: "",
        role: "",
        portfolio: "",
        about: "",
      });
    } catch {
      toast.error("Something went wrong. Please email xgro.services@gmail.com directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitApplication} className="space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
      <h3 className="text-xl font-bold text-foreground">Submit Your Application</h3>
      <p className="text-xs text-muted-foreground">
        We review applications weekly. Standard response time is 3–5 working days.
      </p>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-foreground">
          Full Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Aarav Sharma"
          className="mt-2 h-11"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-foreground">
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="aarav@gmail.com"
          className="mt-2 h-11"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-semibold text-foreground">
          Position of Interest
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-11 text-foreground"
        >
          <option value="">Select a position...</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.title}>
              {j.title}
            </option>
          ))}
          <option value="Other">Other / General Inquiry</option>
        </select>
        {errors.role && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.role}</p>}
      </div>

      <div>
        <label htmlFor="portfolio" className="block text-sm font-semibold text-foreground">
          Portfolio or LinkedIn URL (Optional)
        </label>
        <Input
          id="portfolio"
          name="portfolio"
          type="text"
          value={formData.portfolio}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/aaravsharma"
          className="mt-2 h-11"
        />
        {errors.portfolio && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.portfolio}</p>}
      </div>

      <div>
        <label htmlFor="about" className="block text-sm font-semibold text-foreground">
          Introduce Yourself & Relevant Skills
        </label>
        <Textarea
          id="about"
          name="about"
          value={formData.about}
          onChange={handleChange}
          placeholder="Briefly describe your stack, experience, or design achievements..."
          className="mt-2 min-h-32"
        />
        {errors.about && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.about}</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full h-11 rounded-full">
        {loading ? "Submitting Application..." : "Submit Application"}
      </Button>
    </form>
  );
}
