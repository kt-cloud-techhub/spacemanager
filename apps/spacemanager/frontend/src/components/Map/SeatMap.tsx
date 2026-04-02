import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import type { Seat, SpaceAssignment } from '../../api/api';

interface SeatMapProps {
  floorAsset: string;
  seats: Seat[];
  assignments: SpaceAssignment[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeatId: number | null;
  isEditingAreas?: boolean;
  currentPoints?: number[];
  onPointAdd?: (x: number, y: number) => void;
  layoutData?: string;
}

const SeatMap: React.FC<SeatMapProps> = ({ 
  seats, assignments, onSeatSelect, selectedSeatId,
  isEditingAreas = false, currentPoints = [], onPointAdd, layoutData
}) => {
  const [hoveredSeatId, setHoveredSeatId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('grid'); // Default to grid
  const containerRef = useRef<HTMLDivElement>(null);

  const structures = useMemo(() => {
    try {
      return layoutData ? JSON.parse(layoutData) : [];
    } catch (e) {
      console.error('Failed to parse layoutData', e);
      return [];
    }
  }, [layoutData]);

  const ORIGINAL_WIDTH = 1446;
  const ORIGINAL_HEIGHT = 1258;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const scaleX = (clientWidth - 40) / ORIGINAL_WIDTH;
        const scaleY = (clientHeight - 40) / ORIGINAL_HEIGHT;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const seatsBySection = useMemo(() => {
    return seats.reduce((acc, seat) => {
      const section = seat.sectionName || '기타 구역';
      if (!acc[section]) acc[section] = [];
      acc[section].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
  }, [seats]);

  const handleStageClick = (e: any) => {
    if (!isEditingAreas || !onPointAdd) return;
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const x = pointerPosition.x / scale;
    const y = pointerPosition.y / scale;
    onPointAdd(Math.round(x), Math.round(y));
  };

  const parsePolygon = (polygonStr: string): number[] => {
    if (!polygonStr) return [];
    return polygonStr.split(';').flatMap(point => 
      point.split(',').map(coord => parseFloat(coord))
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {Object.entries(seatsBySection).sort().map(([section, sectionSeats]) => (
        <div key={section} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
          <h3 className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2">
            <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
            {section}
            <span className="text-[11px] font-normal text-slate-400 ml-auto">{sectionSeats.length}석</span>
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {sectionSeats.map(seat => {
              const isExec = seat.isExecutiveSeat;
              const rowNum = parseInt(seat.seatNumber.split('.').pop() || '0');
              const isAfterCorridor = rowNum > 4;

              return (
                <button
                  key={seat.id}
                  onClick={() => onSeatSelect(seat)}
                  className={`
                    aspect-square rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center border-2
                    ${isAfterCorridor ? 'mt-2' : ''}
                    ${seat.id === selectedSeatId 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105 z-10' 
                      : isExec
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                        : seat.status === 'occupied' 
                          ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-white border-slate-50 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50'}
                  `}
                >
                  {isExec && <div className="text-[8px] opacity-70 mb-0.5">임원</div>}
                  {seat.seatNumber.includes('.') ? seat.seatNumber.split('.').pop() : '석'}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Dashboard Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">좌석 현황 (전체 {seats.length}석)</h2>
            <p className="text-[11px] text-slate-400">구역별 촘촘한 그리드 뷰를 제공합니다.</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            그리드 뷰
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            지도 뷰
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto">
        {viewMode === 'grid' ? (
          renderGridView()
        ) : (
          <div className="flex items-center justify-center min-h-full p-8">
            <div className="bg-white p-6 rounded-[40px] shadow-2xl ring-1 ring-slate-200/50">
              <Stage 
                width={ORIGINAL_WIDTH * scale} 
                height={ORIGINAL_HEIGHT * scale} 
                scaleX={scale} 
                scaleY={scale}
                onClick={handleStageClick}
              >
                <Layer>
                  {/* Digital Twin Structures */}
                  <Rect width={ORIGINAL_WIDTH} height={ORIGINAL_HEIGHT} fill="#FBFDFF" />
                  
                  {structures.map((s: any) => (
                    <Group key={s.id}>
                      <Rect 
                        x={s.x} y={s.y} width={s.w} height={s.h}
                        fill="#F1F5F9" stroke="#E2E8F0" strokeWidth={1} cornerRadius={8}
                      />
                      <Text 
                        x={s.x} y={s.y + 10} width={s.w} text={s.name}
                        fontSize={12} align="center" fill="#94A3B8" opacity={0.6}
                      />
                    </Group>
                  ))}

                  {/* Assignments */}
                  {assignments.map((assignment) => {
                    const points = parsePolygon(assignment.areaPolygon);
                    return (
                      <Group key={assignment.id}>
                        <Line points={points} fill={assignment.color} opacity={0.1} closed={true} stroke={assignment.color} strokeWidth={2} dash={[5, 5]} />
                        <Text x={points[0]} y={points[1] - 15} text={assignment.orgName} fontSize={14} fontStyle="bold" fill={assignment.color} />
                      </Group>
                    );
                  })}

                  {/* Interactive Seats */}
                  {seats.map(seat => (
                    <Group 
                      key={seat.id} 
                      onClick={() => onSeatSelect(seat)}
                      onMouseEnter={() => setHoveredSeatId(seat.id)}
                      onMouseLeave={() => setHoveredSeatId(null)}
                    >
                      <Rect
                        x={seat.xPos} y={seat.yPos} width={24} height={24}
                        fill={seat.id === selectedSeatId ? '#6366F1' : (seat.status === 'occupied' ? '#E2E8F0' : '#10B981')}
                        cornerRadius={6}
                        shadowBlur={hoveredSeatId === seat.id ? 10 : 0}
                        shadowColor="#6366F1"
                      />
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatMap;
