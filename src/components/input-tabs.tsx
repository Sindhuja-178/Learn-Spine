'use client';

import { useState } from 'react';
import { TextInput } from './text-input';
import { YoutubeInput } from './youtube-input';
import { FileText, Video } from 'lucide-react';
import type { StudyMaterial } from '@/types';

interface InputTabsProps {
  onSuccess: (title: string, materials: StudyMaterial) => void;
}

export function InputTabs({ onSuccess }: InputTabsProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'youtube'>('text');

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div className="tab-list">
          <button
            onClick={() => setActiveTab('text')}
            className="tab-trigger"
            data-active={activeTab === 'text'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileText className="w-4 h-4" />
            Text / PDF Upload
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className="tab-trigger"
            data-active={activeTab === 'youtube'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Video className="w-4 h-4" />
            YouTube Link
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'text' ? (
          <TextInput onSuccess={onSuccess} />
        ) : (
          <YoutubeInput onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}
