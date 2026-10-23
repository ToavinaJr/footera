import React from 'react';
import { RotateCcw, Database } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { DATA_MODE } from '../../config/dataMode';
import { useTranslation } from '../../i18n';

export const DemoBanner: React.FC = () => {
  const { resetDemo } = useApp();
  const { t } = useTranslation();

  return (
    <aside
      aria-label={t('demo.mode')}
      className="bg-[#0c3822] text-[#d6ede0] text-caption py-1 px-4 border-b border-[#144f2f]"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-lime-volt shrink-0" />
          <span>
            {t('demo.mode')} <strong className="text-white uppercase">{DATA_MODE}</strong> — {t('demo.banner')}
          </span>
        </div>
        <button
          onClick={resetDemo}
          title={t('demo.resetTitle')}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-white hover:text-lime-volt hover:bg-[#124b2d] transition-colors whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t('demo.reset')}</span>
        </button>
      </div>
    </aside>
  );
};
