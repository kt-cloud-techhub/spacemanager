import React, { useState } from 'react';
import { Settings, Save, Shield, HardDrive, Cpu, AlertCircle, Info } from 'lucide-react';

const FormField: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-4 rounded-2xl transition-colors">
    <div className="md:col-span-1">
      <label className="text-sm font-black text-slate-700 block mb-1">{label}</label>
      {description && <p className="text-[10px] font-bold text-slate-400 italic">{description}</p>}
    </div>
    <div className="md:col-span-2">
      {children}
    </div>
  </div>
);

const SettingsCard: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 space-y-4">
    <div className="flex items-center space-x-4 mb-8">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
    <div className="space-y-0">
      {children}
    </div>
  </div>
);

const SettingsView: React.FC<{ onRunSimulation: (weights: Record<string, number>) => void }> = ({ onRunSimulation }) => {
  const [weights, setWeights] = useState({ proximity: 70, stability: 30, density: 50 });
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
     setSuccess(true);
     setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <Settings className="mr-4 w-10 h-10 text-indigo-600" /> 시스템 운영 설정
          </h2>
          <p className="text-sm font-bold text-slate-400 mt-2">알고리즘 가중치 및 보안 정책을 관리합니다.</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => onRunSimulation(weights)}
            className="flex items-center px-10 py-4 bg-indigo-50 text-indigo-600 rounded-3xl font-black border-2 border-indigo-100 hover:bg-indigo-100 transition-all"
          >
            <Cpu className="mr-3 w-5 h-5" /> 자동 배치 시뮬레이션 실행
          </button>
          <button 
            onClick={handleSave}
            className={`flex items-center px-10 py-4 rounded-3xl font-black transition-all shadow-2xl ${
              success ? 'bg-emerald-500 text-white scale-95' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-100'
            }`}
          >
            {success ? <><Info className="mr-3 w-5 h-5" /> 저장됨</> : <><Save className="mr-3 w-5 h-5" /> 설정 저장</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Placement Strategy Section */}
        <SettingsCard title="배치 알고리즘 가중치" icon={Cpu}>
          <FormField label="조직 근접도 (Proximity)" description="임원석 및 협업 부서 간의 거리 중요도">
            <input 
              type="range" 
              className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
              value={weights.proximity}
              onChange={(e) => setWeights({ ...weights, proximity: parseInt(e.target.value) })}
            />
            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase">
              <span>Low</span>
              <span className="text-indigo-600">{weights.proximity}%</span>
              <span>High</span>
            </div>
          </FormField>
          
          <FormField label="배치 안정성 (Stability)" description="현재 배치 상태 유지 및 변동폭 최소 가중치">
            <input 
              type="range" 
              className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
              value={weights.stability}
              onChange={(e) => setWeights({ ...weights, stability: parseInt(e.target.value) })}
            />
            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase">
              <span>Min</span>
              <span className="text-indigo-600">{weights.stability}%</span>
              <span>Max</span>
            </div>
          </FormField>

          <FormField label="밀집도 제한 (Density)" description="구역당 최대 인원 수용 가중치">
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>80% (여유 지원)</option>
              <option selected>90% (표준 권장)</option>
              <option>100% (최대 효율)</option>
            </select>
          </FormField>
        </SettingsCard>

        {/* Security & Access Section */}
        <SettingsCard title="보안 및 접근 정책" icon={Shield}>
          <FormField label="임원석 전용 모드" description="구역 내 임원 전용 좌석 보호 여부">
            <div className="flex items-center">
              <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600 border-slate-300 focus:ring-indigo-500" checked />
              <span className="ml-3 text-sm font-bold text-slate-600 italic">항상 보호됨 (Enabled)</span>
            </div>
          </FormField>

          <FormField label="예약 초기화 주기" description="좌석 예약이 자동 해제되는 시간">
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>매일 자정</option>
              <option>매주 금요일 18:00</option>
              <option selected>상시 유지 (Manual Only)</option>
            </select>
          </FormField>

          <FormField label="동시성 제어 레벨" description="좌석 점유 시 충돌 방지 수준">
            <div className="inline-flex rounded-xl p-1 bg-slate-50 border border-slate-100">
               <button className="px-4 py-2 text-xs font-black rounded-lg bg-white shadow-sm text-indigo-600">Strong</button>
               <button className="px-4 py-2 text-xs font-black rounded-lg text-slate-400 hover:text-slate-600">Eventual</button>
            </div>
          </FormField>
        </SettingsCard>

        {/* Infrastructure Section */}
        <SettingsCard title="인프라 및 리소스" icon={HardDrive}>
          <FormField label="데이터 백업 경로" description="S3 혹은 사내 스토리지 경로">
             <input type="text" value="s3://kt-cloud-spacemanager/backups/" readOnly className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono text-slate-500" />
          </FormField>
          
          <FormField label="시스템 알림 채널" description="공지 발송용 채널 연동">
             <div className="flex space-x-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">Slack</span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100">SMS</span>
             </div>
          </FormField>
        </SettingsCard>

        {/* System Logs Placeholder */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-emerald-400 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 mb-4">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Real-time System Audit</p>
          </div>
          <div className="font-mono text-xs space-y-2 opacity-80 leading-relaxed italic">
            <p>[2026-03-30 16:04:12] INFO: Simulation Weights Updated (PROXIMITY: 75%)</p>
            <p>[2026-03-30 16:04:15] WARN: Database Connection Latency (+12ms)</p>
            <p>[2026-03-30 16:05:01] INFO: Security Policy Reloaded (ZONE-A-EXEC)</p>
            <p className="border-l-2 border-emerald-500 pl-4 py-2 bg-emerald-500/10 rounded-r-lg">
              SYSTEM_STATE_OK: All services operational.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-8 rounded-3xl flex items-start space-x-4">
        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
        <div>
          <p className="text-sm font-black text-amber-800 mb-1 tracking-tight italic">주의사항 (Caution)</p>
          <p className="text-xs font-bold text-amber-700 leading-relaxed">
            알고리즘 가중치를 변경하면 기존 배치 제안 결과가 크게 달라질 수 있습니다. 
            시뮬레이션 테스트를 먼저 수행한 후 본 설정값을 반영해 주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
