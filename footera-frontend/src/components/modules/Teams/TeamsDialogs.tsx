import { BarChart3,Sparkles,Target,UserPlus,Users } from 'lucide-react';
import { formatFiniteNumber } from '../../../utils/numberFormat';
import { Badge } from '../../common/Badge';
import { EntityLink } from '../../common/EntityLink';
import { Modal } from '../../common/Modal';

import type { useTeamsViewModel } from './useTeamsViewModel';

export function TeamsDialogs({ model }: { model: ReturnType<typeof useTeamsViewModel> }) {
  const { user, navigateToResource, selectedTeam, setSelectedTeam, isRosterModalOpen, setIsRosterModalOpen, rosterTab, setRosterTab, teamScorers, teamAssisters, isJoinModalOpen, setIsJoinModalOpen, joinMessage, setJoinMessage, isSubmittingJoin, isTeamMember, handleJoinTeam } = model;
  return <>
      {/* Roster / Membres de l'équipe Modal */}
      {isRosterModalOpen && selectedTeam && (
        <Modal
          isOpen={isRosterModalOpen}
          onClose={() => {
            setIsRosterModalOpen(false);
            setSelectedTeam(null);
            navigateToResource('teams');
          }}
          title={`Effectif officiel — ${selectedTeam.name}`}
          subtitle={`${selectedTeam.members.length} joueurs inscrits · Coach ${selectedTeam.coachName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-pitch-panel border border-pitch-line rounded-2xl">
              <button
                type="button"
                onClick={() => setRosterTab('members')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rosterTab === 'members'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Effectif ({selectedTeam.members.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRosterTab('stats')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  rosterTab === 'stats'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Buteurs & Stats Club</span>
              </button>
            </div>

            {rosterTab === 'members' && (
              <div className="divide-y divide-pitch-separator max-h-[50vh] overflow-y-auto pr-1">
                {selectedTeam.members.map((member) => (
                  <div
                    key={member.playerId}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center font-extrabold text-sm text-pitch-primary tabular-nums">
                        #{member.jerseyNumber}
                      </span>
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-pitch-ink"><EntityLink section="players" id={member.playerId}>{member.name}</EntityLink></h4>
                        <p className="text-caption text-slate-500">
                          {member.position} {member.age && `· ${member.age} ans`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'Capitaine' ? 'lime' : 'slate'} size="sm">
                        {member.role}
                      </Badge>
                      {member.goals !== undefined && member.goals > 0 && (
                        <span className="text-xs font-bold text-pitch-primary px-2 py-0.5 rounded-full bg-[#e8f5e6]">
                          🎯 {member.goals} buts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rosterTab === 'stats' && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {/* Team metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-micro text-slate-400 block font-medium">Bilan</span>
                    <strong className="text-sm font-black text-pitch-ink">
                      {selectedTeam.stats.wins}V · {selectedTeam.stats.draws}N · {selectedTeam.stats.losses}D
                    </strong>
                    <span className="text-micro text-pitch-primary block font-semibold mt-0.5">
                      {selectedTeam.stats.points} Points
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#e8f5e6] border border-[#d4e7d4]">
                    <span className="text-micro text-pitch-primary block font-semibold">Attaque</span>
                    <strong className="text-base font-black text-pitch-primary tabular-nums">
                      {selectedTeam.stats.goalsFor} buts
                    </strong>
                    <span className="text-micro text-slate-600 block mt-0.5">
                      {formatFiniteNumber(selectedTeam.stats.goalsPerMatch, 1)} / match
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-micro text-slate-400 block font-medium">Défense</span>
                    <strong className="text-base font-black text-rose-600 tabular-nums">
                      {selectedTeam.stats.goalsAgainst} concédés
                    </strong>
                    <span className="text-micro text-slate-500 block mt-0.5">
                      Diff : {selectedTeam.stats.goalDifference > 0 ? `+${selectedTeam.stats.goalDifference}` : selectedTeam.stats.goalDifference}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-micro text-slate-400 block font-medium">Rang</span>
                    <strong className="text-base font-black text-pitch-ink tabular-nums">
                      #{selectedTeam.stats.position}
                    </strong>
                    <span className="text-micro text-slate-500 block mt-0.5">
                      {selectedTeam.division}
                    </span>
                  </div>
                </div>

                {/* Top scorers of the team */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pitch-ink flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-pitch-primary" />
                    <span>Meilleurs buteurs de l&apos;équipe</span>
                  </h4>
                  <div className="rounded-2xl border border-pitch-line overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-separator">
                        <tr>
                          <th className="py-2 px-3">Joueur</th>
                          <th className="py-2 px-3 text-center">Poste</th>
                          <th className="py-2 px-3 text-center text-pitch-primary font-black">Buts</th>
                          <th className="py-2 px-3 text-center">Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pitch-separator">
                      {teamScorers.map((s) => (
                          <tr key={s.playerId} className="hover:bg-[#f6f9f5]">
                            <td className="py-2 px-3 font-extrabold text-pitch-ink">
                              <div className="flex items-center gap-2">
                                <img src={s.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <EntityLink section="players" id={s.playerId}>{s.playerName}</EntityLink>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{s.position}</td>
                            <td className="py-2 px-3 text-center font-black text-pitch-primary tabular-nums">
                              {s.goals}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 tabular-nums">
                              {s.ratio}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top assisters of the team */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pitch-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pitch-primary" />
                    <span>Meilleurs passeurs de l&apos;équipe</span>
                  </h4>
                  <div className="rounded-2xl border border-pitch-line overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-separator">
                        <tr>
                          <th className="py-2 px-3">Passeur</th>
                          <th className="py-2 px-3 text-center">Poste</th>
                          <th className="py-2 px-3 text-center text-pitch-primary font-black">Passes</th>
                          <th className="py-2 px-3 text-center">Clés</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pitch-separator">
                      {teamAssisters.map((a) => (
                          <tr key={a.playerId} className="hover:bg-[#f6f9f5]">
                            <td className="py-2 px-3 font-extrabold text-pitch-ink">
                              <div className="flex items-center gap-2">
                                <img src={a.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <EntityLink section="players" id={a.playerId}>{a.playerName}</EntityLink>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{a.position}</td>
                            <td className="py-2 px-3 text-center font-black text-pitch-primary tabular-nums">
                              {a.assists}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 tabular-nums">
                              {a.keyPasses}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!isTeamMember(selectedTeam) && user && <div className="pt-3 border-t border-pitch-separator">
              <button
                onClick={() => {
                  setIsRosterModalOpen(false);
                  setIsJoinModalOpen(true);
                }}
                className="w-full py-3 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Rejoindre cet effectif</span>
              </button>
            </div>}
          </div>
        </Modal>
      )}

      {/* Join Team Modal */}
      {isJoinModalOpen && selectedTeam && (
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title={`Rejoindre ${selectedTeam.name}`}
          subtitle={`Demande d'adhésion pour la division ${selectedTeam.division}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Votre CV sportif ({user?.sportsCv.primaryPosition}, {user?.sportsCv.height}cm, {user?.sportsCv.strongFoot}) sera directement envoyé au coach <strong>{selectedTeam.coachName}</strong>.
            </p>
            <div>
              <label htmlFor="team-join-message" className="block text-xs font-bold text-slate-700 mb-1">
                Message au staff technique *
              </label>
              <textarea
                id="team-join-message"
                name="message"
                rows={4}
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Ex: Bonjour coach, je suis disponible pour les entraînements et souhaite intégrer l'équipe..."
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleJoinTeam}
                disabled={!joinMessage.trim() || isSubmittingJoin}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingJoin ? 'Envoi...' : 'Envoyer ma demande'}
              </button>
            </div>
          </div>
        </Modal>
      )}

  </>;
}
