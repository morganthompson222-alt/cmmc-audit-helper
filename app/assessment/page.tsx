"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAllControls } from "@/lib/controls";
import { useToast } from "@/components/Toast";
import { useAutosave } from "@/hooks/useAutosave";
import { MAX_FILE_SIZE, formatBytes } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import { CMMCLevel, Control, ControlResponse, EvidenceFile, POAMItem } from "@/lib/types";
import { Shield, CheckCircle, Clock, Circle, Ban, Paperclip, Upload, X, Save } from "lucide-react";

function AssessmentContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const { saveState: autosaveState, debouncedSave, save } = useAutosave();

  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<CMMCLevel>(1);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Map<string, ControlResponse>>(new Map());
  const [evidenceFiles, setEvidenceFiles] = useState<Map<string, { id: string; name: string; size: number }[]>>(new Map());
  const [poamItems, setPoamItems] = useState<Map<string, any>>(new Map());
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());

  const controls = getAllControls(level);

  useEffect(() => {
    loadAssessment();
  }, []);

  const loadAssessment = async () => {
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
      .from("companies")
      .select("id, cmmc_level")
      .eq("owner_user_id", user.id)
      .limit(1);

    if (!companies?.[0]) {
      router.push("/onboarding");
      return;
    }

    const company = companies[0];
    setCompanyId(company.id);
    setLevel((company.cmmc_level as CMMCLevel) || 1);

    // Find or create assessment
    let { data: assessment } = await supabase
      .from("assessments")
      .select("id, level")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!assessment?.[0]) {
      const { data: newAssessment } = await supabase
        .from("assessments")
        .insert({
          company_id: company.id,
          level: company.cmmc_level || 1,
          status: "in_progress",
        })
        .select("id, level")
        .single();

      assessment = newAssessment ? [newAssessment] : null;
    }

    if (assessment?.[0]) {
      const a = assessment[0];
      setAssessmentId(a.id);
      setLevel(a.level as CMMCLevel);

      // Load responses
      const { data: resps } = await supabase
        .from("control_responses")
        .select("*")
        .eq("assessment_id", a.id);

      const responseMap = new Map<string, ControlResponse>();
      if (resps) {
        resps.forEach((r: ControlResponse) => responseMap.set(r.control_id, r));
      }
      setResponses(responseMap);

      // Load evidence metadata
      const responseIds = resps?.map((r: ControlResponse) => r.id) || [];
      if (responseIds.length > 0) {
        const { data: evidence } = await supabase
          .from("evidence_files")
          .select("*")
          .in("control_response_id", responseIds);

        const evMap = new Map<string, { id: string; name: string; size: number }[]>();
        evidence?.forEach((e: EvidenceFile) => {
          const resp = resps?.find((r: ControlResponse) => r.id === e.control_response_id);
          if (resp) {
            const existing = evMap.get(resp.control_id) || [];
            existing.push({ id: e.id!, name: e.filename, size: e.size_bytes });
            evMap.set(resp.control_id, existing);
          }
        });
        setEvidenceFiles(evMap);
      }

      // Load POA&M
      if (responseIds.length > 0) {
        const { data: poams } = await supabase
          .from("poam_items")
          .select("*")
          .in("control_response_id", responseIds);

        const poamMap = new Map<string, any>();
        poams?.forEach((p: POAMItem) => {
          const resp = resps?.find((r: ControlResponse) => r.id === p.control_response_id);
          if (resp) poamMap.set(resp.control_id, p);
        });
        setPoamItems(poamMap);
      }
    }

    setLoading(false);
  };

  const getOrCreateResponse = useCallback(
    async (controlId: string): Promise<ControlResponse | null> => {
      if (!assessmentId) return null;

      const supabase = createClient();
      if (!supabase) return null;

      const existing = responses.get(controlId);
      if (existing) return existing;

      const { data: newResp } = await supabase
        .from("control_responses")
        .insert({
          assessment_id: assessmentId,
          control_id: controlId,
          status: "not_started",
          notes: "",
        })
        .select("*")
        .single();

      if (newResp) {
        setResponses((prev) => {
          const next = new Map(prev);
          next.set(controlId, newResp);
          return next;
        });
        return newResp;
      }

      return null;
    },
    [assessmentId, responses]
  );

  const setControlStatus = useCallback(
    async (controlId: string, status: string) => {
      const supabase = createClient();
      if (!supabase) return;
      const resp = await getOrCreateResponse(controlId);
      if (!resp) return;

      debouncedSave(async () => {
        const { error } = await supabase
          .from("control_responses")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", resp.id);

        if (error) throw error;

        setResponses((prev) => {
          const next = new Map(prev);
          const current = next.get(controlId);
          if (current) next.set(controlId, { ...current, status: status as any });
          return next;
        });

        // Handle POA&M
        if (status === "in_progress") {
          await supabase.from("poam_items").upsert(
            {
              control_response_id: resp.id,
              description: "",
              status: "open",
            },
            { onConflict: "control_response_id" }
          );
        } else {
          await supabase.from("poam_items").delete().eq("control_response_id", resp.id);
          setPoamItems((prev) => {
            const next = new Map(prev);
            next.delete(controlId);
            return next;
          });
        }
      });
    },
    [assessmentId, getOrCreateResponse, debouncedSave]
  );

  const updateNotes = useCallback(
    async (controlId: string, notes: string) => {
      const supabase = createClient();
      if (!supabase) return;
      const resp = await getOrCreateResponse(controlId);
      if (!resp) return;

      debouncedSave(async () => {
        const { error } = await supabase
          .from("control_responses")
          .update({ notes, updated_at: new Date().toISOString() })
          .eq("id", resp.id);

        if (error) throw error;

        setResponses((prev) => {
          const next = new Map(prev);
          const current = next.get(controlId);
          if (current) next.set(controlId, { ...current, notes });
          return next;
        });
      });
    },
    [assessmentId, getOrCreateResponse, debouncedSave]
  );

  const handleFileUpload = useCallback(
    async (controlId: string, files: FileList | null) => {
      if (!files || !companyId) return;

      const supabase = createClient();
      if (!supabase) return;
      const resp = await getOrCreateResponse(controlId);
      if (!resp) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          addToast(`File "${file.name}" exceeds 20MB limit.`, "error");
          continue;
        }

        const storagePath = `${companyId}/evidence/${resp.id}/${Date.now()}_${file.name}`;

        await save(async () => {
          const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(storagePath, file);

          if (uploadError) throw uploadError;

          const { data: evRecord } = await supabase
            .from("evidence_files")
            .insert({
              control_response_id: resp.id,
              storage_path: storagePath,
              filename: file.name,
              mime_type: file.type,
              size_bytes: file.size,
            })
            .select("id")
            .single();

          if (evRecord) {
            setEvidenceFiles((prev) => {
              const next = new Map(prev);
              const existing = next.get(controlId) || [];
              next.set(controlId, [
                ...existing,
                { id: evRecord.id, name: file.name, size: file.size },
              ]);
              return next;
            });
          }
        });

        addToast(`"${file.name}" uploaded.`, "success");
      }
    },
    [companyId, getOrCreateResponse, save, addToast]
  );

  const removeEvidence = useCallback(
    async (controlId: string, fileId: string) => {
      const supabase = createClient();
      if (!supabase) return;
      const resp = responses.get(controlId);
      if (!resp) return;

      await save(async () => {
        const { data: files } = await supabase
          .from("evidence_files")
          .select("storage_path")
          .eq("id", fileId)
          .single();

        if (files?.storage_path) {
          await supabase.storage.from("evidence").remove([files.storage_path]);
        }

        await supabase.from("evidence_files").delete().eq("id", fileId);

        setEvidenceFiles((prev) => {
          const next = new Map(prev);
          const existing = next.get(controlId) || [];
          next.set(
            controlId,
            existing.filter((f) => f.id !== fileId)
          );
          return next;
        });
      });

      addToast("Evidence removed.", "info");
    },
    [responses, save, addToast]
  );

  const savePOAM = useCallback(
    async (controlId: string, description: string, responsible: string, date: string) => {
      const supabase = createClient();
      if (!supabase) return;
      const resp = responses.get(controlId);
      if (!resp) return;

      debouncedSave(async () => {
        const { error } = await supabase.from("poam_items").upsert(
          {
            control_response_id: resp.id,
            description,
            responsible_party: responsible,
            target_date: date || null,
            status: "open",
          },
          { onConflict: "control_response_id" }
        );

        if (error) throw error;

        setPoamItems((prev) => {
          const next = new Map(prev);
          next.set(controlId, { description, responsible, date, status: "open" });
          return next;
        });
      });
    },
    [responses, debouncedSave]
  );

  // Compute stats
  const total = controls.length;
  const responseArray = Array.from(responses.values());
  const complete = responseArray.filter((r) => r.status === "yes").length;
  const inProgress = responseArray.filter((r) => r.status === "in_progress").length;
  const na = responseArray.filter((r) => r.status === "not_applicable").length;
  const done = complete + na;
  const pct = Math.round((done / (total || 1)) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "yes":
        return <CheckCircle size={16} className="text-green-600" />;
      case "in_progress":
        return <Clock size={16} className="text-yellow-600" />;
      case "not_applicable":
        return <Ban size={16} className="text-gray-500" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Control Checklist</h2>
          <p className="text-gray-500 text-sm">
            Level {level} &#8226; {total} controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          {autosaveState.status === "saving" && (
            <span className="text-xs text-yellow-600 flex items-center gap-1">
              <Save size={12} className="animate-pulse" /> Saving...
            </span>
          )}
          {autosaveState.status === "saved" && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle size={12} /> Saved
            </span>
          )}
          {autosaveState.status === "error" && (
            <span className="text-xs text-red-600">Save failed</span>
          )}
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-4 flex-wrap mb-5">
        <span className="text-sm font-semibold">
          {done} / {total} complete
        </span>
        <div className="flex-1 min-w-[120px] h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-navy rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500">{pct}%</span>
      </div>

      {/* Controls */}
      <div className="space-y-5">
        {controls.map((ctrl) => {
          const resp = responses.get(ctrl.id);
          const status = resp?.status || "not_started";
          const evFiles = evidenceFiles.get(ctrl.id) || [];
          const poam = poamItems.get(ctrl.id);

          return (
            <div
              key={ctrl.id}
              className={`bg-white rounded-xl p-6 border-l-4 transition-all ${
                status === "yes" ? "border-green-500 bg-green-50/30" : "border-navy"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-2 flex-wrap mb-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-bold text-navy">
                    {ctrl.control_id}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 uppercase tracking-wide">{ctrl.domain}</span>
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {getStatusIcon(status)}
                  {status === "yes"
                    ? "Complete"
                    : status === "in_progress"
                    ? "In Progress"
                    : status === "not_applicable"
                    ? "N/A"
                    : "Not Started"}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-3">{ctrl.question}</h3>

              <div className="text-sm text-gray-700 mb-2">
                <strong>What good looks like:</strong> {ctrl.good}
              </div>
              <div className="bg-red-50 border-l-2 border-red-500 p-3 rounded text-sm mb-4">
                <strong>Common mistake:</strong> {ctrl.mistake}
              </div>

              {/* Status Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { value: "yes", label: "Yes", icon: <CheckCircle size={14} />, activeClass: "bg-green-600 text-white border-green-600" },
                  { value: "in_progress", label: "In Progress", icon: <Clock size={14} />, activeClass: "bg-yellow-500 text-white border-yellow-500" },
                  { value: "not_started", label: "Not Started", icon: <Circle size={14} />, activeClass: "" },
                  { value: "not_applicable", label: "N/A", icon: <Ban size={14} />, activeClass: "bg-gray-500 text-white border-gray-500" },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setControlStatus(ctrl.id, btn.value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${
                      status === btn.value
                        ? btn.activeClass
                        : "bg-white border-gray-300 hover:border-navy"
                    }`}
                  >
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>

              {/* Evidence Upload */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3 transition-colors hover:border-gold">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy mb-2">
                  <Paperclip size={14} /> Evidence ({ctrl.evidence_required ? "required" : "optional"})
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,.log"
                    onChange={(e) => handleFileUpload(ctrl.id, e.target.files)}
                    className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-navy file:text-white hover:file:bg-navy-light"
                  />
                  <span className="text-xs text-gray-500">PDF, images, Word, Excel, logs &#8226; Max 20MB</span>
                </div>
                {evFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {evFiles.map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs"
                      >
                        <Paperclip size={12} /> {f.name} ({formatBytes(f.size)})
                        <button
                          onClick={() => removeEvidence(ctrl.id, f.id)}
                          className="text-red-600 font-bold ml-1 hover:text-red-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">{ctrl.evidence_guidance}</div>
              </div>

              {/* Notes */}
              <div className="mb-3">
                <textarea
                  placeholder="Add notes about this control (optional)..."
                  defaultValue={resp?.notes || ""}
                  onChange={(e) => updateNotes(ctrl.id, e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm resize-y min-h-[50px] focus:outline-none focus:border-navy transition-colors"
                ></textarea>
              </div>

              {/* POA&M Form */}
              {status === "in_progress" && (
                <div className="bg-yellow-50 border-l-3 border-yellow-500 p-3 rounded-lg mt-3">
                  <strong className="text-sm">POA&amp;M Required</strong> — Describe your remediation plan:
                  <div className="flex flex-wrap gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Remediation description"
                      defaultValue={poam?.description || ""}
                      id={`poam-desc-${ctrl.id}`}
                      className="flex-[2] min-w-[140px] p-1.5 text-sm border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Responsible party"
                      defaultValue={poam?.responsible_party || ""}
                      id={`poam-resp-${ctrl.id}`}
                      className="flex-1 min-w-[100px] p-1.5 text-sm border border-gray-300 rounded"
                    />
                    <input
                      type="date"
                      defaultValue={poam?.target_date || ""}
                      id={`poam-date-${ctrl.id}`}
                      className="flex-[0.7] min-w-[120px] p-1.5 text-sm border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => {
                        const desc = (document.getElementById(`poam-desc-${ctrl.id}`) as HTMLInputElement)?.value || "";
                        const resp = (document.getElementById(`poam-resp-${ctrl.id}`) as HTMLInputElement)?.value || "";
                        const date = (document.getElementById(`poam-date-${ctrl.id}`) as HTMLInputElement)?.value || "";
                        savePOAM(ctrl.id, desc, resp, date);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Save POA&amp;M
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between flex-wrap gap-3 mt-6">
        <Link href="/dashboard" className="btn btn-outline btn-sm">
          Dashboard
        </Link>
        <Link href="/export" className="btn btn-gold">
          View Export Package
        </Link>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <AuthGuard>
      <AssessmentContent />
    </AuthGuard>
  );
}
