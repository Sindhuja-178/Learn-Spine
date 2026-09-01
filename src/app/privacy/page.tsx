'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Navbar Header */}
      <nav style={{
        borderBottom: '1px solid var(--color-border-default)',
        backgroundColor: 'rgba(252, 251, 249, 0.8)',
        backdropFilter: 'blur(8px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo href="/" />
          <button 
            onClick={() => router.push('/')} 
            className="btn-ghost" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '3rem 1.5rem' }}>
        <article style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--color-bg-secondary)', padding: '3rem 2.5rem', borderRadius: '24px', border: '1px solid var(--color-border-default)', boxShadow: 'var(--shadow-sm)' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.5rem', fontFamily: 'var(--font-family-display)' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Last Updated: August 31, 2026
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: '1.7', fontSize: '0.95rem' }}>
            <p>
              Welcome to <strong>LearnSpine</strong>. We take your privacy very seriously. This Privacy Policy details how we collect, process, store, and protect your personal data in compliance with the General Data Protection Regulation (GDPR).
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--color-border-default)' }} />

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                1. Data We Collect
              </h2>
              <p>We collect and process the following information necessary to provide you with the LearnSpine service:</p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Account Information:</strong> Your email address and password when you create an account.</li>
                <li><strong>Uploaded Content:</strong> Text and PDF files you upload or paste to generate study materials.</li>
                <li><strong>Generated Materials:</strong> Flowcharts, flashcards, and quizzes created by the AI.</li>
                <li><strong>Local Usage Data:</strong> Guest study guide history stored locally in your browser's localStorage.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                2. Legal Basis for Processing
              </h2>
              <p>We process your data under the following legal bases:</p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Contractual Necessity:</strong> To authenticate your account and save your generated study materials to your workspace.</li>
                <li><strong>Consent:</strong> When you upload document contents to be processed by our artificial intelligence provider.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                3. How Your Data is Shared and Processed
              </h2>
              <p>
                LearnSpine processes your text inputs using the <strong>Google Gemini API</strong> to generate educational content. We do not sell your personal data. 
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Your account details and study guides are securely stored using <strong>Supabase</strong> (our database infrastructure provider), which operates under strict GDPR data processing agreements.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                4. Data Retention and Deletion (Right to Erasure)
              </h2>
              <p>
                You retain complete control over your data:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>You can delete individual study guides from your dashboard workspace at any time. This immediately purges them from our database.</li>
                <li>Guests can clear their browser data to erase local history.</li>
                <li>You can request complete deletion of your account and all associated data by contacting us at <strong>artist.sindhuja@gmail.com</strong>. We will fulfill account deletion requests within 30 days.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                5. Your GDPR Rights
              </h2>
              <p>Under the GDPR, you have the following rights regarding your personal data:</p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Right of Access:</strong> Obtain a copy of the personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> Ask us to correct inaccurate or incomplete data.</li>
                <li><strong>Right to Erasure (To be Forgotten):</strong> Request the permanent deletion of your account and data.</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                <li><strong>Right to Object:</strong> Object to processing of your data in specific contexts.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                6. Cookies and Tracking
              </h2>
              <p>
                LearnSpine uses only <strong>essential cookies and local storage tokens</strong> strictly necessary to keep you authenticated and maintain your active session. We do not run third-party advertising trackers or marketing cookies.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-family-display)' }}>
                7. Contact Us
              </h2>
              <p>
                For any inquiries regarding your data, privacy rights, or to request deletion of your account, please contact us at:
              </p>
              <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                Email: artist.sindhuja@gmail.com
              </p>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
