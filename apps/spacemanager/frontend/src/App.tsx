import { useEffect, useState, useMemo } from 'react';
import SeatMap from './components/Map/SeatMap';
import FloorSelector from './components/Layout/FloorSelector';
import OrganizationView from './components/Org/OrganizationView';
import SettingsView from './components/Settings/SettingsView';
import SimulationResultView from './components/Simulation/SimulationResultView';
import { MapPin, Users, LayoutDashboard, Settings, CheckCircle, Construction, Cpu } from 'lucide-react';
import { fetchSeats, fetchOrganizations, fetchFloors, reserveSeat, fetchAssignments, runSimulation } from './api/api';
import type { Seat, Organization, Floor, SpaceAssignment } from './api/api';
import floor4f from './assets/floor_4f.png';
import floor7f from './assets/floor_7f.png';
import floor15f from './assets/floor_15f.png';

const FLOOR_ASSETS: Record<string, string> = {
  '4F': floor4f,
  '7F': floor7f,
  '15F': floor15f
};

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'org' | 'settings'>('dashboard');
  const [currentFloor, setCurrentFloor] = useState('4F');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [assignments, setAssignments] = useState<SpaceAssignment[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState<Record<number, number> | null>(null);

  const processedSeats = useMemo(() => {
    return seats.map(s => ({
      ...s,
      xPos: s.xPos ?? (s as any).xpos ?? 0,
      yPos: s.yPos ?? (s as any).ypos ?? 0
    }));
  }, [seats]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setSelectedSeat(null);
        
        const [fetchedFloors, fetchedOrgs] = await Promise.all([
          fetchFloors(),
          fetchOrganizations()
        ]);
        setFloors(fetchedFloors);
        setOrgs(fetchedOrgs);

        const floor = fetchedFloors.find(f => f.name === currentFloor);
        if (floor) {
          const [fetchedSeats, fetchedAssignments] = await Promise.all([
            fetchSeats(floor.id),
            fetchAssignments(floor.id)
          ]);
          setSeats(fetchedSeats);
          setAssignments(fetchedAssignments);
        } else {
          setSeats([]);
          setAssignments([]);
        }
      } catch (error) {
        console.error('Data loading failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentView === 'dashboard') {
      loadData();
    }
  }, [currentFloor, currentView]);

  const handleRunSimulation = async (weights: Record<string, number>) => {
    try {
      const result = await runSimulation({ weights, floorIds: [] });
      setSimulationResult(result);
    } catch (error) {
       console.error('Simulation failed:', error);
       alert('시뮬레이션 실행 중 오류가 발생했습니다.');
    }
  };

  const handleApplySuccess = () => {
    setSimulationResult(null);
    // Refresh only if we are on dashboard or need to update data
    alert('배치 추천안이 성공적으로 반영되었습니다!');
    window.location.reload(); // Hard refresh to ensure everything's clean
  };

  const handleReserve = async () => {
    if (!selectedSeat) return;
    try {
      await reserveSeat(selectedSeat.id, 1);
      const floor = floors.find(f => f.name === currentFloor);
      if (floor) {
        const updatedSeats = await fetchSeats(floor.id);
        setSeats(updatedSeats);
      }
      setSelectedSeat(null);
      alert('좌석이 성공적으로 예약되었습니다!');
    } catch (error) {
      console.error('Reservation failed:', error);
      alert('예약 중 오류가 발생했습니다.');
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof currentView, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`w-full flex items-center px-6 py-4 rounded-2xl font-bold transition-all ${
        currentView === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border border-indigo-500' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
    >
      <Icon className={`mr-4 w-5 h-5 ${currentView === id ? 'text-white' : 'text-slate-400'}`} /> {label}
    </button>
  );

  return (
    <div className="flex flex-row h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-100 mb-6">
          <h1 className="text-2xl font-black text-indigo-600 flex items-center tracking-tight">
            <div className="bg-indigo-600 p-2.5 rounded-xl mr-4 shadow-indigo-200 shadow-xl">
              <MapPin className="text-white w-6 h-6" />
            </div> 
            SpaceManager
          </h1>
        </div>
        <nav className="flex-1 px-6 space-y-3">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="대시보드" />
          <SidebarItem id="org" icon={Users} label="조직 관리" />
          <SidebarItem id="settings" icon={Settings} label="설정" />
        </nav>
        <div className="p-8 border-t border-slate-50">
           <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg mr-4">JD</div>
             <div>
               <p className="text-sm font-black text-slate-800">홍길동 팀원</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Cloud Biz Team</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-12 shadow-sm z-10 sticky top-0">
          <div className="flex items-baseline">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {currentView === 'dashboard' ? '실시간 좌석 현황' : currentView === 'org' ? '조직 및 인력 관리' : '시스템 설정'}
            </h2>
            <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {currentView}
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="font-black bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl text-xs border border-indigo-100 shadow-sm">클라우드사업팀</span>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-12 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto h-full">
            {currentView === 'dashboard' ? (
              <div className="space-y-10">
                <div className="flex justify-between items-end">
                  <div>
                    <FloorSelector currentFloor={currentFloor} onFloorChange={setCurrentFloor} />
                    <p className="mt-3 text-slate-400 text-sm font-bold flex items-center">
                      <div className="w-5 h-1 bg-indigo-400 rounded-full mr-3 animate-pulse"></div>
                      {currentFloor}층 도면을 분석 중입니다.
                    </p>
                  </div>
                  {isLoading && (
                    <div className="flex items-center bg-white px-6 py-3 rounded-2xl text-indigo-600 border border-slate-100 shadow-xl animate-bounce">
                       <span className="text-xs font-black uppercase tracking-widest">Updating...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 h-full min-h-[700px]">
                  <div className="xl:col-span-9">
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6 overflow-hidden relative min-h-[700px] flex items-center justify-center">
                      <SeatMap 
                        floorAsset={FLOOR_ASSETS[currentFloor] || floor4f} 
                        seats={processedSeats} 
                        assignments={assignments}
                        onSeatSelect={setSelectedSeat} 
                        selectedSeatId={selectedSeat?.id || null} 
                      />
                    </div>
                  </div>
                  
                  <div className="xl:col-span-3 space-y-8">
                    {selectedSeat && (
                      <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                        <h3 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-4 italic">Seating Confirmation</h3>
                        <p className="text-5xl font-black text-white mb-10 tracking-tighter">{selectedSeat.seatNumber}</p>
                        <button 
                          onClick={handleReserve}
                          className="w-full py-6 bg-white text-indigo-700 font-black rounded-3xl hover:bg-slate-50 transition-all flex items-center justify-center shadow-2xl text-lg group"
                        >
                          <CheckCircle className="mr-3 w-7 h-7 group-hover:scale-110 transition-transform" /> 예약 확정
                        </button>
                      </div>
                    )}

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Capacity Overview</h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-baseline mb-2">
                           <span className="text-sm font-bold text-slate-500">Total Available</span>
                           <span className="text-4xl font-black text-slate-800">{seats.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full mb-8">
                           <div 
                             className="bg-indigo-500 h-full rounded-full" 
                             style={{ width: `${seats.length > 0 ? (seats.filter(s => s.status === 'occupied').length / seats.length) * 100 : 0}%` }}
                           ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Occupied</p>
                            <p className="text-2xl font-black text-slate-800">{seats.filter(s => s.status === 'occupied').length}</p>
                          </div>
                          <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100">
                            <p className="text-[10px] uppercase font-black text-indigo-400 mb-2 tracking-widest">Empty</p>
                            <p className="text-2xl font-black text-indigo-600">{seats.filter(s => s.status === 'available').length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'org' ? (
              <OrganizationView />
            ) : (
              <SettingsView onRunSimulation={handleRunSimulation} />
            )}

            {simulationResult && (
              <SimulationResultView 
                recommendations={simulationResult} 
                onClose={() => setSimulationResult(null)} 
                onApplySuccess={handleApplySuccess}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
