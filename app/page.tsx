import Link from "next/link";
import { Shield, FileText, ListChecks, CloudUpload, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="card text-center !p-12">
        <div className="text-6xl text-gold mb-4">
          <Shield size={72} className="mx-auto" />
        </div>
        <h1 className="text-[2.2rem] font-bold text-navy mb-3">Welcome to CMMC Audit Helper</h1>
        <p className="text-lg text-gray-500 max-w-[600px] mx-auto mb-5">
          Your step-by-step guide to completing your DoD cybersecurity paperwork. No tech experience needed. Just answer
          questions and upload files. We'll handle the rest.
        </p>
        <div className="alert alert-info max-w-[600px] mx-auto mb-7 text-left">
          <strong>Phase 2 Suspension Notice:</strong> As of July 13, 2026, the DoD has suspended mandatory C3PAO
          certification for Level 2 contracts pending review. However, <strong>self-assessment requirements remain in full
          effect.</strong> Complete your paperwork now to stay ahead.
        </div>
        <Link href="/signup" className="btn btn-gold !justify-center max-w-[320px] mx-auto !text-lg !px-10">
          Start Your Audit <ArrowRight size={20} />
        </Link>
        <p className="text-xs text-gray-500 mt-4">Average time: 2–4 hours &bull; All data securely stored</p>
      </section>

      {/* Feature Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-2">
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 text-center">
          <FileText size={28} className="text-navy mx-auto mb-1" />
          <div className="font-semibold">SSP Generator</div>
          <div className="text-xs text-gray-500">Auto-generated System Security Plan</div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 text-center">
          <ListChecks size={28} className="text-navy mx-auto mb-1" />
          <div className="font-semibold">125+ Controls</div>
          <div className="text-xs text-gray-500">Level 1 &amp; Level 2 coverage</div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 text-center">
          <CloudUpload size={28} className="text-navy mx-auto mb-1" />
          <div className="font-semibold">Evidence Upload</div>
          <div className="text-xs text-gray-500">Drag &amp; drop file management</div>
        </div>
      </div>

      {/* Pricing */}
      <section className="card mt-8 text-center">
        <h2 className="text-2xl font-bold text-navy mb-2">Pricing</h2>
        <p className="text-gray-500 mb-6">One payment. Complete compliance package. No subscription.</p>
        <div className="inline-block bg-navy-light text-white rounded-xl p-8 max-w-sm mx-auto">
          <div className="text-gold text-4xl font-bold">&pound;1,000</div>
          <div className="text-white/80 text-sm mt-1">per assessment package</div>
          <ul className="text-left text-sm mt-6 space-y-2">
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Full SSP &amp; POA&amp;M documentation</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Assessment progress sheet</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Evidence bundle organized by control</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /> Pay only when ready to export</li>
          </ul>
          <Link href="/signup" className="btn btn-gold !justify-center mt-6 w-full">
            Get Started
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4 max-w-lg mx-auto">
          <strong>This is a self-assessment preparation tool.</strong> It is not a certification and does not replace a C3PAO
          assessment. Submission of false claims to SPRS may result in penalties under the False Claims Act.
        </p>
      </section>

      {/* How It Works */}
      <section className="card mt-8">
        <h2 className="text-2xl font-bold text-navy mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          {[
            { step: "1", title: "Sign Up", desc: "Create your free account in 30 seconds" },
            { step: "2", title: "Determine Your Level", desc: "We'll help you determine if you need Level 1 or Level 2" },
            { step: "3", title: "Work Through Controls", desc: "Answer questions about 15 or 110+ controls with guidance" },
            { step: "4", title: "Upload Evidence", desc: "Drag and drop supporting files for each control" },
            { step: "5", title: "Generate Package", desc: "Pay once and download your complete compliance package" },
            { step: "6", title: "Upload to SPRS", desc: "Submit your self-assessment score to the DoD" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 bg-navy text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">
                {item.step}
              </div>
              <div className="font-semibold text-navy">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
