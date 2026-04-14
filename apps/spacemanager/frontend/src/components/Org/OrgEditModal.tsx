import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { OrganizationDto, OrganizationTree } from '../../api/api';

interface OrgEditModalProps {
  initialData?: OrganizationTree | null;
  parentOrg?: OrganizationTree | null;
  onSave: (data: OrganizationDto) => Promise<void>;
  onClose: () => void;
  allOrgs: OrganizationTree[];
}

const OrgEditModal: React.FC<OrgEditModalProps> = ({ 
  initialData, parentOrg, onSave, onClose, allOrgs 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [level, setLevel] = useState(initialData?.level ?? (parentOrg ? parentOrg.level + 1 : 0));
  const [parentId, setParentId] = useState<number | null>(initialData?.parentId ?? (parentOrg?.id || null));
  const [isExecutiveUnit, setIsExecutiveUnit] = useState(initialData?.isExecutiveUnit || false);
  const [memberCount, setMemberCount] = useState(initialData?.memberCount ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name,
        level,
        parentId,
        isExecutiveUnit,
        memberCount
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten the tree for parent selection
  const flatOrgs: { id: number, name: string, level: number }[] = [];
  const traverse = (item: OrganizationTree) => {
    flatOrgs.push({ id: item.id, name: item.name, level: item.level });
    item.children?.forEach(traverse);
  };
  allOrgs.forEach(traverse);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {initialData ? '부서 정보 수정' : '신규 부서 등록'}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {parentOrg ? `${parentOrg.name} 하위에 새로운 부서를 구성합니다.` : '조직 체계의 정보를 설정합니다.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 text-rose-600 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">부서명</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="예: 전략기획팀"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">소속 인원수</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">조직 레벨</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                  >
                    <option value={0}>본부 (Level 0)</option>
                    <option value={1}>담당 (Level 1)</option>
                    <option value={2}>팀 (Level 2)</option>
                  </select>
               </div>
               <div className="flex items-end pb-4 pl-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all" 
                      checked={isExecutiveUnit}
                      onChange={(e) => setIsExecutiveUnit(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">임원 직속 조직</span>
                  </label>
               </div>
            </div>

            {!initialData && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">상위 조직</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">(최상위 조직)</option>
                  {flatOrgs.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-6 flex space-x-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all"
            >
              취소
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center py-4 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 ${
                isSubmitting ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <Save className="w-5 h-5 mr-3" /> {initialData ? '수정 사항 저장' : '부서 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrgEditModal;
