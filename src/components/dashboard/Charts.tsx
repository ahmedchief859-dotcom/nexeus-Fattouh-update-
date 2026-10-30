import { useEffect, useState } from 'react';
import { BarChart3, PieChart, MoreHorizontal, TrendingUp } from 'lucide-react';
import { SplineAreaChart, DonutChart } from '@/components/charts/Charts';
import { salesPerformance, categoryDistribution } from '@/data/mockData';
import { fetchDailyRevenue, forecastNext } from '@/lib/erpApi';

export function SalesChart() {
  const [chartData, setChartData] = useState(salesPerformance);
  const [forecast, setForecast] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      const daily = await fetchDailyRevenue(7);
      if (daily.length === 7) {
        const mapped = daily.map((d, i) => ({
          day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          sales: d.total,
          target: salesPerformance[i].target,
        }));
        setChartData(mapped);
        setForecast(forecastNext(daily.map((d) => d.total), 14));
      } else {
        setForecast(forecastNext(salesPerformance.map((d) => d.sales), 14));
      }
    })();
  }, []);

  const total = chartData.reduce((s, d) => s + d.sales, 0);
  const forecastTotal = forecast.reduce((s, d) => s + d, 0);

  return (
    <div className="glass glass-hover rounded-2xl p-5 lg:p-6 animate-slide-up delay-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-nexora-accent" />
            <h3 className="font-display font-semibold text-white text-base">Sales Performance</h3>
          </div>
          <p className="text-xs text-white/40">7-day actual + 14-day AI forecast</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-xl font-bold text-white">${(total / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-green-400">+14.2% vs prev</p>
          </div>
          <button className="text-white/30 hover:text-white/60 p-1"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-3 text-xs flex-wrap">
        <span className="flex items-center gap-1.5 text-white/50"><span className="w-3 h-1 rounded-full bg-nexora-accent" /> Actual Sales</span>
        <span className="flex items-center gap-1.5 text-white/50"><span className="w-3 h-0.5 rounded-full border-t border-dashed border-purple-400" /> Target</span>
        <span className="flex items-center gap-1.5 text-white/50"><span className="w-3 h-0.5 rounded-full border-t border-dashed border-purple-400/60" style={{ boxShadow: '0 0 4px rgba(167,139,250,0.5)' }} /> AI Forecast</span>
      </div>
      <SplineAreaChart data={chartData} forecast={forecast} />
      {forecast.length > 0 && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-400/5 border border-purple-400/15">
          <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-xs text-white/60">Projected next 14 days: <span className="font-display font-semibold text-purple-300">${(forecastTotal / 1000).toFixed(1)}k</span> based on seasonal velocity & moving averages</p>
        </div>
      )}
    </div>
  );
}

export function CategoryDonut() {
  return (
    <div className="glass glass-hover rounded-2xl p-5 lg:p-6 animate-slide-up delay-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-nexora-accent" />
            <h3 className="font-display font-semibold text-white text-base">Sales by Category</h3>
          </div>
          <p className="text-xs text-white/40">Distribution breakdown</p>
        </div>
        <button className="text-white/30 hover:text-white/60 p-1"><MoreHorizontal className="w-4 h-4" /></button>
      </div>
      <DonutChart data={categoryDistribution} size={220} />
    </div>
  );
}
