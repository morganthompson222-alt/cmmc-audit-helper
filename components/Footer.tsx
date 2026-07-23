import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center py-4 px-5 text-xs text-gray-500 border-t border-gray-200 bg-white mt-auto">
      <strong>Disclaimer:</strong> CMMC Audit Helper is a self-assessment preparation tool. It is not a certification and does not replace a C3PAO assessment. Submission of false claims to SPRS may result in penalties under the False Claims Act.
      {" "}&bull;{" "}Not affiliated with the DoD.
      <br className="mb-1" />
      <Link href="/terms" className="text-gray-500 hover:text-navy underline">Terms</Link>
      {" "}&bull;{" "}
      <Link href="/privacy" className="text-gray-500 hover:text-navy underline">Privacy Policy</Link>
    </footer>
  );
}
