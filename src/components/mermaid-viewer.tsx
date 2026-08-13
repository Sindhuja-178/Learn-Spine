'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Copy, Download, Check } from 'lucide-react';

interface MermaidViewerProps {
  code: string;
}

export function MermaidViewer({ code }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function renderDiagram() {
      if (!containerRef.current || !code) return;

      try {
        setError(null);
        // Dynamic import to avoid SSR issues
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'neutral',
          themeVariables: {
            primaryColor: '#e0e7ff', // Indigo 100
            primaryTextColor: '#0f172a', // Slate 900
            primaryBorderColor: '#818cf8', // Indigo 400
            lineColor: '#64748b', // Slate 500
            secondaryColor: '#f1f5f9', // Slate 100
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            nodeBorder: '#cbd5e1', // Slate 300
            clusterBkg: '#f8fafc',
            titleColor: '#0f172a',
            edgeLabelBackground: '#ffffff',
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
        });

        containerRef.current.innerHTML = '';
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, code);
        containerRef.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render the flowchart. The diagram syntax may contain errors.');
      }
    }

    renderDiagram();
  }, [code]);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownloadSVG = useCallback(() => {
    if (!containerRef.current) return;
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Clone the element to avoid mutating live DOM
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add watermark
    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    
    // Try to get viewBox dimensions to position the watermark at the bottom right corner
    const viewBox = svgClone.getAttribute('viewBox');
    let x = 30;
    let y = 40;
    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        const width = parseFloat(parts[2]);
        const height = parseFloat(parts[3]);
        x = width - 120;
        y = height - 25;
      }
    }
    
    textNode.setAttribute('x', String(x));
    textNode.setAttribute('y', String(y));
    textNode.setAttribute('fill', '#94a3b8'); // Slate 400
    textNode.setAttribute('font-size', '16');
    textNode.setAttribute('font-family', 'sans-serif');
    textNode.setAttribute('font-weight', 'bold');
    textNode.setAttribute('opacity', '0.6');
    textNode.textContent = 'LearnSpine';
    svgClone.appendChild(textNode);
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'learnspine-flowchart.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.25));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.25, Math.min(3, s + delta)));
  }, []);

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle className="w-10 h-10 text-[var(--color-accent-red)] mx-auto mb-3" style={{ display: 'block', margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Rendering Error</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <details style={{ textAlign: 'left' }}>
          <summary style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>View raw Mermaid code</summary>
          <pre style={{
            marginTop: '0.5rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-bg-primary)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid var(--color-border-default)'
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Concept Flowchart</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button onClick={handleCopyCode} className="btn-ghost" style={{ padding: '0.5rem' }} title="Copy Mermaid Code">
            {copied ? <Check className="w-4 h-4 text-[var(--color-accent-green)]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDownloadSVG} className="btn-ghost" style={{ padding: '0.5rem' }} title="Download SVG Flowchart">
            <Download className="w-4 h-4" />
          </button>
          <div style={{ width: '1px', height: '1.25rem', backgroundColor: 'var(--color-border-default)', margin: '0 0.5rem' }} />
          <button onClick={handleZoomOut} className="btn-ghost" style={{ padding: '0.5rem' }} title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '3rem', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={handleZoomIn} className="btn-ghost" style={{ padding: '0.5rem' }} title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="btn-ghost" style={{ padding: '0.5rem' }} title="Reset view">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diagram Area */}
      <div
        className="mermaid-container"
        style={{
          minHeight: '420px',
          maxHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Overlay Watermark */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          opacity: 0.25,
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.05em',
          zIndex: 10
        }}>
          LearnSpine
        </div>
        <div
          ref={containerRef}
          style={{
            transition: 'transform 0.05s ease-out',
            padding: '2rem',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  );
}
