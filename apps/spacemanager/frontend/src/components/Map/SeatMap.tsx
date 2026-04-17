import React, { useRef, useMemo, useState } from 'react';
import { LayoutGrid, Coffee, DoorOpen, Wind, Plus, Minus, Maximize, ZoomIn } from 'lucide-react';
import type { Seat, SpaceAssignment } from '../../api/api';

interface SeatMapProps {
  floorAsset: string;
  seats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeatId: number | null;
  assignments?: SpaceAssignment[];
  onMapClick?: (x: number, y: number) => void;
  isEditMode?: boolean;
  highlightedSeatIds?: number[]; // V14.1
  isSelectingAnchor?: boolean;   // V14.1
  activePoints?: number[];       // V18.20 Active Draw Preview
}

const SeatMap: React.FC<SeatMapProps> = ({ 
  floorAsset, seats, onSeatSelect, selectedSeatId, assignments = [], onMapClick, isEditMode,
  highlightedSeatIds = [], isSelectingAnchor = false, activePoints = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!onMapClick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    onMapClick(x, y);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1.0);

  const isFloor7 = useMemo(() => floorAsset.toLowerCase().includes('7f'), [floorAsset]);
  const isFloor4 = useMemo(() => floorAsset.toLowerCase().includes('4f'), [floorAsset]);
  const isFloor15 = useMemo(() => floorAsset.toLowerCase().includes('15f') || floorAsset.includes('15층'), [floorAsset]);

  // --- 7F Rendering Logic ---
  const renderBelt = (rowChar: 'A' | 'B') => {
    const beltSeats = seats.filter(s => s.seatNumber.includes(`.${rowChar}.`));
    const columns = Array.from(new Set(beltSeats.map(s => {
      const parts = s.seatNumber.split('.');
      return parts.length >= 3 ? parseInt(parts[2]) : 0;
    }))).sort((a, b) => a - b);

    return (
      <div className="flex gap-2 px-6">
        {columns.map(colNum => {
          const colSeats = beltSeats
            .filter(s => s.seatNumber.split('.')[2] === String(colNum))
            .sort((a, b) => parseInt(a.seatNumber.split('.').pop()!) - parseInt(b.seatNumber.split('.').pop()!));
          
          if (colSeats.length === 0) return null;

          const sectionName = colSeats[0].sectionName || "";
          const isTeamArea = sectionName.includes('TEAM') || sectionName.includes('EXEC');
          
          const teamColor = sectionName.includes('CLOUD') ? 'bg-indigo-600 border-indigo-700' :
                             sectionName.includes('OPS') ? 'bg-emerald-500 border-emerald-600' :
                             sectionName.includes('PLAT') ? 'bg-orange-100 border-orange-200 text-orange-900' : 
                             sectionName.includes('EXEC') ? 'bg-slate-800 border-slate-900 text-white' : '';

          return (
            <div key={colNum} className="flex flex-col items-center">
              <div className={`
                p-1 rounded-xl border transition-all relative
                ${isTeamArea ? `${teamColor} shadow-md` : 'bg-blue-50/30 border-blue-100'}
              `}>
                {isTeamArea && rowChar === 'B' && colSeats[0].seatNumber.endsWith('.1') && (
                  <div className="absolute -top-6 left-0 right-0 text-center">
                    <span className={`text-[8px] font-black uppercase whitespace-nowrap ${teamColor.includes('orange') ? 'text-orange-900' : isTeamArea && !teamColor.includes('white') ? 'text-slate-500' : 'text-slate-500'}`}>
                      {sectionName.split('_')[1] || "TEAM"}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-1">
                  {colSeats.map(seat => (
                    <button
                      key={seat.id}
                      onClick={(e) => { e.stopPropagation(); onSeatSelect(seat); }}
                      className={`
                        w-8 h-8 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center border-2
                        ${seat.id === selectedSeatId 
                          ? 'bg-yellow-400 border-yellow-500 text-slate-900 shadow-lg scale-110 z-10' 
                          : seat.status === 'occupied' 
                            ? (isTeamArea && !teamColor.includes('orange') ? 'bg-white/20 border-white/30 text-white' : 'bg-white border-slate-300 text-slate-800') 
                            : 'bg-slate-200/50 border-slate-300/50 text-transparent hover:bg-slate-300/60 hover:border-slate-400'}
                      `}
                    >
                      {seat.occupantName ? seat.occupantName.slice(-2) : ''}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[7px] font-bold text-slate-300 mt-1">{colNum}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // --- Generic Matrix Rendering Logic (Used for 4F, 7F, 15F) ---
  const renderMatrixGrid = (maxRows: number, maxCols: number, mergeMap: any, floorTag: string) => {
    const rows = Array.from({ length: maxRows }, (_, i) => i + 1);
    
    // Dynamic Column Labels (A, B... Z, AA, AB...) (V12.0)
    const getColLabel = (index: number) => {
      let n = index;
      let label = '';
      while (n >= 0) {
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26) - 1;
      }
      return label;
    };
    const cols = Array.from({ length: maxCols }, (_, i) => getColLabel(i));

    const isSkipCell = (r: number, cNum: number) => {
      for (const [key, config] of Object.entries(mergeMap)) {
        const [row, col] = key.split('-').map(Number);
        const isInsideRow = r >= row && r < row + (config as any).rowSpan;
        const isInsideCol = cNum >= col && cNum < col + (config as any).colSpan;
        if (isInsideRow && isInsideCol && !(r === row && cNum === col)) return true;
      }
      return false;
    };

    return (
      <div className="p-4 bg-slate-50/5 min-h-full">
        <div 
          style={{ gridTemplateColumns: `auto repeat(${maxCols}, 34px)` }}
          className="inline-grid gap-0.25 bg-white p-3 rounded-[1.5rem] shadow-2xl border border-slate-100 mb-20 relative"
        >
          <div className="w-8 h-8"></div>
          {cols.map(c => (
            <div key={c} className="text-[9px] font-black text-slate-300 text-center uppercase py-1">{c}</div>
          ))}

          {rows.map(r => (
            <React.Fragment key={r}>
              <div className="text-[9px] font-black text-slate-300 flex items-center justify-center w-7 h-8 pr-1">{r}</div>
              
              {cols.map((c, colIdx) => {
                const cNum = colIdx + 1;
                if (isSkipCell(r, cNum)) return null;

                const merge = mergeMap[`${r}-${cNum}`];
                const seatNum = `${floorTag}.${c}${r}`;
                const seat = seats.find(s => s.seatNumber === seatNum);

                if (merge) {
                  const isExecMerge = merge.type === 'exec' || merge.label?.includes('임원');
                  const theme = merge.type === 'room' ? 'bg-indigo-50/40 border-indigo-100 text-indigo-500 shadow-sm' :
                                merge.type === 'exec' ? 'bg-slate-800 border-slate-900 text-white shadow-lg' :
                                merge.type === 'lounge' ? 'bg-orange-50/40 border-orange-100 text-orange-500 shadow-sm' : 
                                'bg-slate-100/30 border-slate-100 text-slate-400';

                  return (
                    <div key={c} 
                         onClick={() => {
                           if (isExecMerge && seat) onSeatSelect(seat);
                         }}
                         style={{ 
                           gridColumn: `span ${merge.colSpan}`,
                           gridRow: `span ${merge.rowSpan}`
                         }}
                         className={`border-[1.5px] rounded-lg flex flex-col items-center justify-center p-1 text-center transition-all ${theme} ${merge.rowSpan > 1 ? 'min-h-[64.5px]' : 'h-8'} 
                           ${isExecMerge ? 'cursor-pointer hover:scale-[1.02] hover:ring-2 hover:ring-indigo-400 active:scale-95' : ''}
                           ${isSelectingAnchor && !isExecMerge ? 'opacity-20 grayscale pointer-events-none' : ''}
                           ${seat && highlightedSeatIds.includes(seat.id) ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                         `}>
                        <span className="text-[7.5px] font-black uppercase tracking-wider leading-tight opacity-60">
                          {merge.label}
                        </span>
                        {seat?.status === 'occupied' && (
                          <div className="mt-1 px-2 py-0.5 bg-white/20 rounded text-[9px] font-black text-white animate-in fade-in zoom-in-95">
                            {seat.occupantName || seat.teamName || 'Occupied'}
                          </div>
                        )}
                    </div>
                  );
                }

                return (
                  <div key={c} className="w-8 h-8 flex items-center justify-center">
                    {seat ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSeatSelect(seat); }}
                        style={seat.teamColor ? { backgroundColor: seat.teamColor, borderColor: 'rgba(0,0,0,0.1)' } : {}}
                        className={`
                          w-7.5 h-7.5 rounded-md text-[7px] font-black transition-all flex flex-col items-center justify-center border-2 
                          ${isSelectingAnchor && !seat.isExecutiveSeat ? 'opacity-20 grayscale pointer-events-none' : ''}
                          ${highlightedSeatIds.includes(seat.id) ? 'ring-2 ring-yellow-400 animate-pulse bg-yellow-50 border-yellow-500 scale-105 z-10' : ''}
                          ${seat.id === selectedSeatId 
                            ? 'bg-yellow-400 border-yellow-500 text-slate-900 shadow-lg scale-110 z-10' 
                            : seat.isExecutiveSeat 
                              ? 'bg-slate-800 border-slate-900 text-white ring-1 ring-slate-700/50' 
                              : seat.status === 'occupied' 
                                ? (seat.teamColor ? 'text-white' : 'bg-white border-slate-400 text-slate-900 shadow-sm')
                                : 'bg-slate-200/60 border-slate-300 text-transparent hover:bg-white hover:border-indigo-400 hover:text-indigo-600'}
                        `}
                      >
                        {seat.isExecutiveSeat && <div className="text-[4.5px] font-black opacity-70 mb-0.25 leading-none">EXE</div>}
                        <span className={seat.isExecutiveSeat ? 'text-white drop-shadow-sm' : ''}>
                          {seat.occupantName || ''}
                        </span>
                      </button>
                    ) : (
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderGridView = () => {
    if (isFloor7) {
      const mergeMap7 = {
        '1-1': { colSpan: 2, rowSpan: 1, label: 'OA존', theme: 'bg-blue-50 border-blue-100 text-blue-700' },
        '1-6': { colSpan: 2, rowSpan: 1, label: 'Toilte', theme: 'bg-slate-100 border-slate-200 text-slate-600' },
        '1-27': { colSpan: 2, rowSpan: 1, label: '라운지', theme: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
        '1-29': { colSpan: 3, rowSpan: 1, label: 'OA존', theme: 'bg-blue-50 border-blue-100 text-blue-700' },
        '1-33': { colSpan: 1, rowSpan: 3, label: '감사실', theme: 'bg-amber-50 border-amber-200 text-amber-900' },
        '8-1': { colSpan: 3, rowSpan: 4, label: '임원Seat(1)', type: 'exec', theme: 'bg-slate-800 border-slate-900 text-white' },
        '8-25': { colSpan: 2, rowSpan: 4, label: '임원Seat(3)', type: 'exec', theme: 'bg-slate-800 border-slate-900 text-white' },
        '5-33': { colSpan: 1, rowSpan: 4, label: '임원Seat(4)', type: 'exec', theme: 'bg-slate-800 border-slate-900 text-white' }
      };
      return renderMatrixGrid(11, 33, mergeMap7, "7");
    }

    if (isFloor4) {
      const mergeMap4 = {
        '1-1': { colSpan: 4, rowSpan: 1, label: 'Meeting Room', type: 'room' },
        '1-5': { colSpan: 2, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '1-7': { colSpan: 5, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '1-12': { colSpan: 2, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '1-14': { colSpan: 1, rowSpan: 8, label: 'Lounge', type: 'lounge' },
        '9-1': { colSpan: 3, rowSpan: 2, label: 'Meeting Room', type: 'room' },
        '11-1': { colSpan: 3, rowSpan: 3, label: 'Storage', type: 'facility' },
        '10-5': { colSpan: 4, rowSpan: 3, label: 'Toilet', type: 'facility' },
        '10-9': { colSpan: 3, rowSpan: 3, label: 'Storage', type: 'facility' },
        '10-12': { colSpan: 2, rowSpan: 3, label: 'EV', type: 'facility' },
        '10-15': { colSpan: 2, rowSpan: 3, label: 'EV', type: 'facility' },
        '10-17': { colSpan: 3, rowSpan: 3, label: 'Steps', type: 'facility' },
        '6-15': { colSpan: 2, rowSpan: 3, label: 'Meeting Room', type: 'room' },
        '6-17': { colSpan: 10, rowSpan: 3, label: 'Storage', type: 'facility' },
        '11-24': { colSpan: 3, rowSpan: 2, label: '임원 Seat', type: 'exec' },
        '13-24': { colSpan: 3, rowSpan: 3, label: 'Wall', type: 'facility' },
        '14-13': { colSpan: 1, rowSpan: 4, label: 'Meeting Room', type: 'room' },
        '14-14': { colSpan: 1, rowSpan: 5, label: 'Lounge', type: 'lounge' },
        '18-13': { colSpan: 1, rowSpan: 3, label: 'Meeting Room', type: 'room' },
        '19-14': { colSpan: 1, rowSpan: 2, label: 'Meeting Room', type: 'room' },
        '16-24': { colSpan: 3, rowSpan: 4, label: '임원 Seat', type: 'exec' },
        '18-20': { colSpan: 3, rowSpan: 2, label: '임원 Seat', type: 'exec' },
        '20-10': { colSpan: 3, rowSpan: 1, label: '임원 Seat', type: 'exec' }
      };
      return renderMatrixGrid(20, 26, mergeMap4, "4");
    }

    if (isFloor15) {
      const mergeMap15 = {
        '1-1': { colSpan: 7, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '1-8': { colSpan: 3, rowSpan: 1, label: 'Reception Room', type: 'room' },
        '1-11': { colSpan: 3, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '1-14': { colSpan: 1, rowSpan: 8, label: 'Lounge', type: 'lounge' },
        '3-1': { colSpan: 2, rowSpan: 8, label: 'Meeting Room', type: 'room' },
        '11-1': { colSpan: 2, rowSpan: 3, label: 'Meeting Room', type: 'room' },
        '6-15': { colSpan: 2, rowSpan: 3, label: 'Meeting Room', type: 'room' },
        '6-17': { colSpan: 10, rowSpan: 3, label: 'Storage', type: 'facility' },
        '10-5': { colSpan: 4, rowSpan: 3, label: 'Toilet', type: 'facility' },
        '10-9': { colSpan: 3, rowSpan: 3, label: 'Storage', type: 'facility' },
        '10-12': { colSpan: 2, rowSpan: 3, label: 'EV', type: 'facility' },
        '10-15': { colSpan: 2, rowSpan: 3, label: 'EV', type: 'facility' },
        '10-17': { colSpan: 3, rowSpan: 3, label: 'Steps', type: 'facility' },
        // X-Z Shifting Up (14 -> 13, 17 -> 16)
        '13-24': { colSpan: 3, rowSpan: 3, label: 'Meeting Room', type: 'room' },
        '16-24': { colSpan: 3, rowSpan: 4, label: '임원 Seat', type: 'exec' },
        // M-N Shifting Up (15 -> 14, 19 -> 18, 20 -> 19)
        '14-13': { colSpan: 1, rowSpan: 4, label: 'Meeting Room', type: 'room' },
        '14-14': { colSpan: 1, rowSpan: 5, label: 'Lounge', type: 'lounge' },
        '18-13': { colSpan: 1, rowSpan: 3, label: 'Meeting Room', type: 'room' },
        '19-14': { colSpan: 1, rowSpan: 2, label: 'Meeting Room', type: 'room' },
        // Restored Missing Executive Seats (V10.5 -> Corrected V10.6)
        '20-5': { colSpan: 4, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '20-9': { colSpan: 4, rowSpan: 1, label: '임원 Seat', type: 'exec' },
        '18-20': { colSpan: 3, rowSpan: 2, label: '임원 Seat', type: 'exec' }
      };
      return renderMatrixGrid(21, 26, mergeMap15, "15");
    }

    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50/50">
        <div className="text-center">
           <LayoutGrid className="w-10 h-10 text-slate-200 mx-auto mb-4" />
           <p className="text-slate-400 font-bold text-sm">도면 데이터를 불러오지 못했습니다.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 relative">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 rounded-lg"><LayoutGrid className="w-4 h-4 text-indigo-600" /></div>
          <div>
            <h2 className="text-xs font-bold text-slate-800">좌석 현황 (전체 {seats.length}석)</h2>
            <div className="text-[10px] text-slate-400">
              {isFloor15 ? '15층 (21x26) 고밀도 디지털 트윈' : isFloor4 ? '4층 (20x25) 고밀도 디지털 트윈' : '7층 아일랜드형 디지털 트윈'}
            </div>
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 space-x-1">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500" title="축소"><Minus className="w-3.5 h-3.5" /></button>
          <div className="px-2 text-[10px] font-black text-slate-600 min-w-[40px] text-center">{Math.round(zoom * 100)}%</div>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500" title="확대"><Plus className="w-3.5 h-3.5" /></button>
          <div className="w-px h-3 bg-slate-200 mx-1" />
          <button onClick={handleResetZoom} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500" title="초기화"><Maximize className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className={`flex-1 overflow-auto relative ${isEditMode ? 'cursor-crosshair' : ''}`}
        onClick={handleContainerClick}
      >
        <div 
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top left',
            width: 'max-content',
            height: 'max-content'
          }}
          className="relative transition-transform duration-200 ease-out"
        >
          {/* SVG Layer for Polygons */}
          <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full min-h-[1000px] min-w-[1500px]">
            {/* Active Drawing Preview */}
            {isEditMode && activePoints.length >= 2 && (
              <g>
                <polyline
                  points={(() => {
                    const pairs = [];
                    for (let i = 0; i < activePoints.length; i += 2) {
                      pairs.push(`${activePoints[i]},${activePoints[i+1]}`);
                    }
                    return pairs.join(' ');
                  })()}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="drop-shadow-sm"
                />
                {/* Closed polygon preview if 3+ points */}
                {activePoints.length >= 6 && (
                  <polygon
                    points={(() => {
                      const pairs = [];
                      for (let i = 0; i < activePoints.length; i += 2) {
                        pairs.push(`${activePoints[i]},${activePoints[i+1]}`);
                      }
                      return pairs.join(' ');
                    })()}
                    fill="#ef4444"
                    fillOpacity="0.1"
                  />
                )}
                {/* Points markers */}
                {Array.from({ length: activePoints.length / 2 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={activePoints[i*2]}
                    cy={activePoints[i*2+1]}
                    r="4"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                ))}
              </g>
            )}
          </svg>
          {renderGridView()}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
