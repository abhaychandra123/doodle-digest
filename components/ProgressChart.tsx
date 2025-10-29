import React from 'react';
import { ClockIcon } from './icons/ClockIcon';
import { useTheme } from '../contexts/ThemeContext';

interface ChartData {
  label: string;
  value: number;
}

interface ProgressChartProps {
  title: string;
  subtitle: string;
  updated: string;
  type: 'bar' | 'line';
  data: ChartData[];
  color: string;
  backgroundColor: string;
  darkBackgroundColor: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ title, subtitle, updated, type, data, color, backgroundColor, darkBackgroundColor }) => {
  const { theme } = useTheme();

  const SvgChart: React.FC = () => {
    const width = 300;
    const height = 120;
    const padding = { top: 10, right: 0, bottom: 20, left: 25 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = Math.max(...data.map(d => d.value), 0) * 1.1;
    
    const yAxisLabels = [0, Math.round(maxValue / 2), Math.round(maxValue)].filter((v, i, a) => a.indexOf(v) === i);

    const getX = (index: number) => padding.left + (chartWidth / (data.length - (type === 'bar' ? 0 : 1))) * index;
    const getY = (value: number) => padding.top + chartHeight - (chartHeight * value) / (maxValue || 1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis labels and grid lines */}
        {yAxisLabels.map(label => (
          <g key={`y-axis-${label}`}>
            <text x={padding.left - 5} y={getY(label)} dy="0.32em" textAnchor="end" className="text-[10px] fill-slate-400 dark:fill-slate-500">
              {label}
            </text>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={getY(label)}
              y2={getY(label)}
              className="stroke-slate-200 dark:stroke-slate-700"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </g>
        ))}

        {/* Chart Content */}
        {type === 'bar' ? (
          <g>
            {data.map((d, i) => {
              const barWidth = chartWidth / data.length * 0.6;
              return (
                <rect
                  key={i}
                  x={getX(i) + (chartWidth/data.length * 0.2)}
                  y={getY(d.value)}
                  width={barWidth}
                  height={chartHeight - (getY(d.value) - padding.top)}
                  fill={color}
                  rx="2"
                />
              );
            })}
          </g>
        ) : (
          <g>
            <path
              d={`M${data.map((d, i) => `${getX(i)} ${getY(d.value)}`).join(' L')}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(d.value)}
                r="3"
                fill={color}
              />
            ))}
          </g>
        )}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={`x-axis-${i}`} x={getX(i) + (type === 'bar' ? (chartWidth/data.length)/2 : 0)} y={height - 5} textAnchor="middle" className="text-[10px] fill-slate-500 dark:fill-slate-400">
            {d.label}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="p-4 rounded-xl shadow-sm h-full" style={{ backgroundColor: theme === 'dark' ? darkBackgroundColor : backgroundColor }}>
      <SvgChart />
      <div className="mt-2 text-center">
        <p className="font-bold text-slate-700 dark:text-slate-200">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {updated}
        </p>
      </div>
    </div>
  );
};

export default ProgressChart;