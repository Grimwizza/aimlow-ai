import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { COLORS } from './utils';
import { Icon } from '../../Layout';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold text-sm mb-1">{label || payload[0].name}</p>
                <p className="font-mono text-xs text-blue-600 font-bold">
                    {payload[0].value}
                    {payload[0].unit || (typeof payload[0].value === 'number' && payload[0].value < 100 ? '%' : 'B')}
                </p>
            </div>
        );
    }
    return null;
};

export const MarketShareChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="w-full h-[350px] bg-white border-2 border-black p-4 brutal-shadow mb-8 print:shadow-none print:border-gray-300 print:h-[300px] break-inside-avoid">
            <h4 className="font-black uppercase text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Icon name="pie-chart" size={16} /> Estimated Market Share
            </h4>
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const SalesChart = ({ data, title }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="w-full h-[350px] bg-white border-2 border-black p-4 brutal-shadow mb-8 print:shadow-none print:border-gray-300 print:h-[300px] break-inside-avoid">
            <h4 className="font-black uppercase text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Icon name="bar-chart-2" size={16} /> {title || "Annual Sales (Est.)"}
            </h4>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis
                        dataKey="year"
                        style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}
                        tick={{ fill: 'black' }}
                        axisLine={{ stroke: 'black', strokeWidth: 2 }}
                    />
                    <YAxis
                        style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}
                        tick={{ fill: 'black' }}
                        axisLine={{ stroke: 'black', strokeWidth: 2 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="revenue"
                        fill="#2563EB"
                        stroke="black"
                        strokeWidth={2}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
