import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, MousePointer2 } from 'lucide-react';
import { fetchOrganizationTree } from '../../api/api';
import type { OrganizationTree } from '../../api/api';

interface AreaEditorOverlayProps {
  onSave: (orgId: number, points: number[]) => void;
  onCancel: () => void;
  currentPoints: number[];
  onReset: () => void;
  onUndo: () => void;
}

const AreaEditorOverlay: React.FC<AreaEditorOverlayProps> = ({ 
  onSave, onCancel, currentPoints, onReset, onUndo 
}) => {
  const [orgs, setOrgs] = useState<OrganizationTree[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  useEffect(() => {
    const loadOrgs = async () => {
      const data = await fetchOrganizationTree();
      // Flatten the tree or just show teams (Level 2/3)
      const flatTeams: OrganizationTree[] = [];
      const traverse = (item: OrganizationTree) => {
        if (item.level >= 1) flatTeams.push(item);
        item.children?.forEach(traverse);
      };
      data.forEach(traverse);
      setOrgs(flatTeams);
    };
    loadOrgs();
  }, []);

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-[2.5rem] p-4 flex items-center space-x-6 shadow-2xl shadow-indigo-500/20">
        <div className="flex items-center space-x-3 px-4 border-r border-slate-700">
          <div className="p-2 bg-indigo-500 rounded-2xl">
            <MousePointer2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Area Editor</p>
            <p className="text-sm font-bold text-white">구역 편집 모드</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select 
            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-w-[180px]"
            value={selectedOrgId || ''}
            onChange={(e) => setSelectedOrgId(Number(e.target.value))}
          >
            <option value="">편집할 팀 선택...</option>
            {orgs.map(org => (
              <option key={org.id} value={org.id}>
                {org.level === 1 ? '🏢' : '👥'} {org.name}
              </option>
            ))}
          </select>

          <div className="h-8 w-px bg-slate-700 mx-2" />

          <button 
            onClick={onUndo}
            disabled={currentPoints.length === 0}
            className={`p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all ${currentPoints.length === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
            title="마지막 포인트 취소 (Undo)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button 
            onClick={onReset}
            disabled={currentPoints.length === 0}
            className={`p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all ${currentPoints.length === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
            title="초기화"
          >
            <X className="w-5 h-5" />
          </button>

          <button 
            onClick={() => selectedOrgId && onSave(selectedOrgId, currentPoints)}
            disabled={!selectedOrgId || currentPoints.length < 6}
            className={`flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all ${
              (!selectedOrgId || currentPoints.length < 6) ? 'opacity-30 cursor-not-allowed shadow-none' : 'hover:scale-105 active:scale-95'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>구역 저장</span>
          </button>

          <button 
            onClick={onCancel}
            className="p-2.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-2xl transition-all border border-slate-700"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentPoints.length > 0 && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-xl animate-bounce">
            {currentPoints.length / 2}개 지점 연결 중...
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaEditorOverlay;
