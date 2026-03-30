import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line } from 'react-konva';
import useImage from 'use-image';
import type { Seat, SpaceAssignment } from '../../api/api';

interface SeatMapProps {
  floorAsset: string;
  seats: Seat[];
  assignments: SpaceAssignment[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeatId: number | null;
}

const SeatMap: React.FC<SeatMapProps> = ({ floorAsset, seats, assignments, onSeatSelect, selectedSeatId }) => {
  const [image] = useImage(floorAsset);
  const [hoveredSeatId, setHoveredSeatId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Original image dimensions for 4F: 1446 x 1258
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

  const parsePolygon = (polygonStr: string): number[] => {
    if (!polygonStr) return [];
    return polygonStr.split(';').flatMap(point => 
      point.split(',').map(coord => parseFloat(coord))
    );
  };

  const handleMouseEnter = (seatId: number) => {
    setHoveredSeatId(seatId);
    document.body.style.cursor = 'pointer';
  };

  const handleMouseLeave = () => {
    setHoveredSeatId(null);
    document.body.style.cursor = 'default';
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto p-4 bg-slate-50/30">
      <Stage 
        width={ORIGINAL_WIDTH * scale} 
        height={ORIGINAL_HEIGHT * scale} 
        scaleX={scale} 
        scaleY={scale}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={ORIGINAL_WIDTH}
              height={ORIGINAL_HEIGHT}
              opacity={1}
            />
          )}

          {/* Team Areas */}
          {assignments.map((assignment) => {
            const points = parsePolygon(assignment.areaPolygon);
            return (
              <Group key={assignment.id}>
                <Line
                  points={points}
                  fill={assignment.color}
                  opacity={0.15}
                  closed={true}
                  stroke={assignment.color}
                  strokeWidth={2}
                  dash={[10, 5]}
                />
                <Text
                  x={points[0]}
                  y={points[1] - 30}
                  text={assignment.orgName}
                  fontSize={24}
                  fontStyle="black"
                  fill={assignment.color}
                  opacity={0.8}
                />
              </Group>
            );
          })}
          
          {seats.map((seat) => (
            <Group 
              key={seat.id} 
              onMouseEnter={() => handleMouseEnter(seat.id)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onSeatSelect(seat)}
              onTap={() => onSeatSelect(seat)}
            >
              <Rect
                x={seat.xPos}
                y={seat.yPos}
                width={36}
                height={26}
                fill={
                  seat.id === selectedSeatId 
                    ? '#6366F1' // Indigo
                    : seat.status === 'occupied' 
                      ? '#E2E8F0' // Occupied
                      : '#10B981' // Available
                }
                cornerRadius={8}
                stroke={seat.id === selectedSeatId ? "#4F46E5" : "white"}
                strokeWidth={seat.id === selectedSeatId ? 3 : 1}
                shadowBlur={seat.id === selectedSeatId || hoveredSeatId === seat.id ? 15 : 2}
                shadowColor="#6366F1"
                shadowOpacity={0.3}
              />
              <Text
                x={seat.xPos}
                y={seat.yPos + 32}
                text={seat.seatNumber}
                fontSize={12}
                fontStyle="bold"
                fill={seat.id === selectedSeatId ? "#4F46E5" : "#64748B"}
                align="center"
                width={36}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default SeatMap;
