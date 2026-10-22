import React from 'react';
import { X, CheckCheck, Bell, ChevronRight } from 'lucide-react';
import { NavigationSection } from '../../context/navigation';
import { useApp } from '../../context/useApp';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
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
      <div className="w-full max-w-md h-full bg-white border-l border-[#dce6d8] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-[#e5ece2] flex items-center justify-between bg-[#f8faf7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ed] flex items-center justify-center text-[#0e5632]">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-[#092c1a]">Centre d&apos;alertes</h2>
            {unreadNotificationsCount > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#dc2626] text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                title="Tout marquer comme lu"
                className="p-1.5 text-xs text-[#0e5632] hover:bg-[#eaf4ed] rounded-xl font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tout lire</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Fermer le volet"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-[#eaf4ed] cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#edf3ea] p-3 space-y-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  navigateToResource(notif.targetSection as NavigationSection, notif.targetId);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all hover:bg-[#f3f7f1] flex items-start gap-3 ${
                  notif.isRead ? 'opacity-70 bg-white' : 'bg-[#eaf4ed]/50 border border-[#d6e8d6]'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                    notif.isRead ? 'bg-transparent' : 'bg-[#10b981] ring-4 ring-[#10b981]/20'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-bold ${notif.isRead ? 'text-slate-600' : 'text-[#092c1a]'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
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
