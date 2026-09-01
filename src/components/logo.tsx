import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: number;
  onClick?: () => void;
}

export function Logo({ href, size = 28, onClick }: LogoProps) {
  const content = (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textDecoration: 'none' }}
      onClick={onClick}
    >
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '7px',
        backgroundColor: '#1c1917',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fcfbf9',
        fontWeight: 'bold',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: `${Math.round(size * 0.55)}px`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        L
      </div>
      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary, #1c1917)', letterSpacing: '-0.01em' }}>
        LearnSpine
      </span>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  return content;
}
