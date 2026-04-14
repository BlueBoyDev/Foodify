'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';

const DATA = [
  { name: 'Lun', sales: 4000 },
  { name: 'Mar', sales: 3000 },
  { name: 'Mié', sales: 2000 },
  { name: 'Jue', sales: 2780 },
  { name: 'Vie', sales: 1890 },
  { name: 'Sáb', sales: 2390 },
  { name: 'Dom', sales: 3490 },
];

interface SalesChartProps {
  type?: 'bar' | 'line' | 'area';
  data?: any[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ type = 'bar', data = DATA }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }} 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Ventas']}
            />
            <Bar 
              dataKey="sales" 
              fill="#E8673A" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#E8673A" strokeWidth={3} dot={{ r: 4, fill: '#E8673A', strokeWidth: 2, stroke: '#fff' }} />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8673A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#E8673A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip />
            <Area type="monotone" dataKey="sales" stroke="#E8673A" fillOpacity={1} fill="url(#colorSales)" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
export default SalesChart;
