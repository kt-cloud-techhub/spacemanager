import React from 'react';
import { CheckCircle2, XCircle, ArrowRightLeft, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { applySimulation } from '../../api/api';

interface SimulationResultViewProps {
  recommendations: Record<number, number>;
  onClose: () => void;
  onApplySuccess: () => void;
}

const SimulationResultView: React.FC<SimulationResultViewProps> = ({ recommendations, onClose, onApplySuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const totalMoves = Object.keys(recommendations).length;

  const handleApply = async () => {
    setLoading(true);
    try {
      await applySimulation(recommendations);
      onApplySuccess();
    } catch (error) {
      console.error('Failed to apply simulation:', error);
      alert('일괄 반영 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-10 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-10 bg-indigo-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">자동 배치 시뮬레이션 결과</h2>
            <p className="text-indigo-100 font-bold mt-2 italic">알고리즘 가중치를 기반으로 도출된 최적의 추천안입니다.</p>
          </div>
          <button onClick={onClose} className="p-3 bg-indigo-500/50 hover:bg-indigo-400 rounded-2xl transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="flex items-center text-indigo-600 mb-4">
                <ArrowRightLeft className="w-5 h-5 mr-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Total Movements</span>
              </div>
              <p className="text-4xl font-black text-slate-800">{totalMoves} 명</p>
              <p className="text-sm font-bold text-slate-400 mt-2 italic">기존 자리 대비 이동 인원</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="flex items-center text-emerald-600 mb-4">
                <TrendingUp className="w-5 h-5 mr-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Team Cohesion</span>
              </div>
              <p className="text-4xl font-black text-slate-800">92%</p>
              <p className="text-sm font-bold text-slate-400 mt-2 italic">팀 응집도 예상 점수</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="flex items-center text-amber-600 mb-4">
                <Info className="w-5 h-5 mr-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Efficiency</span>
              </div>
              <p className="text-4xl font-black text-slate-800">+15%</p>
              <p className="text-sm font-bold text-slate-400 mt-2 italic">공간 활용 효율 향상</p>
            </div>
          </div>

          {/* Details Table Placeholder */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 px-2 tracking-tight flex items-center">
               <CheckCircle2 className="w-5 h-5 mr-3 text-indigo-600" /> 세부 변경 내역 (预览)
            </h3>
            <div className="bg-white border-2 border-slate-50 rounded-[2rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">대상자</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">현재 위치</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">변경 위치</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Simplified demonstration */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-700">관리자 (User #1)</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-400">4F - 101</td>
                      <td className="px-8 py-5 text-sm font-bold text-indigo-600">4F - 105 [Exec]</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">Recommended</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-700">팀원 A (User #2)</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-400">Unassigned</td>
                      <td className="px-8 py-5 text-sm font-bold text-indigo-600">4F - 110</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">New Slot</span></td>
                    </tr>
                  </tbody>
                </table>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border-l-4 border-amber-400 flex items-start space-x-4">
             <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
             <p className="text-xs font-bold text-amber-700 leading-relaxed">
               **주의**: '일괄 반영' 클릭 시 현재 모든 시뮬레이션 결과가 데이터베이스에 실제 예약으로 확정됩니다. 
               기존의 모든 개인별 예약 내역은 삭제되고 본 추천안으로 교체되니 신중히 결정해 주세요.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-6">
           <button 
             onClick={onClose}
             className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all"
           >
             취소 및 재설정
           </button>
           <button 
             onClick={handleApply}
             disabled={loading}
             className={`px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 transition-all ${
               loading ? 'opacity-50 cursor-wait' : 'hover:bg-indigo-700 hover:scale-105 active:scale-95'
             }`}
           >
             {loading ? '반영 중...' : '확정 및 일괄 반영'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationResultView;
