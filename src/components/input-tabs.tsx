'use client';

import { TextInput } from './text-input';
import type { StudyMaterial } from '@/types';

interface InputTabsProps {
  onSuccess: (title: string, materials: StudyMaterial) => void;
}

export function InputTabs({ onSuccess }: InputTabsProps) {
  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <div className="animate-fade-in">
        <TextInput onSuccess={onSuccess} />
      </div>
    </div>
  );
}
