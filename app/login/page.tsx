"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) return;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleMagicLink = async () => {
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) return;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setError("");
      alert("Check your email for a magic link!");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card text-center !p-10">
        <Shield size={48} className="text-gold mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-navy mb-2">Sign In</h1>
        <p className="text-gray-500 text-sm mb-6">Welcome back to CMMC Audit Helper</p>

        {error && <div className="alert alert-danger text-sm mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-left text-sm font-medium text-navy mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-navy"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-left text-sm font-medium text-navy mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-navy"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full !justify-center">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleMagicLink}
            disabled={loading || !email}
            className="text-sm text-navy underline hover:text-navy-light"
          >
            Send Magic Link instead
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-navy font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
