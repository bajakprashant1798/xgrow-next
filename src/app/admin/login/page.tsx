'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your admin or team email');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        if (res.role === 'admin' || res.role === 'manager' || res.role === 'developer' || res.role === 'designer' || res.role === 'marketer' || res.role === 'seo_specialist') {
          toast.success(`Welcome back to XGRO Admin Control Center!`);
          router.push('/admin');
        } else {
          toast.success('Welcome back to your Client Portal!');
          router.push('/client');
        }
      } else {
        toast.error(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      toast.error('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
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
            Sign In to Platform
          </h1>
          <p className="text-xs text-muted-foreground">
            Sign in with your email to access your role-based dashboard.
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="rounded-3xl border-border bg-card/80 backdrop-blur-xl shadow-2xl p-4 sm:p-6">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-base font-bold">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to continue to your dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="e.g. name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-10 text-xs rounded-xl bg-surface/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-10 text-xs rounded-xl bg-surface/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs h-10 shadow-md"
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <div className="pt-3 border-t border-border text-center text-xs text-muted-foreground">
              Don't have an account yet?{' '}
              <Link href="/signup" className="text-cyan font-bold hover:underline">
                Create Account / Register →
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
