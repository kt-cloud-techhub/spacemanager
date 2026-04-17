import { useEffect, useState, useMemo } from 'react';
import SeatMap from './components/Map/SeatMap';
import FloorSelector from './components/Layout/FloorSelector';
import OrganizationView from './components/Org/OrganizationView';
import SettingsView from './components/Settings/SettingsView';
import { MapPin, Users, LayoutDashboard, Settings, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchSeats, fetchFloors, reserveSeat, runSimulation, fetchAssignments, saveAssignment, moveSeat } from './api/api';
import type { Seat, Floor, SpaceAssignment } from './api/api';
import AreaEditorOverlay from './components/Map/AreaEditorOverlay';
import SimulationResultView from './components/Simulation/SimulationResultView';
import floor4f from './assets/floor_4f.png';
import floor7f from './assets/floor_7f.png';
import floor15f from './assets/floor_15f.png';
import SmartPlacementPanel from './components/Placement/SmartPlacementPanel'; // V14.1

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
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState<Record<number, number> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPoints, setEditPoints] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<SpaceAssignment[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // V14.1 Smart Placement State
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [isSelectingAnchor, setIsSelectingAnchor] = useState(false);
  const [anchorSeat, setAnchorSeat] = useState<Seat | null>(null);
  const [highlightedSeatIds, setHighlightedSeatIds] = useState<number[]>([]);
  const [movingSeat, setMovingSeat] = useState<Seat | null>(null);

  const processedSeats = useMemo(() => {
    return seats.map(s => ({
      ...s,
      xPos: s.xPos ?? (s as any).xpos ?? 0,
      yPos: s.yPos ?? (s as any).ypos ?? 0
    }));
  }, [seats]);

  const loadSeats = async () => {
    try {
      setIsLoading(true);
      const fetchedFloors = await fetchFloors();
      setFloors(fetchedFloors);

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

  useEffect(() => {
    if (currentView === 'dashboard') {
      loadSeats();
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

  const handleMoveSeat = async (toSeat: Seat) => {
    if (!movingSeat) return;
    if (window.confirm(`${movingSeat.occupantName}님을 ${toSeat.seatNumber} 좌석으로 이동하시겠습니까?`)) {
      try {
        await moveSeat(movingSeat.id, toSeat.id);
        setMovingSeat(null);
        setSelectedSeat(null);
        await loadSeats();
      } catch (error) {
        console.error('Failed to move seat:', error);
        alert('좌석 이동 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!seat) return;
    
    if (isEditMode) {
      handleSeatMapClick(seat.xPos, seat.yPos);
      return;
    }

    if (isSelectingAnchor) {
      if (seat?.isExecutiveSeat) {
        setAnchorSeat(seat);
        setIsSelectingAnchor(false);
      } else {
        alert('임원석만 기준석으로 선택할 수 있습니다.');
      }
      return;
    }

    if (movingSeat && seat?.status === 'available') {
      handleMoveSeat(seat);
      return;
    }

    if (seat?.status === 'occupied') {
      setMovingSeat(seat);
    } else {
      setMovingSeat(null);
    }
    setSelectedSeat(seat);
  };

  const handleApplySuccess = () => {
    setSimulationResult(null);
    alert('배치 추천안이 성공적으로 반영되었습니다!');
    loadSeats(); 
  };

  const handleSaveArea = async (orgId: number, points: number[]) => {
    const floor = floors.find(f => f.name === currentFloor);
    if (!floor) return;

    try {
      const formattedPoints = [];
      for (let i = 0; i < points.length; i += 2) {
        formattedPoints.push(`${points[i]},${points[i + 1]}`);
      }
      const areaPolygon = formattedPoints.join(' ');
      
      await saveAssignment({
        floorId: floor.id,
        orgId,
        areaPolygon
      });
      alert('구역이 저장되었습니다.');
      setIsEditMode(false);
      setEditPoints([]);
      loadSeats();
    } catch (error) {
      console.error('Failed to save area:', error);
      alert('구역 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSeatMapClick = (x: number, y: number) => {
    if (isEditMode) {
      setEditPoints(prev => [...prev, Math.round(x), Math.round(y)]);
    }
  };

  const handleUndoPoint = () => {
    setEditPoints(prev => prev.slice(0, -2));
  };

  const handleReserve = async () => {
    if (!selectedSeat) return;
    try {
      await reserveSeat(selectedSeat.id, 1);
      loadSeats();
      setSelectedSeat(null);
      alert('좌석이 성공적으로 예약되었습니다!');
    } catch (error) {
      console.error('Reservation failed:', error);
      alert('예약 중 오류가 발생했습니다.');
    }
  };

  const handleCancelReservation = async () => {
    if (!selectedSeat) return;
    if (window.confirm(`${selectedSeat.seatNumber} 좌석의 배정을 취소하시겠습니까?`)) {
      try {
        await cancelSeatReservation(selectedSeat.id);
        setSelectedSeat(null);
        loadSeats();
        alert('배정이 취소되었습니다.');
      } catch (error) {
        console.error('Failed to cancel reservation:', error);
        alert('배정 취소 중 오류가 발생했습니다.');
      }
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof currentView, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`w-full flex items-center rounded-2xl font-bold transition-all ${
        isSidebarCollapsed ? 'justify-center py-4 px-0' : 'px-6 py-4'
      } ${
        currentView === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border border-indigo-500' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
      title={isSidebarCollapsed ? label : ''}
    >
      <Icon className={`${isSidebarCollapsed ? '' : 'mr-4'} w-5 h-5 ${currentView === id ? 'text-white' : 'text-slate-400'}`} />
      {!isSidebarCollapsed && label}
    </button>
  );

  return (
    <div className="flex flex-row h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20 transition-all duration-300 relative`}>
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-28 bg-white border border-slate-200 rounded-full p-1.5 shadow-md hover:bg-slate-50 transition-all z-30"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-600" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />}
        </button>

        <div className={`p-8 border-b border-slate-100 mb-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-indigo-200 shadow-xl flex-shrink-0">
            <MapPin className="text-white w-6 h-6" />
          </div> 
          {!isSidebarCollapsed && (
            <h1 className="text-2xl font-black text-indigo-600 ml-4 tracking-tight animate-in fade-in slide-in-from-left-2">
              SpaceManager
            </h1>
          )}
        </div>
        <nav className={`flex-1 ${isSidebarCollapsed ? 'px-3' : 'px-6'} space-y-3`}>
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="대시보드" />
          <SidebarItem id="org" icon={Users} label="조직 관리" />
          <SidebarItem id="settings" icon={Settings} label="설정" />
        </nav>
        <div className={`p-8 border-t border-slate-50 ${isSidebarCollapsed ? 'px-4' : ''}`}>
           <div className={`bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg text-xs">JD</div>
             {!isSidebarCollapsed && (
               <div className="ml-3 overflow-hidden animate-in fade-in">
                 <div className="text-xs font-black text-slate-800 truncate">신은정 팀원</div>
                 <div className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wider">기술전략팀</div>
               </div>
             )}
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

        <section className="flex-1 overflow-auto p-6 bg-[#F8FAFC]">
          <div className="max-w-[1700px] mx-auto h-full relative">
            {currentView === 'dashboard' ? (
              <div className="space-y-10">
                <div className="flex justify-between items-end">
                  <div>
                    <FloorSelector currentFloor={currentFloor} onFloorChange={setCurrentFloor} />
                      <div className="mt-3 text-slate-400 text-sm font-bold flex items-center">
                        <div className="w-5 h-1 bg-indigo-400 rounded-full mr-3 animate-pulse"></div>
                        {`${currentFloor}층 좌석 현황을 확인 중입니다.`}
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`px-6 py-2.5 rounded-2xl font-black text-xs border transition-all ${
                              isEditMode ? 'bg-rose-500 text-white border-rose-600 shadow-xl' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isEditMode ? '편집 종료' : '구역 편집'}
                          </button>
                          <button 
                            onClick={() => {
                              setIsPlacementMode(!isPlacementMode);
                              if (isPlacementMode) {
                                setAnchorSeat(null);
                                setIsSelectingAnchor(false);
                                setHighlightedSeatIds([]);
                              }
                            }}
                            className={`px-6 py-2.5 rounded-2xl font-black text-xs border transition-all ${
                              isPlacementMode ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isPlacementMode ? '배치 모드 종료' : '팀 스마트 배치'}
                          </button>
                        </div>
                      </div>
                  </div>
                  {isLoading && (
                    <div className="flex items-center bg-white px-6 py-3 rounded-2xl text-indigo-600 border border-slate-100 shadow-xl animate-bounce">
                       <span className="text-xs font-black uppercase tracking-widest">Updating...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 h-full">
                  <div className="2xl:col-span-10">
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-2 overflow-hidden relative flex flex-col h-full">
                      <SeatMap 
                        floorAsset={FLOOR_ASSETS[currentFloor] || floor4f} 
                        seats={processedSeats} 
                        onSeatSelect={handleSeatClick}
                        selectedSeatId={selectedSeat?.id || null}
                        assignments={assignments}
                        onMapClick={handleSeatMapClick}
                        isEditMode={isEditMode}
                        highlightedSeatIds={highlightedSeatIds}
                        isSelectingAnchor={isSelectingAnchor}
                        activePoints={editPoints}
                      />
                      {isEditMode && (
                        <AreaEditorOverlay 
                          onSave={handleSaveArea}
                          onCancel={() => { setIsEditMode(false); setEditPoints([]); }}
                          onReset={() => setEditPoints([])}
                          onUndo={handleUndoPoint}
                          currentPoints={editPoints}
                        />
                      )}
                    </div>
                  </div>
                  
                    <div className="2xl:col-span-2 space-y-6">
                      {isPlacementMode ? (
                          <SmartPlacementPanel 
                            floorId={floors.find(f => f.name === currentFloor)?.id || 0}
                            currentFloor={currentFloor}
                            seats={seats}
                            onSelectAnchorMode={setIsSelectingAnchor}
                            isSelectingAnchor={isSelectingAnchor}
                            anchorSeat={anchorSeat}
                            onClearAnchor={() => setAnchorSeat(null)}
                            onSuccess={() => { loadSeats(); setIsPlacementMode(false); }}
                          />
                      ) : (
                        <>
                          {selectedSeat && (
                            <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-100 animate-in zoom-in-95 duration-300">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-[9px] font-black uppercase text-indigo-300 tracking-widest italic">Seating Confirmation</h3>
                                {selectedSeat.status === 'occupied' && (
                                  <button 
                                    onClick={handleCancelReservation}
                                    className="p-1.5 bg-indigo-500/50 hover:bg-rose-500 text-white rounded-lg transition-all"
                                    title="배정 취소"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="text-3xl font-black text-white mb-6 tracking-tighter">{selectedSeat.seatNumber}</div>
                              {selectedSeat.status === 'occupied' ? (
                                <div className="p-4 bg-indigo-500/30 border border-indigo-400/30 rounded-2xl">
                                  <div className="text-[10px] font-black text-indigo-200 uppercase mb-1 tracking-widest">Occupant</div>
                                  <div className="text-lg font-black text-white">{selectedSeat?.occupantName || 'Unknown'}</div>
                                  <div className="text-[11px] font-bold text-indigo-200 opacity-80">{selectedSeat?.teamName || 'Global Team'}</div>
                                </div>
                              ) : (
                                <button 
                                  onClick={handleReserve}
                                  className="w-full py-4 bg-white text-indigo-700 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center shadow-lg text-sm group"
                                >
                                  <CheckCircle className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" /> 예약 확정
                                </button>
                              )}
                            </div>
                          )}

                          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg">
                            <h3 className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-widest">Capacity</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-baseline mb-1">
                                 <span className="text-[11px] font-bold text-slate-500">Available</span>
                                 <span className="text-2xl font-black text-slate-800">{seats.length}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full mb-6">
                                 <div 
                                   className="bg-indigo-500 h-full rounded-full" 
                                   style={{ width: `${seats.length > 0 ? (seats.filter(s => s.status === 'occupied').length / seats.length) * 100 : 0}%` }}
                                 ></div>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                  <div className="text-[8px] uppercase font-black text-slate-400 mb-1 tracking-widest">Occupied</div>
                                  <div className="text-lg font-black text-slate-800">{seats.filter(s => s.status === 'occupied').length}</div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                                  <div className="text-[8px] uppercase font-black text-indigo-400 mb-1 tracking-widest">Empty</div>
                                  <div className="text-lg font-black text-indigo-600">{seats.filter(s => s.status === 'available').length}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
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
