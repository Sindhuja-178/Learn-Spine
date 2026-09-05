'use client';

import { TextInput } from './text-input';
import type { StudyMaterial } from '@/types';

interface InputTabsProps {
  onSuccess: (title: string, materials: StudyMaterial) => void;
  isPro?: boolean;
  onRequirePro?: (pageCount: number) => void;
}

export function InputTabs({ onSuccess, isPro, onRequirePro }: InputTabsProps) {
  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <div className="animate-fade-in">
        <TextInput onSuccess={onSuccess} isPro={isPro} onRequirePro={onRequirePro} />
      </div>
    </div>
  );
}
