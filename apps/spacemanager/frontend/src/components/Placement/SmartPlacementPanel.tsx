import React, { useState, useMemo, useEffect } from 'react';
import { Target, Users, Plus, Trash2, Send, X, Info } from 'lucide-react';
import { bulkAssignSeats, clearFloorReservations, fetchOrganizationTree, type Seat, type OrganizationTree } from '../../api/api';

interface TeamInput {
  name: string;
  count: string;
  members: string;
}

interface SmartPlacementPanelProps {
  floorId: number;
  currentFloor: string;
  seats: Seat[];
  onSelectAnchorMode: (active: boolean) => void;
  isSelectingAnchor: boolean;
  anchorSeat: Seat | null;
  onClearAnchor: () => void;
  onSuccess: () => void;
}

const TEAM_PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

const SmartPlacementPanel: React.FC<SmartPlacementPanelProps> = ({
  floorId,
  currentFloor,
  seats,
  onSelectAnchorMode,
  isSelectingAnchor,
  anchorSeat,
  onClearAnchor,
  onSuccess
}) => {
  const [teams, setTeams] = useState<TeamInput[]>([{ name: '', count: '', members: '' }]);
  const [orgTree, setOrgTree] = useState<OrganizationTree[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Load org tree on mount
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        setLoadingOrgs(true);
        const tree = await fetchOrganizationTree();
        setOrgTree(tree);
      } catch (error) {
        console.error('Failed to load org tree:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrgs();
  }, []);

  // Utility to handle org data
  const flattenedOrgs = useMemo(() => {
    const list: { id: number, name: string, directMemberCount: number }[] = [];
    const traverse = (node: OrganizationTree) => {
      list.push({ id: node.id, name: node.name, directMemberCount: node.directMemberCount });
      node.children?.forEach(traverse);
    };
    orgTree.forEach(traverse);
    return list;
  }, [orgTree]);

  // Clean floor and reset local state
  const handleReset = async () => {
    if (window.confirm(`${currentFloor} Reset Map?`)) {
      try {
        await clearFloorReservations(floorId);
        setTeams([{ name: '', count: '', members: '' }]);
        onClearAnchor();
        onSuccess();
        alert('Reset success.');
      } catch (error) {
        console.error('Reset failed:', error);
      }
    }
  };

  const addTeam = () => setTeams([...teams, { name: '', count: '', members: '' }]);
  const removeTeam = (index: number) => setTeams(teams.filter((_, i) => i !== index));
  const updateTeam = (index: number, field: keyof TeamInput, value: string) => {
    const newTeams = [...teams];
    const updatedTeam = { ...newTeams[index], [field]: value };
    if (field === 'name') {
      const selectedOrg = flattenedOrgs.find(o => o.name === value);
      if (selectedOrg && selectedOrg.directMemberCount !== undefined && selectedOrg.directMemberCount !== null) {
        updatedTeam.count = selectedOrg.directMemberCount.toString();
      }
    }
    newTeams[index] = updatedTeam;
    setTeams(newTeams);
  };

  const teamData = useMemo(() => {
    return teams.map((t, idx) => {
      const parsedMembers = t.members.split(/[,\n]/).map(m => m.trim()).filter(m => m.length > 0);
      const count = parseInt(t.count) || 0;
      const finalMembers = parsedMembers.length > 0 
        ? parsedMembers 
        : Array.from({ length: count }, (_, i) => `${t.name || 'Team'}_${i + 1}`);

      return { 
        name: t.name, 
        members: finalMembers, 
        color: TEAM_PALETTE[idx % TEAM_PALETTE.length] 
      };
    });
  }, [teams]);

  const memberList = useMemo(() => teamData.flatMap(t => t.members), [teamData]);

  // V18.14 Final Smart Placement Engine (Isolation & Row-First)
  const recommendedSeats = useMemo(() => {
    if (!anchorSeat || teamData.length === 0) return [];

    const availableSeats = [...seats.filter(s => 
      s.status === 'available' && 
      !s.isExecutiveSeat && 
      !s.sectionName?.includes('EXEC')
    )];
    if (availableSeats.length === 0) return [];

    const globalSelectedByAlgorithm: Seat[] = [];
    const remainingPool = [...availableSeats];

    teamData.forEach(team => {
      const currentTeamSelected: Seat[] = [];
      
      team.members.forEach((_, memberIdx) => {
        if (remainingPool.length === 0) return;

        let bestIdx = -1;
        let minScore = Infinity;

        for (let j = 0; j < remainingPool.length; j++) {
          const s = remainingPool[j];
          
          // 1. Proximity to Anchor Seat
          const dxA = s.xPos - anchorSeat.xPos;
          const dyA = s.yPos - anchorSeat.yPos;
          const distA = Math.sqrt(dxA * dxA + dyA * dyA);

          // 2. Intra-team Adjacency
          let intraTeamBonus = 0;
          for (const sameTeamSeat of currentTeamSelected) {
            const dx = s.xPos - sameTeamSeat.xPos;
            const dy = s.yPos - sameTeamSeat.yPos;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= 40) {
              intraTeamBonus += 2000;
              // Row-First Priority (Bonus for same row)
              if (Math.abs(s.yPos - sameTeamSeat.yPos) < 5) intraTeamBonus += 300;
            }
          }

          // 3. Isolation Strategy (For Seed Member)
          let isolationPenalty = 0;
          if (memberIdx === 0) {
             const occupiedNow = seats.filter(os => os.status === 'occupied' || globalSelectedByAlgorithm.some(gs => gs.id === os.id));
             occupiedNow.forEach(os => {
               const dx = s.xPos - os.xPos;
               const dy = s.yPos - os.yPos;
               const dist = Math.sqrt(dx * dx + dy * dy);
               if (dist <= 40) isolationPenalty += 5000;
             });
          }

          // Final Scoring (Lower is better)
          const score = (distA * 10) - intraTeamBonus + isolationPenalty;
          if (score < minScore) {
            minScore = score;
            bestIdx = j;
          }
        }

        if (bestIdx !== -1) {
          const picked = remainingPool[bestIdx];
          globalSelectedByAlgorithm.push(picked);
          currentTeamSelected.push(picked);
          remainingPool.splice(bestIdx, 1);
        }
      });
    });

    return globalSelectedByAlgorithm;
  }, [anchorSeat, teamData, seats]);

  const handleApply = async () => {
    if (!anchorSeat || recommendedSeats.length < memberList.length) {
      alert('Criteria missing.');
      return;
    }

    try {
      const names: string[] = [];
      const colors: string[] = [];
      teamData.forEach(t => {
        t.members.forEach(() => {
          names.push(t.name);
          colors.push(t.color);
        });
      });

      await bulkAssignSeats({
        teams: names,
        teamColors: colors,
        memberNames: memberList,
        seatIds: recommendedSeats.map(s => s.id)
      });

      alert(`${memberList.length} Assigned!`);
      onSuccess();
    } catch (e) {
      console.error('Bulk assignment error:', e);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-widest flex items-center">
            <Users className="w-3 h-3 mr-2" /> Team Smart Placement
          </h3>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">Assigning members automatically.</p>
        </div>
        <button onClick={handleReset} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-slate-50"><Trash2 className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {teams.map((team, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative group transition-all hover:bg-white hover:shadow-md">
            {teams.length > 1 && (
              <button onClick={() => removeTeam(idx)} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            )}
            <div className="flex gap-2">
              <select value={team.name} onChange={(e) => updateTeam(idx, 'name', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-all cursor-pointer">
                <option value="">Select Team...</option>
                {flattenedOrgs.map(org => <option key={org.id} value={org.name}>{org.name}</option>)}
              </select>
              <input type="number" placeholder="Cnt" value={team.count} onChange={(e) => updateTeam(idx, 'count', e.target.value)} className="w-16 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-all text-center" />
            </div>
            <textarea placeholder="Direct list (CSV)" value={team.members} onChange={(e) => updateTeam(idx, 'members', e.target.value)} rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-medium outline-none focus:border-indigo-500 transition-all resize-none shadow-inner" />
          </div>
        ))}
        <button onClick={addTeam} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all flex items-center justify-center text-xs font-black"><Plus className="w-4 h-4 mr-2" /> Add Team</button>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className={`p-4 rounded-2xl border transition-all ${isSelectingAnchor ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Target className="w-3.5 h-3.5 mr-2" /> Anchor Seat</span>
            {anchorSeat && <button onClick={onClearAnchor} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>}
          </div>
          {anchorSeat ? <div className="text-sm font-black text-indigo-700 animate-in fade-in transition-all">{anchorSeat.seatNumber} Selected</div> : <button onClick={() => onSelectAnchorMode(!isSelectingAnchor)} className={`w-full py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${isSelectingAnchor ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{isSelectingAnchor ? 'Click Map' : 'Select Anchor'}</button>}
        </div>
        {recommendedSeats.length > 0 && (
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start animate-in slide-in-from-bottom-2 transition-all">
            <Info className="w-4 h-4 text-indigo-400 mr-2 mt-0.5" />
            <span className="text-[10px] font-bold text-indigo-700"><strong>{recommendedSeats.length} members</strong> highlighted.</span>
          </div>
        )}
        <button onClick={handleApply} disabled={!anchorSeat || memberList.length === 0} className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-2 shadow-lg ${!anchorSeat || memberList.length === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}><Send className="w-4 h-4" /> <span>Bulk Apply</span></button>
      </div>
    </div>
  );
};

export default SmartPlacementPanel;
