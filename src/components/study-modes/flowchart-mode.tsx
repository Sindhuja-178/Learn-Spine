'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Download, 
  Copy, 
  Check, 
  Map, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { sanitizeMermaid, createFallbackMermaid } from '@/lib/mermaid-utils';

interface FlowchartModeProps {
  code: string;
  onSelectReference?: (text: string) => void;
}

export function FlowchartMode({ code, onSelectReference }: FlowchartModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const cleanupMermaidErrorDOM = () => {
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[id^="dmermaid"], [id^="mermaid-"]').forEach((el) => {
        if (el.parentNode === document.body) {
          el.remove();
        }
      });
    }
  };

  useEffect(() => {
    async function renderDiagram() {
      if (!containerRef.current || !code) return;

      cleanupMermaidErrorDOM();

      try {
        setError(null);
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          suppressErrorRendering: true,
          theme: 'neutral',
          themeVariables: {
            primaryColor: '#e0e7ff',       // Indigo 100
            primaryTextColor: '#0f172a',   // Slate 900
            primaryBorderColor: '#6366f1', // Indigo 500
            lineColor: '#64748b',          // Slate 500
            secondaryColor: '#f8fafc',     // Slate 50
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            nodeBorder: '#cbd5e1',         // Slate 300
            clusterBkg: '#f8fafc',
            titleColor: '#0f172a',
            edgeLabelBackground: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px'
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            useMaxWidth: false
          },
        });

        containerRef.current.innerHTML = '';
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const sanitized = sanitizeMermaid(code);

        try {
          const { svg } = await mermaid.render(uniqueId, sanitized);
          containerRef.current.innerHTML = svg;
          cleanupMermaidErrorDOM();
        } catch (initialErr) {
          console.warn('Initial Mermaid render failed, attempting fallback diagram:', initialErr);
          cleanupMermaidErrorDOM();

          const fallbackCode = createFallbackMermaid("Process Flow");
          const fallbackId = `mermaid-fb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(fallbackId, fallbackCode);
          containerRef.current.innerHTML = svg;
          cleanupMermaidErrorDOM();
        }

        // Attach click listeners to diagram node elements for bidirectional source highlighting
        if (containerRef.current && onSelectReference) {
          const nodes = containerRef.current.querySelectorAll('.node, .cluster');
          nodes.forEach((node) => {
            (node as HTMLElement).style.cursor = 'pointer';
            (node as HTMLElement).title = 'Click to find in source text';
            node.addEventListener('click', (e) => {
              e.stopPropagation();
              const textContent = node.textContent?.trim();
              if (textContent) {
                onSelectReference(textContent);
              }
            });
          });
        }
      } catch (err) {
        console.error('Mermaid render final error:', err);
        cleanupMermaidErrorDOM();
        setError('Could not render the flowchart automatically. You can view or copy the raw diagram code below.');
      }
    }

    renderDiagram();

    return () => {
      cleanupMermaidErrorDOM();
    };
  }, [code, onSelectReference]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 0.3));
  }, []);

  const handleFitToScreen = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;
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
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.3, Math.min(3, s + delta)));
  }, []);

  // Export handlers
  const getWatermarkedSVG = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return null;

    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const viewBox = svgClone.getAttribute('viewBox');
    let width = 900;
    let height = 650;
    let x = 30;
    let y = 40;

    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        width = parseFloat(parts[2]);
        height = parseFloat(parts[3]);
        x = width - 130;
        y = height - 20;
      }
    }

    textNode.setAttribute('x', String(x));
    textNode.setAttribute('y', String(y));
    textNode.setAttribute('fill', '#94a3b8');
    textNode.setAttribute('font-size', '14');
    textNode.setAttribute('font-family', 'sans-serif');
    textNode.setAttribute('font-weight', '600');
    textNode.setAttribute('opacity', '0.6');
    textNode.textContent = 'LearnSpine';
    svgClone.appendChild(textNode);

    return {
      svgString: new XMLSerializer().serializeToString(svgClone),
      width,
      height
    };
  };

  const handleDownloadSVG = () => {
    const data = getWatermarkedSVG();
    if (!data) return;

    const svgBlob = new Blob([data.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = 'learnspine-flowchart.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(svgUrl);
    setShowExportMenu(false);
  };

  const handleDownloadPNG = () => {
    const data = getWatermarkedSVG();
    if (!data) return;

    const svgBlob = new Blob([data.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = data.width * 2;
      canvas.height = data.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'learnspine-flowchart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setShowExportMenu(false);
  };

  const handleCopyMarkdown = () => {
    const mdBlock = '```mermaid\n' + code + '\n```';
    navigator.clipboard.writeText(mdBlock);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    setShowExportMenu(false);
  };

  if (error) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-accent-red)', display: 'block', margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Flowchart Display Notice</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>{error}</p>
        <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <pre style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            color: '#334155',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {code}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
      {/* Top action / controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderBottom: 'none',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        fontSize: '0.8125rem',
        color: '#475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Flowchart Canvas</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Click any node to locate source reference</span>
        </div>

        {/* Export & Lecture Slide Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-secondary"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Diagram</span>
          </button>

          {showExportMenu && (
            <div
              className="animate-slide-down card"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.4rem',
                zIndex: 60,
                width: '210px',
                padding: '0.35rem',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <button
                onClick={handleDownloadPNG}
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              >
                PNG Image (High Res)
              </button>
              <button
                onClick={handleDownloadSVG}
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              >
                SVG Vector
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                Copy Mermaid / Slides
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Diagram Viewport */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          flex: 1,
          minHeight: '480px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {/* Subtle grid background to indicate canvas space */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.5,
            pointerEvents: 'none'
          }}
        />

        {/* Scalable & Draggable Diagram Container */}
        <div
          ref={containerRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            minWidth: '100%',
            minHeight: '100%'
          }}
        />

        {/* Floating Canvas Controls: Bottom Right */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: '#ffffff',
            padding: '0.25rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-md)',
            zIndex: 30
          }}
        >
          <button
            onClick={handleZoomIn}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-slate-700" />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-700" />
          </button>
          <div style={{ width: '1px', height: '18px', backgroundColor: '#e2e8f0' }} />
          <button
            onClick={handleFitToScreen}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="Fit to Screen (Reset View)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
          </button>
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="btn-ghost"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              backgroundColor: showMiniMap ? '#eef2ff' : 'transparent',
              color: showMiniMap ? '#4f46e5' : '#475569'
            }}
            title="Toggle Mini-map"
          >
            <Map className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggleable Mini-Map Overlay */}
        {showMiniMap && (
          <div
            className="card animate-scale-in"
            style={{
              position: 'absolute',
              bottom: '60px',
              right: '16px',
              width: '160px',
              height: '110px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              boxShadow: 'var(--shadow-md)',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 35
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Mini-Map
            </div>
            <div
              style={{
                flex: 1,
                border: '1px dashed #cbd5e1',
                borderRadius: '4px',
                backgroundColor: '#f8fafc',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: `${Math.max(16, Math.min(80, 50 / scale))}px`,
                  height: `${Math.max(12, Math.min(60, 36 / scale))}px`,
                  border: '1.5px solid #4f46e5',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  borderRadius: '2px',
                  transform: `translate(${-position.x / 25}px, ${-position.y / 25}px)`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
