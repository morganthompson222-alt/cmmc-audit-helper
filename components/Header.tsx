"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="bg-navy text-white py-4 px-7 flex items-center justify-between flex-wrap gap-3 border-b-2 border-gold sticky top-0 z-50 shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
      <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-wide no-underline text-white">
        <Shield className="text-gold" size={28} />
        <span>CMMC Audit Helper</span>
        <span className="bg-gold text-navy px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">v2.0</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {!loading && (
          <>
            {user ? (
              <>
                <Link href="/dashboard" className="text-white/90 hover:text-white no-underline">
                  Dashboard
                </Link>
                <Link href="/assessment" className="text-white/90 hover:text-white no-underline">
                  Assessment
                </Link>
                <Link href="/export" className="text-white/90 hover:text-white no-underline">
                  Export
                </Link>
                <span className="opacity-40">|</span>
                <span className="text-white/80 text-xs">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-transparent text-white/80 border border-white/30 rounded px-3 py-1 text-xs cursor-pointer hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white/90 hover:text-white no-underline">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gold text-navy px-4 py-1.5 rounded text-sm font-semibold no-underline hover:bg-[#c49a3a] transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}
