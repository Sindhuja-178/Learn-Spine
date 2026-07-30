import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { StudyTabs } from '@/components/study-tabs';
import Link from 'next/link';

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!supabase) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)', padding: '2rem' }}>
        <div className="card" style={{ padding: '3rem', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Database Connection Missing</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>This LearnSpine deployment has not configured a Supabase connection.</p>
        </div>
      </div>
    );
  }

  // Fetch record from Supabase
  const { data: row, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !row) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Dynamic Header Link Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--color-border-default)',
        backgroundColor: 'rgba(252, 251, 249, 0.8)',
        backdropFilter: 'blur(8px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-bg-secondary)',
              fontWeight: 'bold',
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.9rem'
            }}>
              L
            </div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>LearnSpine</span>
          </Link>
          
          <span style={{
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '450px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Shared Guide: {row.title}
          </span>

          <Link href="/" className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.8rem' }}>
            Create Your Own
          </Link>
        </div>
      </nav>

      {/* Workspace Display */}
      <main style={{ flex: 1, padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Shared on {new Date(row.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <StudyTabs materials={row.materials} />
        </div>
      </main>
    </div>
  );
}
