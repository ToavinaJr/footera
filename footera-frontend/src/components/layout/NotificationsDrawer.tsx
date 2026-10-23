import React from 'react';
import { X, CheckCheck, Bell, ChevronRight } from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';
import { useTranslation } from '../../i18n';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    navigateToResource,
  } = useApp();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md h-full bg-white border-l border-pitch-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-[#e5ece2] flex items-center justify-between bg-pitch-panel">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pitch-light flex items-center justify-center text-pitch-primary">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-pitch-ink">{t('notifications.title')}</h2>
            {unreadNotificationsCount > 0 && (
              <span className="text-micro font-extrabold px-2 py-0.5 rounded-full bg-[#dc2626] text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                title={t('notifications.markAll')}
                className="p-1.5 text-xs text-pitch-primary hover:bg-pitch-light rounded-xl font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('notifications.readAll')}</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label={t('notifications.close')}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-pitch-light cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-pitch-separator p-3 space-y-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {t('notifications.empty')}
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  navigateToResource(notif.targetSection as NavigationSection, notif.targetId);
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all hover:bg-[#f3f7f1] flex items-start gap-3 ${
                  notif.isRead ? 'opacity-70 bg-white' : 'bg-pitch-light/50 border border-[#d6e8d6]'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                    notif.isRead ? 'bg-transparent' : 'bg-[#10b981] ring-4 ring-[#10b981]/20'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-bold ${notif.isRead ? 'text-slate-600' : 'text-pitch-ink'}`}>
                      {notif.title}
                    </p>
                    <span className="text-micro text-slate-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
