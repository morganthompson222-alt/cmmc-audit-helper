"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAllControls } from "@/lib/controls";
import { calculateSPRSScore } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import { CMMCLevel, ControlResponse, Control } from "@/lib/types";
import {
  FileText,
  ClipboardList,
  Download,
  Lock,
  Shield,
  CheckCircle,
  Clock,
  Circle,
  Ban,
  Package,
  Loader2,
} from "lucide-react";

function ExportContent() {
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [level, setLevel] = useState<CMMCLevel>(1);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [responses, setResponses] = useState<ControlResponse[]>([]);
  const [poamItems, setPoamItems] = useState<any[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, cmmc_level, subscription_status")
      .eq("owner_user_id", user.id)
      .limit(1);

    if (!companies?.[0]) {
      router.push("/onboarding");
      return;
    }

    const company = companies[0];
    setCompanyName(company.name);
    setCompanyId(company.id);
    setLevel((company.cmmc_level as CMMCLevel) || 1);
    setHasPaid(company.subscription_status === "paid");

    const { data: assessment } = await supabase
      .from("assessments")
      .select("id")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!assessment?.[0]) {
      setLoading(false);
      return;
    }

    const a = assessment[0];
    setAssessmentId(a.id);

    const { data: resps } = await supabase
      .from("control_responses")
      .select("*")
      .eq("assessment_id", a.id);

    if (resps) setResponses(resps);

    if (resps?.length) {
      const responseIds = resps.map((r) => r.id);
      const { data: poams } = await supabase
        .from("poam_items")
        .select("*")
        .in("control_response_id", responseIds);

      if (poams) setPoamItems(poams);
    }

    setLoading(false);
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        addToast("Failed to start checkout. Please try again.", "error");
      }
    } catch (err) {
      addToast("Checkout error. Please try again.", "error");
    }
    setCheckingOut(false);
  };

  const generateTextContent = useCallback(
    (controls: Control[]) => {
      const total = controls.length;
      const complete = responses.filter((r) => r.status === "yes").length;
      const inProgress = responses.filter((r) => r.status === "in_progress").length;
      const na = responses.filter((r) => r.status === "not_applicable").length;
      const notStarted = total - complete - inProgress - na;
      const sprsScore = calculateSPRSScore(total, complete, na);

      // SSP content
      let ssp = "SYSTEM SECURITY PLAN (SSP)\n";
      ssp += "=".repeat(60) + "\n\n";
      ssp += `Company: ${companyName}\n`;
      ssp += `CMMC Level: ${level}\n`;
      ssp += `Date: ${new Date().toLocaleDateString()}\n`;
      ssp += `SPRS Score: ${sprsScore}%\n\n`;
      ssp += "CONTROL STATUS SUMMARY\n";
      ssp += "-".repeat(40) + "\n";
      ssp += `Total Controls: ${total}\n`;
      ssp += `Complete: ${complete}\n`;
      ssp += `In Progress: ${inProgress}\n`;
      ssp += `Not Applicable: ${na}\n`;
      ssp += `Not Started: ${notStarted}\n\n`;
      ssp += "DETAILED CONTROL STATUS\n";
      ssp += "-".repeat(40) + "\n";

      controls.forEach((c) => {
        const r = responses.find((resp) => resp.control_id === c.id);
        const status = r?.status || "not_started";
        const notes = r?.notes || "";
        ssp += `${c.control_id} [${c.domain}]: ${status.toUpperCase()}`;
        if (notes) ssp += ` — Notes: ${notes}`;
        ssp += "\n";
        ssp += `  Q: ${c.question}\n`;
        ssp += `  Good: ${c.good}\n\n`;
      });

      // Cover page
      let cover = "CMMC COMPLIANCE PACKAGE\n";
      cover += "=".repeat(60) + "\n\n";
      cover += "DISCLAIMER\n";
      cover += "-".repeat(40) + "\n";
      cover += "This package is a self-assessment aid to prepare for CMMC compliance.\n";
      cover += "It is not a certification and does not replace a C3PAO assessment.\n";
      cover += "Submission of false claims to SPRS may result in penalties under the\n";
      cover += "False Claims Act (31 U.S.C. §§ 3729-3733).\n\n";
      cover += `Generated: ${new Date().toLocaleString()}\n`;
      cover += `Company: ${companyName}\n`;
      cover += `Level: ${level}\n`;
      cover += `SPRS Score: ${sprsScore}%\n`;

      // POA&M content
      let poam = "PLAN OF ACTION & MILESTONES (POA&M)\n";
      poam += "=".repeat(60) + "\n\n";
      poam += `Company: ${companyName}\n`;
      poam += `Date: ${new Date().toLocaleDateString()}\n`;
      poam += `Total Open Items: ${poamItems.length}\n\n`;

      const openPoamItems = poamItems.filter((p) => p.status === "open");
      if (openPoamItems.length === 0) {
        poam += "No open POA&M items.\n";
      } else {
        openPoamItems.forEach((p) => {
          const ctrlResp = responses.find((r) => r.id === p.control_response_id);
          const ctrl = controls.find((c) => c.id === ctrlResp?.control_id);
          poam += `--- ${ctrl?.control_id || "Unknown"} ---\n`;
          poam += `  Domain: ${ctrl?.domain || "N/A"}\n`;
          poam += `  Question: ${ctrl?.question || "N/A"}\n`;
          poam += `  Description: ${p.description || "N/A"}\n`;
          poam += `  Responsible Party: ${p.responsible_party || "N/A"}\n`;
          poam += `  Target Date: ${p.target_date || "N/A"}\n`;
          poam += `  Status: ${p.status}\n\n`;
        });
      }

      return { ssp, cover, poam };
    },
    [responses, poamItems, companyName, level]
  );

  const downloadZip = async () => {
    setGenerating(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const controls = getAllControls(level);
      const { ssp, cover, poam } = generateTextContent(controls);

      // Add text files as PDF-like content (using .txt since we can't render real PDFs in the browser easily)
      // For production, replace with real PDF generation
      zip.file("SSP_Summary.txt", ssp);
      zip.file("POAM.txt", poam);
      zip.file("README.txt", cover);

      // Fetch evidence files from Supabase Storage
      if (assessmentId && companyId) {
        const { data: allResponses } = await supabase
          .from("control_responses")
          .select("id, control_id")
          .eq("assessment_id", assessmentId);

        if (allResponses?.length) {
          const responseIds = allResponses.map((r) => r.id);

          const { data: evidence } = await supabase
            .from("evidence_files")
            .select("*")
            .in("control_response_id", responseIds);

          if (evidence?.length) {
            const evidenceFolder = zip.folder("evidence");

            for (const ev of evidence) {
              try {
                const { data: blob } = await supabase.storage
                  .from("evidence")
                  .download(ev.storage_path);

                if (blob && evidenceFolder) {
                  const ctrlResp = allResponses.find(
                    (r) => r.id === ev.control_response_id
                  );
                  const ctrlId = ctrlResp?.control_id || "unknown";
                  evidenceFolder.file(`${ctrlId}/${ev.filename}`, blob);
                }
              } catch (e) {
                console.warn(`Failed to download evidence: ${ev.filename}`, e);
              }
            }
          }
        }
      }

      // Generate and download
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CMMC_Compliance_Package_${companyName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast("Compliance package downloaded!", "success");
    } catch (err) {
      console.error("Zip generation failed:", err);
      addToast("Failed to generate package. Please try again.", "error");
    }

    setGenerating(false);
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
  const na = responses.filter((r) => r.status === "not_applicable").length;
  const inProgress = responses.filter((r) => r.status === "in_progress").length;
  const sprsScore = calculateSPRSScore(total, complete, na);
  const openPoamCount = poamItems.filter((p) => p.status === "open").length;

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="card text-center !p-10">
        <Package size={64} className="text-gold mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-navy mb-2">Compliance Package</h1>
        <p className="text-gray-500 mb-6">Your export is ready for download.</p>
      </div>

      {/* Package Contents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex items-center gap-3">
          <FileText size={32} className="text-navy" />
          <div>
            <div className="font-semibold">System Security Plan (SSP)</div>
            <div className="text-xs text-gray-500">
              Auto-generated, all {total} controls
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex items-center gap-3">
          <ClipboardList size={32} className="text-navy" />
          <div>
            <div className="font-semibold">Plan of Action &amp; Milestones</div>
            <div className="text-xs text-gray-500">{openPoamCount} open items</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex items-center gap-3">
          <Shield size={32} className="text-navy" />
          <div>
            <div className="font-semibold">SPRS Score Sheet</div>
            <div className="text-xs text-gray-500">Score: {sprsScore}%</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex items-center gap-3">
          <Download size={32} className="text-navy" />
          <div>
            <div className="font-semibold">Evidence Bundle</div>
            <div className="text-xs text-gray-500">Organized by control</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="card">
        <h3 className="font-bold text-navy mb-4">Assessment Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-navy">{total}</div>
            <div className="text-xs text-gray-500">Total Controls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{complete}</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{inProgress}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{na}</div>
            <div className="text-xs text-gray-500">N/A</div>
          </div>
        </div>
      </div>

      {/* Paywall or Download */}
      <div className="card text-center">
        {!hasPaid ? (
          <>
            <Lock size={48} className="text-gold mx-auto mb-3" />
            <h3 className="text-xl font-bold text-navy mb-2">Unlock Your Export Package</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Your assessment is complete. Pay once to download your full compliance package with SSP, POA&amp;M, and
              all evidence files.
            </p>
            <div className="text-2xl font-bold text-navy mb-4">&pound;1,000</div>
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="btn btn-gold !text-lg !px-10 !py-3"
            >
              {checkingOut ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Redirecting to Checkout...
                </>
              ) : (
                <>
                  <Lock size={18} /> Pay &amp; Unlock Export
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Secure payment via Stripe. One-time payment, no subscription.
            </p>
          </>
        ) : (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-navy mb-2">Export Ready</h3>
            <p className="text-gray-500 mb-6">
              Your payment has been received. Download your complete compliance package below.
            </p>
            <button
              onClick={downloadZip}
              disabled={generating}
              className="btn btn-gold !text-lg !px-10 !py-3"
            >
              {generating ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Generating Package...
                </>
              ) : (
                <>
                  <Download size={20} /> Download Compliance Package (.zip)
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div className="alert alert-danger mt-4">
        <strong>Important Disclaimer:</strong> This package is a self-assessment preparation tool. It is not a
        certification and does not replace a C3PAO assessment. Misrepresenting your security posture in SPRS can lead
        to severe fines and penalties under the False Claims Act. Please attest only to what you have actually
        implemented.
      </div>
    </div>
  );
}

export default function ExportPage() {
  return (
    <AuthGuard>
      <ExportContent />
    </AuthGuard>
  );
}
