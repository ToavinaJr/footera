import { Modal } from '../../common/Modal';

import type { usePlayersViewModel } from './usePlayersViewModel';

export function PlayersDialogs({ model }: { model: ReturnType<typeof usePlayersViewModel> }) {
  const { t, playerModal, myTeam, isLoadingMyTeam, selectedPlayer, setSelectedPlayer, profilePlayer, isInviteOpen, setIsInviteOpen, inviteMessage, setInviteMessage, isSubmittingInvite, invitationStatuses, handleSendInvite } = model;
  return <>
      {/* Invite Modal */}
      {profilePlayer && (
        <Modal
          isOpen={!!profilePlayer}
          onClose={playerModal.close}
          title={profilePlayer.name}
          subtitle={`${profilePlayer.primaryPosition} · ${profilePlayer.age ? t('profile.ageYears', { age: profilePlayer.age }) : t('players.ageUnknown')} · ${profilePlayer.city}`}
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <img src={profilePlayer.avatarUrl} alt={profilePlayer.name} className="h-20 w-20 rounded-2xl object-cover object-center" />
              <div>
                <p className="font-bold text-pitch-ink">{profilePlayer.currentTeam || t('players.noClub')}</p>
                <p className="text-sm text-slate-500">{profilePlayer.level} · {profilePlayer.strongFoot} · {profilePlayer.height} cm</p>
                <p className="text-sm text-slate-500">{profilePlayer.appearances} {t('playerStats.matchesPlayed')} · {profilePlayer.goals} {t('players.goals', { count: profilePlayer.goals })} · {profilePlayer.assists} {t('playerStats.assists')}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{profilePlayer.bio}</p>
            {myTeam && !isLoadingMyTeam && <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (invitationStatuses[profilePlayer.id] === 'PENDING') return;
                  playerModal.close();
                  setSelectedPlayer(profilePlayer);
                  setIsInviteOpen(true);
                }}
                disabled={invitationStatuses[profilePlayer.id] === 'PENDING'}
                className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invitationStatuses[profilePlayer.id] === 'PENDING' ? t('players.invitationPending') : t('players.inviteToTeam')}
              </button>
            </div>}
          </div>
        </Modal>
      )}

      {isInviteOpen && selectedPlayer && (
        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title={t('players.inviteTitle', { name: selectedPlayer.name })}
          subtitle={t('players.inviteSubtitle', { position: selectedPlayer.primaryPosition })}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('players.inviteDescription', { name: selectedPlayer.name })}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('players.inviteMessageLabel')}
              </label>
              <textarea
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder={t('players.invitePlaceholder')}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteMessage.trim() || isSubmittingInvite}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingInvite ? t('recruitment.sendingApplication') : t('players.sendInvitation')}
              </button>
            </div>
          </div>
        </Modal>
      )}

  </>;
}
