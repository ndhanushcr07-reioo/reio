import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { getPlan } from '../utils/workoutPlan';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const GOAL_LABELS = {
    weight_loss: 'Fat Loss', muscle_gain: 'Muscle Gain',
    endurance: 'Endurance', general_fitness: 'General Fitness',
    maintenance: 'Maintenance', flexibility: 'Flexibility',
};
const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };


export default function DashboardPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [s, c, q] = await Promise.all([
                    api.get('/progress/summary'),
                    api.get('/progress/charts'),
                    api.get('/motivation'),
                ]);
                setSummary(s.data.data);
                setCharts(c.data.data);
                setQuote(q.data.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const accuracyChartData = {
        labels: charts?.dates || [],
        datasets: [
            {
                label: 'Accuracy %',
                data: charts?.accuracyTrend || [],
                borderColor: '#00f5ff',
                backgroundColor: 'rgba(0, 245, 255, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff4d6d',
                pointRadius: 5,
            },
        ],
    };

    const repsChartData = {
        labels: charts?.dates || [],
        datasets: [
            {
                label: 'Reps',
                data: charts?.repsTrend || [],
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f59e0b',
                pointRadius: 5,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#e2e8f0' } },
            tooltip: { backgroundColor: '#1e293b', titleColor: '#00f5ff', bodyColor: '#e2e8f0' },
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
    };

    if (loading) {
        return (
            <div className="page-shell">
                <Navbar />
                <div className="loading-screen"><div className="pulse-loader" /><p>Loading your stats…</p></div>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <Navbar />
            <main className="dashboard">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome back, {user.name?.split(' ')[0]} 👋</h1>
                        <p className="subtitle">Here's your fitness summary</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/workout')}>
                        🏃 Start Workout
                    </button>
                </div>

                {/* Motivational Quote */}
                {quote && (
                    <div className="quote-card">
                        <p className="quote-text">"{quote.quote}"</p>
                        <p className="quote-author">— {quote.author}</p>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🔥</div>
                        <div className="stat-value">{summary?.consistencyStreak ?? 0}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">{summary?.averageAccuracy ?? 0}%</div>
                        <div className="stat-label">Avg Accuracy</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value">{summary?.bestSessionScore ?? 0}%</div>
                        <div className="stat-label">Best Score</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💪</div>
                        <div className="stat-value">{summary?.totalWorkoutsCompleted ?? 0}</div>
                        <div className="stat-label">Total Workouts</div>
                    </div>
                </div>

                {/* TODAY'S ADAPTIVE WORKOUT PLAN */}
                {(() => {
                    const { exercises, isDefault, missingFields } = getPlan(user);
                    return (
                        <div className="today-plan-card">
                            <div className="plan-header">
                                <span className="plan-icon">📋</span>
                                <h3>Today's Workout Plan</h3>
                                <span className="plan-day">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            </div>

                            {/* Profile-level + goal chip */}
                            {!isDefault && (
                                <div className="plan-meta">
                                    <span className="meta-chip level">{LEVEL_LABELS[user.fitnessLevel] || user.fitnessLevel}</span>
                                    <span className="meta-sep">×</span>
                                    <span className="meta-chip goal">{GOAL_LABELS[user.goal] || user.goal}</span>
                                    <span className="meta-note">Personalised plan</span>
                                </div>
                            )}

                            {/* Missing profile prompt */}
                            {isDefault && missingFields.length > 0 && (
                                <div className="plan-incomplete">
                                    ⚠️ Complete your profile to get a personalised plan.
                                    <button onClick={() => navigate('/profile')} className="plan-complete-btn">Set {missingFields.join(' & ')} →</button>
                                </div>
                            )}

                            <div className="plan-exercises">
                                {exercises.map((ex, idx) => (
                                    <div key={ex.id} className="plan-ex-row">
                                        <span className="plan-ex-num">{idx + 1}</span>
                                        <span className="plan-ex-icon">{ex.icon}</span>
                                        <div className="plan-ex-info">
                                            <strong>{ex.label}</strong>
                                            <span>{ex.sets}</span>
                                        </div>
                                        <span className={`plan-ex-tip ${ex.trackAs ? '' : 'tip-freeform'}`}>
                                            {ex.trackLabel}
                                        </span>
                                        <button className="plan-start-btn" onClick={() => navigate('/workout')}>
                                            Start →
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <style>{`
                                .today-plan-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(0,245,255,0.12); border-radius: 20px; padding: 24px; margin-bottom: 24px; }
                                .plan-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
                                .plan-icon { font-size: 20px; }
                                .plan-header h3 { flex: 1; font-size: 16px; color: white; }
                                .plan-day { font-size: 12px; color: #888; }
                                .plan-meta { display:flex; align-items:center; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
                                .meta-chip { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
                                .meta-chip.level { background:rgba(124,58,237,0.2); color:#a78bfa; border:1px solid rgba(124,58,237,0.3); }
                                .meta-chip.goal  { background:rgba(0,245,212,0.1); color:#00f5d4; border:1px solid rgba(0,245,212,0.25); }
                                .meta-sep { color:#555; font-size:12px; }
                                .meta-note { font-size:11px; color:#555; margin-left:4px; }
                                .plan-incomplete { font-size:13px; color:#f59e0b; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:10px 14px; margin-bottom:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
                                .plan-complete-btn { padding:5px 12px; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#f59e0b; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700; white-space:nowrap; }
                                .plan-exercises { display: flex; flex-direction: column; gap: 12px; }
                                .plan-ex-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                                .plan-ex-num { width: 24px; height: 24px; background: linear-gradient(135deg,#00f5ff,#7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: white; flex-shrink: 0; }
                                .plan-ex-icon { font-size: 20px; flex-shrink: 0; }
                                .plan-ex-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                                .plan-ex-info strong { font-size: 14px; color: white; }
                                .plan-ex-info span { font-size: 12px; color: #888; }
                                .plan-ex-tip { font-size: 11px; color: #00f5ff; background: rgba(0,245,255,0.08); padding: 4px 8px; border-radius: 6px; margin-right: 8px; white-space: nowrap; }
                                .plan-ex-tip.tip-freeform { color:#f59e0b; background:rgba(245,158,11,0.08); }
                                .plan-start-btn { padding: 8px 16px; background: rgba(0,245,255,0.1); border: 1px solid rgba(0,245,255,0.25); color: #00f5ff; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; white-space: nowrap; }
                                .plan-start-btn:hover { background: rgba(0,245,255,0.2); }
                            `}</style>
                        </div>
                    );
                })()}

                {/* Charts */}
                {charts?.dates?.length > 0 ? (
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>📈 Accuracy Trend</h3>
                            <Line data={accuracyChartData} options={chartOptions} />
                        </div>
                        <div className="chart-card">
                            <h3>💪 Reps Trend</h3>
                            <Line data={repsChartData} options={chartOptions} />
                        </div>
                    </div>
                ) : (
                    <div className="empty-charts">
                        <p>📊 No workout data yet. Complete your first session to see your progress charts!</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions">
                    <button className="quick-btn" onClick={() => navigate('/workout')}>🏋️ Start Workout</button>
                    <button className="quick-btn" onClick={() => navigate('/nutrition')}>🥗 View Nutrition</button>
                </div>
            </main>
        </div>
    );
}
