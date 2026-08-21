'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, ChevronLeft, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Mock API call to simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSuccess(true);
    setLoading(false);
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--color-bg-primary)',
      padding: '2rem 1rem' 
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-bg-secondary)',
          fontWeight: 'bold',
          fontFamily: 'var(--font-family-display)',
          fontSize: '1rem'
        }}>
          L
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>LearnSpine</span>
      </div>

      {/* Back button */}
      <button 
        onClick={() => router.push('/')} 
        className="btn-ghost" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.35rem', 
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)'
        }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Contact Card */}
      <div 
        className="card animate-scale-in" 
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '3rem 2.5rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '24px'
        }}
      >
        {success ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-green-light)',
              color: 'var(--color-accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem'
            }}>
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Message Sent!</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto' }}>
              Thank you for reaching out. We've received your message and will get back to you shortly.
            </p>
            <button 
              onClick={() => router.push('/')} 
              className="btn-primary" 
              style={{ marginTop: '1rem', padding: '0.65rem 2rem' }}
            >
              Return Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Header text */}
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                Send us a message
              </h1>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Fill out the form below and we'll get back to you shortly.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="contact-grid">
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                  Name <span style={{ color: '#8b5cf6' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="input-field"
                  style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                  Email <span style={{ color: '#8b5cf6' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field"
                  style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
              </div>
            </div>

            {/* Message input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Message <span style={{ color: '#8b5cf6' }}>*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help you..."
                className="input-field"
                style={{ 
                  borderRadius: '16px', 
                  padding: '1rem', 
                  resize: 'vertical',
                  minHeight: '120px',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ 
                width: '100%', 
                padding: '0.85rem 1.5rem', 
                borderRadius: '9999px',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginTop: '0.5rem',
                backgroundColor: '#111827'
              }}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
