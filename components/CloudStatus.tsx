
import React from 'react';

interface CloudStatusProps {
  status: 'syncing' | 'synced' | 'error';
  className?: string;
}

const CloudStatus: React.FC<CloudStatusProps> = ({ status, className = "" }) => {
  return (
    <div className={`flex items-center justify-center w-4 h-4 ${className}`}>
      <div 
        title={status === 'syncing' ? 'Синхронизация' : status === 'error' ? 'Ошибка связи' : 'Подключено'}
        className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ${
          status === 'syncing' ? 'bg-amber-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}
      ></div>
    </div>
  );
};

export default CloudStatus;
