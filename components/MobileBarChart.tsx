'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';

interface MobileBarChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  label: string;
}

export default function MobileBarChart({ data, dataKey, nameKey, label }: MobileBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 w-full bg-gray-100 rounded-md"></div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey={nameKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} name={label} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
} 