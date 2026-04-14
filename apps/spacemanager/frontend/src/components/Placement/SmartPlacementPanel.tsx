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

  // Utility to flatten tree for selection
  const flattenedOrgs = useMemo(() => {
    const list: { id: number, name: string, directMemberCount: number }[] = [];
    const traverse = (node: OrganizationTree) => {
      list.push({ id: node.id, name: node.name, directMemberCount: node.directMemberCount });
      node.children?.forEach(traverse);
    };
    orgTree.forEach(traverse);
    return list;
  }, [orgTree]);

  const handleReset = async () => {
    if (window.confirm(`${currentFloor}층의 모든 배치 정보와 입력한 팀 리스트를 초기화하시겠습니까?`)) {
      try {
        await clearFloorReservations(floorId);
        setTeams([{ name: '', count: '', members: '' }]);
        onClearAnchor();
        onSuccess(); // Refresh parents
        alert('초기화가 완료되었습니다.');
      } catch (error) {
        console.error('Reset failed:', error);
        alert('초기화 중 오류가 발생했습니다.');
      }
    }
  };

  const addTeam = () => setTeams([...teams, { name: '', count: '', members: '' }]);
  const removeTeam = (index: number) => setTeams(teams.filter((_, i) => i !== index));
  const updateTeam = (index: number, field: keyof TeamInput, value: string) => {
    const newTeams = [...teams];
    const updatedTeam = { ...newTeams[index], [field]: value };
    
    // Auto-sync count if organization name is selected
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
      
      // If list is provided, use it. Otherwise generate placeholders based on count.
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

  const recommendedSeats = useMemo(() => {
    if (!anchorSeat || memberList.length === 0) return [];

    const availableSeats = [...seats.filter(s => s.status === 'available')];
    if (availableSeats.length === 0) return [];

    const selected: Seat[] = [];
    const remaining = [...availableSeats];

    // Iteratively pick the best seat based on proximity to the anchor AND already selected group
    for (let i = 0; i < memberList.length; i++) {
      if (remaining.length === 0) break;

      let bestIdx = -1;
      let minScore = Infinity;

      for (let j = 0; j < remaining.length; j++) {
        const s = remaining[j];
        // Distance to anchor
        const dxAnchor = s.xPos - anchorSeat.xPos;
        const dyAnchor = s.yPos - anchorSeat.yPos;
        const distAnchor = Math.sqrt(dxAnchor * dxAnchor + dyAnchor * dyAnchor);

        // Proximity bonus: check if adjacent to ANY already selected seat
        // Adjacent = within 40 units (assuming 32 is seat pitch)
        let adjacencyBonus = 0;
        for (const sel of selected) {
          const dx = s.xPos - sel.xPos;
          const dy = s.yPos - sel.yPos;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 40) {
            adjacencyBonus += 500; // Strong bonus for adjacency
          }
        }

        // Score = Distance - Bonus (lower is better)
        const score = distAnchor - adjacencyBonus;
        
        if (score < minScore) {
          minScore = score;
          bestIdx = j;
        }
      }

      if (bestIdx !== -1) {
        selected.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      }
    }

    return selected;
  }, [anchorSeat, memberList.length, seats]);

  const handleApply = async () => {
    if (!anchorSeat || recommendedSeats.length < memberList.length) {
      alert('배치 가능한 빈 자리가 부족하거나 기준석이 선택되지 않았습니다.');
      return;
    }

    try {
      const allTeamNames: string[] = [];
      const allTeamColors: string[] = [];
      teamData.forEach(t => {
        t.members.forEach(() => {
          allTeamNames.push(t.name);
          allTeamColors.push(t.color);
        });
      });

      await bulkAssignSeats({
        teams: allTeamNames,
        teamColors: allTeamColors,
        memberNames: memberList,
        seatIds: recommendedSeats.map(s => s.id)
      });

      alert(`${memberList.length}명의 팀원이 배치되었습니다!`);
      onSuccess();
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      alert('배치 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-widest flex items-center">
            <Users className="w-3 h-3 mr-2" /> Team Smart Placement
          </h3>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
            임원석을 기준으로 팀원들을 자동 배치합니다.
          </p>
        </div>
        <button 
          onClick={handleReset}
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          title="7층 배치 초기화"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {teams.map((team, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative group">
            {teams.length > 1 && (
              <button 
                onClick={() => removeTeam(idx)}
                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                title="팀 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="flex gap-2">
              <select 
                value={team.name}
                onChange={(e) => updateTeam(idx, 'name', e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">부서 선택...</option>
                {flattenedOrgs.map(org => (
                  <option key={org.id} value={org.name}>{org.name}</option>
                ))}
              </select>
              <input 
                type="number"
                placeholder="명"
                value={team.count}
                onChange={(e) => updateTeam(idx, 'count', e.target.value)}
                className="w-16 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-all text-center"
              />
            </div>
            <textarea 
              placeholder="직접 명단 입력 (선택 사항)"
              value={team.members}
              onChange={(e) => updateTeam(idx, 'members', e.target.value)}
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-medium outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        ))}
        <button 
          onClick={addTeam}
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all flex items-center justify-center text-xs font-black"
        >
          <Plus className="w-4 h-4 mr-2" /> 팀 추가
        </button>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className={`p-4 rounded-2xl border ${isSelectingAnchor ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
              <Target className="w-3.5 h-3.5 mr-2" /> 기준 임원석
            </span>
            {anchorSeat && (
              <button onClick={onClearAnchor} className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
            )}
          </div>
          {anchorSeat ? (
            <div className="text-sm font-black text-indigo-700 animate-in fade-in">{anchorSeat.seatNumber} 선택됨</div>
          ) : (
            <button 
              onClick={() => onSelectAnchorMode(!isSelectingAnchor)}
              className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                isSelectingAnchor ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {isSelectingAnchor ? '지도에서 클릭하세요' : '기준석 선택하기'}
            </button>
          )}
        </div>

        {recommendedSeats.length > 0 && (
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start animate-in slide-in-from-bottom-2">
            <Info className="w-4 h-4 text-indigo-400 mr-2 mt-0.5" />
            <span className="text-[10px] font-bold text-indigo-700">
              최단 거리의 빈 자리 <strong>{recommendedSeats.length}개</strong>가 하이라이트 되었습니다.
            </span>
          </div>
        )}

        <button 
          onClick={handleApply}
          disabled={!anchorSeat || memberList.length === 0}
          className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center space-x-2 ${
            !anchorSeat || memberList.length === 0 
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          <Send className="w-4 h-4" /> <span>배치 일괄 적용</span>
        </button>
      </div>
    </div>
  );
};

export default SmartPlacementPanel;
