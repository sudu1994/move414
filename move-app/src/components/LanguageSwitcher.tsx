'use client';

import { useState } from 'react';

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<'en' | 'ja'>('ja');

  const toggleLanguage = () => {
    const newLang = language === 'ja' ? 'en' : 'ja';
    setLanguage(newLang);
    // Store in localStorage for persistence
    localStorage.setItem('preferred-language', newLang);
    // Reload page to apply language
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors"
    >
      {language === 'ja' ? 'English' : '日本語'}
    </button>
  );
}