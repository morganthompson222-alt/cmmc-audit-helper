"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Shield } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create company record
      const { error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          owner_user_id: data.user.id,
          subscription_status: "unpaid",
        });

      if (companyError) {
        console.error("Failed to create company:", companyError);
      }
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card text-center !p-10">
        <Shield size={48} className="text-gold mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-navy mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm mb-6">Start your CMMC self-assessment</p>

        {error && <div className="alert alert-danger text-sm mb-4">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-left text-sm font-medium text-navy mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-navy"
              placeholder="Your Company LLC"
            />
          </div>
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
              minLength={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-navy"
              placeholder="Minimum 8 characters"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full !justify-center">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-navy font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
