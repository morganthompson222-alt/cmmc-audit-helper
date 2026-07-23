export default function PrivacyPage() {
  return (
    <div className="card max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-navy mb-2">Privacy Policy — CMMC Audit Helper</h1>
      <p className="text-sm text-gray-500 mb-6"><strong>Last updated: 23 July 2026</strong></p>

      <p className="mb-4">This Privacy Policy explains how CMMC Audit Helper (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, and protects your information when you use our Service.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">1. Who We Are</h2>
      <p className="mb-4">CMMC Audit Helper is operated by an individual sole trader based in the United Kingdom. This policy is written to comply with UK GDPR and the Data Protection Act 2018.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">2. What Information We Collect</h2>
      <p className="mb-4"><strong>Account information:</strong> name, email address, and password (handled securely via our authentication provider, Supabase).</p>
      <p className="mb-4"><strong>Company/assessment information:</strong> company name, CMMC level, control response statuses, notes you enter, and POA&amp;M item details.</p>
      <p className="mb-4"><strong>Evidence files:</strong> any documents, screenshots, or files you upload as evidence for compliance controls. These may contain sensitive business or security information — please only upload what is necessary and avoid including highly sensitive personal data of third parties within evidence files where possible.</p>
      <p className="mb-4"><strong>Payment information:</strong> payments are processed by Stripe. We do not store your full card details ourselves — Stripe handles this in accordance with its own privacy policy and PCI-DSS compliance obligations.</p>
      <p className="mb-4"><strong>Technical information:</strong> standard technical logs (e.g. IP address, browser type) may be collected automatically for security and debugging purposes.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">3. How We Use Your Information</h2>
      <p className="mb-4">We use your information to:</p>
      <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
        <li>Provide and operate the Service (tracking your assessment progress, generating your compliance package)</li>
        <li>Process payments</li>
        <li>Communicate with you about your account or the Service</li>
        <li>Maintain the security and integrity of the Service</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p className="mb-4">We do not sell your data. We do not use your compliance data or evidence files for any purpose other than providing the Service to you.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">4. Where Your Data Is Stored</h2>
      <p className="mb-4">Your data is stored using Supabase (database and file storage) and processed via Stripe (payments). These providers may store data outside the UK/EEA; where this occurs, appropriate safeguards (such as standard contractual clauses) are relied upon as provided by those services.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">5. Data Retention</h2>
      <p className="mb-4">We retain your account and assessment data for as long as your account is active, or as needed to provide the Service. You may request deletion of your account and associated data at any time (see Section 8). We may retain limited records where required for legal, accounting, or fraud-prevention purposes.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">6. Data Security</h2>
      <p className="mb-4">We take reasonable technical measures to protect your data, including access controls that ensure your company&apos;s data is only accessible to your account (row-level security on our database) and private, access-controlled file storage for evidence uploads. No system is completely secure, and we cannot guarantee absolute security of information transmitted to the Service.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">7. Sharing Your Information</h2>
      <p className="mb-4">We do not share your personal or compliance data with third parties except:</p>
      <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
        <li>Service providers necessary to operate the Service (e.g. Supabase for hosting/storage, Stripe for payment processing)</li>
        <li>Where required by law, regulation, or valid legal process</li>
        <li>With your consent</li>
      </ul>
      <p className="mb-4">We never share your compliance evidence or assessment content with other users or third parties for marketing or any other unrelated purpose.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">8. Your Rights</h2>
      <p className="mb-4">Under UK GDPR, you have the right to:</p>
      <ul className="list-disc pl-5 space-y-1 mb-4 text-sm">
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to or restrict certain processing</li>
        <li>Request a copy of your data in a portable format</li>
      </ul>
      <p className="mb-4">To exercise any of these rights, contact us via the details provided on the Service. We will respond within one month as required by law.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">9. Cookies</h2>
      <p className="mb-4">The Service may use essential cookies necessary for authentication and functionality (e.g. session cookies). We do not currently use third-party advertising or tracking cookies.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">10. Children&apos;s Privacy</h2>
      <p className="mb-4">The Service is intended for business use and is not directed at children. We do not knowingly collect personal data from children.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">11. Changes to This Policy</h2>
      <p className="mb-4">We may update this Privacy Policy from time to time. Material changes will be reflected by an updated &quot;Last updated&quot; date above.</p>

      <h2 className="text-lg font-bold text-navy mt-6 mb-2">12. Contact and Complaints</h2>
      <p className="mb-4">If you have questions or concerns about how your data is handled, please contact us via the details provided on the Service. You also have the right to lodge a complaint with the UK Information Commissioner&apos;s Office (ICO) at ico.org.uk if you believe your data protection rights have been violated.</p>
    </div>
  );
}
