import { useMemo } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getSessionRoundConfig } from '../lib/events';
import { roundsToChartData } from '../lib/rounds';
import { formatMs } from '../lib/time';
import { useAppStore } from '../store/useAppStore';
import { Card } from './ui/Card';

export function GraphPanel() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const multiSolve = useAppStore((s) => s.multiSolve);
  const solves = session?.solves ?? [];

  const { multiMode, roundSize } = getSessionRoundConfig(session, multiSolve);

  const data = useMemo(
    () => roundsToChartData(solves, multiMode ? roundSize : 1),
    [multiMode, roundSize, solves],
  );

  return (
    <Card title="Progression" className="relative isolate z-10 h-full">
      <div className="h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-fg-muted">
            {multiMode
              ? 'Complete a multi round to see round times here.'
              : 'Complete solves to see times here.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ left: 8, right: 12, top: 12, bottom: 8 }}
            >
              <XAxis
                dataKey="round"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(139, 92, 246, 0.15)' }}
                tickLine={false}
                label={{
                  value: 'Round',
                  position: 'insideBottom',
                  offset: -4,
                  fill: '#6b7280',
                  fontSize: 11,
                }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(139, 92, 246, 0.15)' }}
                tickLine={false}
                width={52}
                tickFormatter={(v) => formatMs(v as number)}
              />
              <Tooltip
                contentStyle={{
                  background: '#12142b',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 10,
                }}
                labelStyle={{ color: '#94a3b8' }}
                labelFormatter={(round) => `Round ${round}`}
                formatter={(value) => [formatMs(value as number), 'Round time']}
              />
              <Line
                type="monotone"
                dataKey="ms"
                name="Round time"
                stroke="rgba(250, 204, 21, 0.9)"
                strokeWidth={2.5}
                dot={{
                  r: 5,
                  fill: '#facc15',
                  stroke: '#12142b',
                  strokeWidth: 2,
                }}
                activeDot={{ r: 7, fill: '#facc15' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-3 text-xs text-fg-subtle">
        {multiMode
          ? `Line graph of round times (${data.length} complete round${data.length === 1 ? '' : 's'}). DNF rounds hidden.`
          : `Line graph of solve times (${data.length} point${data.length === 1 ? '' : 's'}).`}
      </div>
    </Card>
  );
}
