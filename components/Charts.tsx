'use client';

import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface ChartProps {
  type: 'pie' | 'bar';
  data: any;
}

export default function Charts({ type, data }: ChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 서버 사이드에서는 렌더링하지 않음
  if (!isMounted) {
    return <div className="h-64 w-full bg-gray-100 rounded-md"></div>;
  }

  return (
    <>
      {type === 'pie' && <Pie data={data} />}
      {type === 'bar' && (
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            }
          }}
        />
      )}
    </>
  );
} 