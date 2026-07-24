"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAllControls, LEVEL1_CONTROLS, LEVEL2_CONTROLS } from "@/lib/controls";
import { calculateCompletionScore } from "@/lib/utils";
import { CMMCLevel, ControlResponse } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import { FileText, ClipboardList, ArrowRight, Clock, Calendar } from "lucide-react";

function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [level, setLevel] = useState<CMMCLevel>(1);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [responses, setResponses] = useState<ControlResponse[]>([]);
  const [hasPaid, setHasPaid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: companies } = await supabase
      .from("cmmc_companies")
      .select("id, name, cmmc_level, subscription_status")
      .eq("owner_user_id", user.id)
      .limit(1);

    if (companies?.[0]) {
      setCompanyName(companies[0].name);
      setLevel((companies[0].cmmc_level as CMMCLevel) || 1);
      setHasPaid(companies[0].subscription_status === "paid");

      const { data: assessment } = await supabase
        .from("cmmc_assessments")
        .select("id, level")
        .eq("company_id", companies[0].id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (assessment?.[0]) {
        setAssessmentId(assessment[0].id);
        setLevel(assessment[0].level as CMMCLevel);

        const { data: resps } = await supabase
          .from("cmmc_control_responses")
          .select("*")
          .eq("assessment_id", assessment[0].id);

        if (resps) setResponses(resps);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  const controls = getAllControls(level);
  const total = controls.length;
  const complete = responses.filter((r) => r.status === "yes").length;
  const inProgress = responses.filter((r) => r.status === "in_progress").length;
  const na = responses.filter((r) => r.status === "not_applicable").length;
  const notStarted = total - complete - inProgress - na;
  const done = complete + na;
  const pct = Math.round((done / (total || 1)) * 100);
  const completionScore = calculateCompletionScore(total, complete, na);

  const daysUntil = Math.ceil(
    (new Date(2026, 10, 10).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">{companyName || "Your CMMC Progress"}</h2>
          <p className="text-gray-500 text-sm">Level {level} &#8226; {total} controls</p>
        </div>
        <div className="flex gap-2">
          <Link href="/assessment" className="btn btn-primary btn-sm">
            <ClipboardList size={16} /> Resume Assessment
          </Link>
          <Link href="/export" className="btn btn-gold btn-sm">
            <FileText size={16} /> Export
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
          <div className="text-3xl font-bold text-navy">{total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Controls</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
          <div className="text-3xl font-bold text-green-600">{done}</div>
          <div className="text-xs text-gray-500 mt-1">Complete (inc. N/A)</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
          <div className="text-3xl font-bold text-navy">{pct}%</div>
          <div className="text-xs text-gray-500 mt-1">Progress</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
          <div className="text-3xl font-bold text-yellow-600">{inProgress}</div>
          <div className="text-xs text-gray-500 mt-1">In Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
          <span className="text-sm font-semibold text-navy">{pct}% complete</span>
        </div>

        {/* Timeline */}
        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gold">
          <div className="flex justify-between flex-wrap gap-2">
            <span>
              <strong>Days until November 10, 2026:</strong>{" "}
              <span className={`font-bold text-lg ${daysUntil < 90 ? "text-red-600" : "text-navy"}`}>
                {daysUntil > 0 ? `${daysUntil} days` : "Passed"}
              </span>
            </span>
            <span className="font-semibold text-navy">
              Assessment Progress: {completionScore}%
            </span>
          </div>
          {daysUntil > 0 && daysUntil < 90 && (
            <p className="text-sm text-red-600 mt-2">
              <Clock size={14} className="inline" /> Deadline approaching — prioritize completion!
            </p>
          )}
          {daysUntil <= 0 && (
            <p className="text-sm text-red-600 mt-2">
              The November 2026 deadline has passed. Seek immediate guidance.
            </p>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{complete}</div>
            <div className="text-xs text-green-600">Complete</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{inProgress}</div>
            <div className="text-xs text-yellow-600">In Progress</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{na}</div>
            <div className="text-xs text-gray-500">Not Applicable</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{notStarted}</div>
            <div className="text-xs text-red-500">Not Started</div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <strong>Quick Tips:</strong>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Evidence is key — screenshots, logs, and policy documents strengthen your assessment.</li>
            <li>Mark controls "In Progress" with a POA&amp;M entry for partial compliance.</li>
            <li>All data is saved automatically and securely in the cloud.</li>
          </ul>
        </div>

        {!hasPaid && pct > 0 && (
          <div className="mt-4 alert alert-info">
            <Calendar size={16} className="inline mr-1" />
            <strong>Export Locked:</strong> Complete your assessment first, then purchase the export package to download
            your SSP, POA&amp;M, and evidence bundle.
            <Link href="/export" className="btn btn-gold btn-sm ml-3">
              Unlock Export <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
