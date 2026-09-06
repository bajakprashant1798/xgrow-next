'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth, AppRole } from '@/lib/auth-context';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('client');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please provide your full name and email');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp({
        fullName,
        email,
        password,
        companyName,
        phone,
        role,
      });

      if (res.success) {
        toast.success(res.message || 'Account created successfully!');
        if (res.role === 'admin' || res.role === 'manager' || res.role === 'developer' || res.role === 'designer' || res.role === 'marketer' || res.role === 'seo_specialist') {
          router.push('/admin');
        } else {
          router.push('/client');
        }
      } else {
        toast.error(res.error || 'Signup failed');
      }
    } catch (err) {
      toast.error('Registration encountered an error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-cyan/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan font-black text-lg shadow-sm">
              X
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-foreground">
              XGRO
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground">
            Create Your Client Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Register your business workspace to collaborate with XGRO.
          </p>
        </div>

        {/* Signup Card */}
        <Card className="rounded-3xl border-border bg-card/80 backdrop-blur-xl shadow-2xl p-2 sm:p-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Account Registration</CardTitle>
            <CardDescription className="text-xs">
              Complete the form below to initialize your secure platform profile.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 h-10 text-xs rounded-xl bg-surface/60"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="e.g. contact@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-9 text-xs rounded-xl bg-surface/60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-9 h-9 text-xs rounded-xl bg-surface/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-cyan" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Company & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Company / Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Acme Health Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl bg-surface/60"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Phone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. +91 63953 19725"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl bg-surface/60"
                    />
                  </div>
                </div>
              </div>

              {/* Verification Notice */}
              <div className="p-3 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-start gap-2.5 text-xs text-foreground/90">
                <Info className="h-4 w-4 text-cyan shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <span className="font-bold text-cyan">Production-Grade Email Verification:</span> A verification link will be routed to your email upon account creation.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs h-10 shadow-md"
              >
                {loading ? 'Creating Profile...' : 'Complete Registration & Enter'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <div className="pt-3 border-t border-border text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-cyan font-bold hover:underline">
                Sign In instead →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <div className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
}
