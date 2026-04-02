import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Users, Building2, Briefcase, Plus, Search, Filter } from 'lucide-react';
import { fetchOrganizationTree, uploadBulkData } from '../../api/api';
import type { OrganizationTree } from '../../api/api';

const TreeItem: React.FC<{ item: OrganizationTree; level: number }> = ({ item, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Expand root and division by default
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`group flex items-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
          isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
          )}
        </div>
        
        <div className={`p-1.5 rounded-lg mr-3 ${
          item.level === 0 ? 'bg-indigo-600 text-white' : 
          item.level === 1 ? 'bg-blue-100 text-blue-600' :
          'bg-slate-100 text-slate-500'
        }`}>
          {item.level === 0 ? <Building2 className="w-3.5 h-3.5" /> : 
           item.level === 1 ? <Briefcase className="w-3.5 h-3.5" /> : 
           <Users className="w-3.5 h-3.5" />
          }
        </div>

        <span className={`text-sm font-bold flex-1 ${
          item.level === 0 ? 'text-slate-900 border-b-2 border-indigo-100' : 'text-slate-700'
        }`}>
          {item.name}
          {item.isExecutiveUnit && (
            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-black italic">EXEC</span>
          )}
        </span>

        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
            {item.memberCount} 명
          </span>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {item.children.map(child => (
            <TreeItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrganizationView: React.FC = () => {
  const [treeData, setTreeData] = useState<OrganizationTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadTree = async () => {
    try {
      setLoading(true);
      const data = await fetchOrganizationTree();
      setTreeData(data);
    } catch (error) {
      console.error('Failed to load org tree:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadBulkData(file);
      if (result.status === 'Success') {
        alert(`업로드 성공! 조직 ${result.orgsCreated}개, 인원 ${result.usersImported}명이 등록되었습니다.`);
        loadTree(); // Refresh tree
      } else {
        alert(`업로드 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-12 gap-8">
        {/* Left: Tree Control */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">계층형 조직도</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">부서별 인원 현황 및 구조를 관리합니다.</p>
              </div>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="부서명 검색..."
                    className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Tree...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-auto pr-4 custom-scrollbar">
                {treeData.map(root => (
                  <TreeItem key={root.id} item={root} level={0} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary Info */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6">Org Statistics</h4>
            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold text-indigo-100 mb-1">총 임직원</p>
                <p className="text-5xl font-black">{treeData.reduce((acc, curr) => acc + curr.memberCount, 0)} 명</p>
              </div>
              <div className="pt-8 border-t border-indigo-500/50">
                <p className="text-sm font-bold text-indigo-100 mb-4 italic flex items-center">
                   <Plus className="w-4 h-4 mr-2" /> 인사 데이터 일괄 업로드
                </p>
                <div className="space-y-4">
                  <p className="text-[11px] text-indigo-200 leading-relaxed font-bold">
                    [본부, 담당, 팀, 사번, 이름, 역할] 순서의 엑셀 파일을 업로드하여 전사 조직 및 인력 정보를 동기화합니다.
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept=".xlsx, .xls"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`w-full py-4 bg-white text-indigo-600 font-black rounded-3xl hover:bg-indigo-50 transition-all flex items-center justify-center shadow-xl ${
                      isUploading ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isUploading ? '업로드 중...' : '엑셀 파일 선택'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center">
               <Filter className="w-3 h-3 mr-2" /> Recent Changes
             </h4>
             <div className="space-y-4 opacity-50 grayscale italic">
                <p className="text-sm font-bold text-slate-300">최근 업데이트 내역이 없습니다.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationView;
