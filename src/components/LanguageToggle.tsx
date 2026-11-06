'use client';

import { useLanguage } from '@/context/LanguageContext';

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function LanguageToggle({
  className = '',
  size = 'sm',
  showIcon = true,
}: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage, isTamil } = useLanguage();

  const isSmall = size === 'sm';

  return (
    <div 
      className={`d-inline-flex align-items-center bg-dark bg-opacity-75 rounded-pill p-1 border border-secondary border-opacity-50 shadow-sm transition-all ${className}`}
      role="group"
      aria-label="Language selection toggle"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {showIcon && (
        <span 
          className="ps-2 pe-1 text-warning d-flex align-items-center cursor-pointer"
          onClick={toggleLanguage}
          title={isTamil ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
          style={{ fontSize: isSmall ? '0.85rem' : '1rem' }}
        >
          <i className="bi bi-translate"></i>
        </span>
      )}

      {/* English Option */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`btn rounded-pill fw-bold transition-all border-0 ${
          isSmall ? 'py-1 px-2 extra-small' : 'py-1 px-3 small'
        } ${
          language === 'en'
            ? 'btn-success text-white shadow-sm'
            : 'text-light opacity-75 hover-opacity-100 bg-transparent'
        }`}
        style={{
          minWidth: isSmall ? '34px' : '44px',
          letterSpacing: '0.02em',
          transition: 'all 0.2s ease-in-out'
        }}
        aria-pressed={language === 'en'}
        title="View website in English"
      >
        EN
      </button>

      {/* Tamil Option */}
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`btn rounded-pill fw-bold transition-all border-0 ${
          isSmall ? 'py-1 px-2 extra-small' : 'py-1 px-3 small'
        } ${
          language === 'ta'
            ? 'btn-success text-white shadow-sm'
            : 'text-light opacity-75 hover-opacity-100 bg-transparent'
        }`}
        style={{
          minWidth: isSmall ? '46px' : '58px',
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease-in-out'
        }}
        aria-pressed={language === 'ta'}
        title="தமிழுக்கு மாற்றவும் (Switch to Tamil)"
      >
        தமிழ்
      </button>
    </div>
  );
}
