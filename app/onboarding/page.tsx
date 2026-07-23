"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCOPE_OPTIONS } from "@/lib/controls";
import { Shield, ArrowRight, HelpCircle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { CMMCLevel } from "@/lib/types";

function OnboardingContent() {
  const [step, setStep] = useState<"cui" | "scope">("cui");
  const [cuiChoice, setCuiChoice] = useState<"yes" | "no" | "unsure" | null>(null);
  const [level, setLevel] = useState<CMMCLevel | null>(null);
  const [scope, setScope] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleCUIChoice = (choice: "yes" | "no") => {
    setCuiChoice(choice);
    setLevel(choice === "yes" ? 2 : 1);
  };

  const proceedFromCUI = () => {
    if (!level) return;
    if (level === 2) {
      setStep("scope");
    } else {
      createAssessment(level, []);
    }
  };

  const toggleScope = (value: string) => {
    setScope((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const createAssessment = async (assessmentLevel: CMMCLevel, scopeItems: string[]) => {
    setSaving(true);

    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Find company
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);

    const companyId = companies?.[0]?.id;

    if (!companyId) {
      // Create company if not exists
      const { data: newCompany } = await supabase
        .from("companies")
        .insert({ name: "My Company", owner_user_id: user.id, subscription_status: "unpaid", cmmc_level: assessmentLevel })
        .select("id")
        .single();

      if (newCompany) {
        createAssessmentForCompany(newCompany.id, assessmentLevel);
      }
    } else {
      // Update level
      await supabase.from("companies").update({ cmmc_level: assessmentLevel }).eq("id", companyId);
      createAssessmentForCompany(companyId, assessmentLevel);
    }
  };

  const createAssessmentForCompany = async (companyId: string, assessmentLevel: CMMCLevel) => {
    const supabase = createClient();
    if (!supabase) return;

    const { data: assessment } = await supabase
      .from("assessments")
      .insert({
        company_id: companyId,
        level: assessmentLevel,
        status: "in_progress",
      })
      .select("id")
      .single();

    setSaving(false);

    // Store level in session storage for immediate access
    if (assessment) {
      sessionStorage.setItem("current_assessment_id", assessment.id);
      sessionStorage.setItem("current_level", String(assessmentLevel));
    }

    router.push("/assessment");
  };

  const handleScopeContinue = () => {
    if (scope.length === 0) {
      alert("Please select at least one area where CUI resides.");
      return;
    }
    createAssessment(2, scope);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      {step === "cui" && (
        <div className="card">
          <h2 className="text-2xl font-bold text-navy mb-2">Do You Handle CUI?</h2>
          <p className="text-gray-500 mb-4">
            First, let's figure out which level applies to you. Do your contracts involve
            <strong> Controlled Unclassified Information (CUI)</strong>?
          </p>
          <div className="bg-gray-50 border-l-4 border-gold p-4 rounded-lg mb-4 text-sm text-gray-600">
            <HelpCircle size={16} className="inline text-gold mr-1" />
            CUI includes technical data, engineering drawings, specifications, or any sensitive but unclassified
            information the government gives you. Not sure? Check your contract for DFARS clauses or ask your prime
            contractor.
          </div>
          <div className="space-y-3 mt-5">
            <label
              className={`flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 cursor-pointer transition-all ${
                cuiChoice === "yes" ? "border-navy bg-blue-50" : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => handleCUIChoice("yes")}
            >
              <span className="text-2xl">&#x2705;</span>
              <span>
                <span className="font-medium">Yes, I handle CUI</span>
                <span className="block text-sm text-gray-500">Level 2 track (110 controls)</span>
              </span>
            </label>
            <label
              className={`flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 cursor-pointer transition-all ${
                cuiChoice === "no" ? "border-navy bg-blue-50" : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => handleCUIChoice("no")}
            >
              <span className="text-2xl">&#x274C;</span>
              <span>
                <span className="font-medium">No, only FCI (contract info, payment data)</span>
                <span className="block text-sm text-gray-500">Level 1 track (15 controls)</span>
              </span>
            </label>
          </div>
          {cuiChoice && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">
                <strong>You selected:</strong> {cuiChoice === "yes" ? "Yes — Level 2 track" : "No — Level 1 track"}
              </p>
              <button onClick={proceedFromCUI} disabled={saving} className="btn btn-gold">
                {saving ? "Setting up..." : "Continue"} <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {step === "scope" && (
        <div className="card">
          <h2 className="text-2xl font-bold text-navy mb-2">Where Does Your CUI Live?</h2>
          <p className="text-gray-500 mb-4">
            Check all that apply. We'll use this to tailor your checklist.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6 max-sm:grid-cols-1">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 cursor-pointer transition-all ${
                  scope.includes(opt.value) ? "border-navy bg-blue-50" : "border-transparent hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={scope.includes(opt.value)}
                  onChange={() => toggleScope(opt.value)}
                  className="accent-navy w-4 h-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          <button onClick={handleScopeContinue} disabled={saving} className="btn btn-gold">
            {saving ? "Setting up..." : "Start Checklist"} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}
