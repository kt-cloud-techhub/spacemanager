import React from 'react';
import { Layers } from 'lucide-react';

interface FloorSelectorProps {
  currentFloor: string;
  onFloorChange: (floor: string) => void;
}

const FloorSelector: React.FC<FloorSelectorProps> = ({ currentFloor, onFloorChange }) => {
  const floors = ['4F', '7F', '15F'];

  return (
    <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
      {floors.map((floor) => (
        <button
          key={floor}
          onClick={() => onFloorChange(floor)}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentFloor === floor
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" />
          {floor}
        </button>
      ))}
    </div>
  );
};

export default FloorSelector;
