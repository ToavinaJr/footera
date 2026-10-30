import { Send } from 'lucide-react';
import { EntityLink } from '../../common/EntityLink';
import { Modal } from '../../common/Modal';

import type { useRecruitmentViewModel } from './useRecruitmentViewModel';

export function RecruitmentDialogs({ model }: { model: ReturnType<typeof useRecruitmentViewModel> }) {
  const { t, adModal, activeAd, applicationAd, isApplyModalOpen, applyMessage, setApplyMessage, applicantPhone, setApplicantPhone, isSubmitting, openApplication, closeApplication, handleApply } = model;
  return <>
      {/* Ad Details Modal */}
      {activeAd && !isApplyModalOpen && (
        <Modal
          isOpen={!!activeAd}
          onClose={adModal.close}
          title={activeAd.positionSought}
          subtitle={`${activeAd.teamName} · ${activeAd.division}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line flex items-center gap-3">
              <img
                src={activeAd.teamLogoUrl}
                alt={activeAd.teamName}
                className="w-12 h-12 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="card-title text-sm font-bold text-pitch-ink"><EntityLink section="teams" id={activeAd.teamId}>{activeAd.teamName}</EntityLink></h3>
                <span className="text-xs text-slate-500">{activeAd.city} · {activeAd.category}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-pitch-panel p-3 rounded-2xl border border-border-subtle">
              {activeAd.description}
            </p>

            <button
              onClick={() => openApplication(activeAd)}
              className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{t('recruitment.applyOpportunity')}</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Apply Modal */}
      {isApplyModalOpen && applicationAd && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={closeApplication}
          title={t('recruitment.applyTitle', { position: applicationAd.positionSought })}
          subtitle={applicationAd.teamName}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('recruitment.phoneRequired')}
              </label>
              <input
                type="tel"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('recruitment.messageRequired')}
              </label>
              <textarea
                rows={4}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder={t('recruitment.messagePlaceholder')}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={closeApplication}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                {t('recruitment.cancel')}
              </button>
              <button
                onClick={handleApply}
                disabled={!applyMessage.trim() || !applicantPhone.trim() || isSubmitting}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? t('recruitment.sendingApplication') : t('recruitment.submitApplication')}
              </button>
            </div>
          </div>
        </Modal>
      )}

  </>;
}
