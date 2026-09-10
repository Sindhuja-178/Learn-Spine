import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  href?: string;
  size?: number;
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Logo({ href, size = 30, showText = true, onClick, className }: LogoProps) {
  const content = (
    <div 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', textDecoration: 'none' }}
      onClick={onClick}
      className={className}
    >
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Image
          src="/logo-icon.png"
          alt="LearnSpine Logo"
          width={size}
          height={size}
          style={{ objectFit: 'contain', width: `${size}px`, height: `${size}px` }}
          priority
        />
      </div>
      {showText && (
        <span style={{ 
          fontWeight: 700, 
          fontSize: size >= 32 ? '1.15rem' : '1rem', 
          color: 'var(--color-text-primary, #1c1917)', 
          letterSpacing: '-0.02em',
        }}>
          LearnSpine
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>{content}</Link>;
  }

  return content;
}
