import { useState, useRef, useEffect } from 'react';

// ── Exercise demo data ─────────────────────────────────────────
const DEMO_DATA = {
    // ── Squat family ─────────────────────────────────────────────
    bw_squats: {
        label: 'Bodyweight Squats',
        animClass: 'anim-squat',
        muscles: 'Quadriceps, Glutes, Hamstrings',
        effort: '💪 Lower body',
        tips: ['Feet shoulder-width apart', 'Keep chest tall, back straight', 'Lower hips until thighs are parallel', 'Push through heels to rise', 'Knees track over toes'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Stand tall, core braced' }, { icon: '⬇', label: 'Down', note: 'Hips back and down' }],
    },
    light_squats: {
        label: 'Light Squats',
        animClass: 'anim-squat',
        muscles: 'Quadriceps, Glutes',
        effort: '💪 Lower body',
        tips: ['Slow, controlled movement', 'Partial depth is fine to start', 'Keep weight on heels', 'Exhale on the way up'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Full stand' }, { icon: '⬇', label: 'Down', note: 'Comfortable depth' }],
    },
    squats: {
        label: 'Squats',
        animClass: 'anim-squat',
        muscles: 'Quadriceps, Glutes, Hamstrings, Core',
        effort: '💪 Full lower body',
        tips: ['Hip-width stance', 'Drive knees out', 'Full depth — thighs parallel', 'Neutral spine throughout', 'Brace core before each rep'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Drive through heels' }, { icon: '⬇', label: 'Down', note: 'Sit back, not straight down' }],
    },
    jump_squats: {
        label: 'Jump Squats',
        animClass: 'anim-jump-squat',
        muscles: 'Quadriceps, Glutes, Calves',
        effort: '🔥 Explosive lower body',
        tips: ['Squat deep then explode upward', 'Land softly, bend knees on contact', 'Keep chest up throughout', 'Reset before next rep', 'Use arms for momentum'],
        phases: [{ icon: '⬆', label: 'Jump', note: 'Explode fully upward' }, { icon: '⬇', label: 'Land', note: 'Soft landing, absorb impact' }],
    },
    pistol_squats: {
        label: 'Pistol Squats',
        animClass: 'anim-pistol-squat',
        muscles: 'Quadriceps, Glutes, Hip Flexors',
        effort: '🎯 Single-leg strength',
        tips: ['Balance on one leg', 'Extend other leg forward', 'Lower slowly — control matters', 'Drive through heel to stand', 'Use a support until stable'],
        phases: [{ icon: '⬆', label: 'Stand', note: 'Single leg, fully extended' }, { icon: '⬇', label: 'Lower', note: 'Other leg extends forward' }],
    },
    dynamic_lunges: {
        label: 'Dynamic Lunges',
        animClass: 'anim-lunge',
        muscles: 'Quadriceps, Glutes, Hamstrings',
        effort: '💪 Lower body + balance',
        tips: ['Alternate forward and reverse', 'Keep front knee over ankle', 'Lower back knee near floor', 'Upright torso at all times', 'Engage core throughout'],
        phases: [{ icon: '↕', label: 'Step', note: 'Fluid alternating motion' }, { icon: '⬇', label: 'Lower', note: 'Back knee near floor' }],
    },

    // ── Lunge family ─────────────────────────────────────────────
    forward_lunges: {
        label: 'Forward Lunges',
        animClass: 'anim-lunge',
        muscles: 'Quadriceps, Glutes, Hip Flexors',
        effort: '💪 Lower body + stability',
        tips: ['Step forward with control', 'Front knee over ankle — not beyond', 'Back knee lowers near floor', 'Push through front heel to return', 'Keep torso upright'],
        phases: [{ icon: '⬆', label: 'Stand', note: 'Feet together' }, { icon: '⬇', label: 'Lunge', note: 'Front thigh parallel' }],
    },
    step_ups: {
        label: 'Step-ups',
        animClass: 'anim-step-up',
        muscles: 'Quadriceps, Glutes, Calves',
        effort: '💪 Lower body drive',
        tips: ['Use a stable surface (step/bench)', 'Drive through the heel of the stepping leg', 'Bring trailing leg up fully', 'Step down with control', 'Alternate leading leg each set'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Step onto surface' }, { icon: '⬇', label: 'Down', note: 'Lower slowly' }],
    },

    // ── Push-up family ───────────────────────────────────────────
    pushups: {
        label: 'Push-ups',
        animClass: 'anim-pushup',
        muscles: 'Pectorals, Triceps, Anterior Deltoids',
        effort: '💪 Upper body + core',
        tips: ['Body straight from head to heels', 'Elbows at ~45° to body', 'Lower chest to just above floor', 'Push back to full extension', 'Brace core — no sagging hips'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Arms fully extended' }, { icon: '⬇', label: 'Down', note: 'Chest near floor' }],
    },
    std_pushups: {
        label: 'Standard Push-ups',
        animClass: 'anim-pushup',
        muscles: 'Pectorals, Triceps, Core',
        effort: '💪 Upper body',
        tips: ['Maintain rigid plank position', 'Controlled descent — 2 seconds down', 'Full range of motion', 'No flaring elbows wide', 'Breathe: inhale down, exhale up'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Lock out elbows' }, { icon: '⬇', label: 'Down', note: 'Controlled lower' }],
    },
    adv_pushups: {
        label: 'Push-ups (Advanced)',
        animClass: 'anim-pushup',
        muscles: 'Pectorals, Triceps, Core, Serratus',
        effort: '🔥 Full upper body',
        tips: ['Strict plank — no hips raised', 'Slow eccentric (3 sec down)', 'Explosive push phase', 'Rotate palms slightly outward', 'Protract scapula at top'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Explosive press' }, { icon: '⬇', label: 'Down', note: '3-second descent' }],
    },
    knee_pushups: {
        label: 'Knee Push-ups',
        animClass: 'anim-knee-pushup',
        muscles: 'Pectorals, Triceps',
        effort: '💪 Upper body (beginner)',
        tips: ['Kneel, cross ankles behind', 'Straight line from knee to head', 'Elbows at 45° — not flared', 'Lower chest slowly', 'Full push to arm extension'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Full arm extension' }, { icon: '⬇', label: 'Down', note: 'Chest near floor' }],
    },
    wall_pushups: {
        label: 'Wall Push-ups',
        animClass: 'anim-wall-pushup',
        muscles: 'Pectorals, Triceps',
        effort: '🌱 Upper body (beginner)',
        tips: ['Stand arm\'s length from wall', 'Place palms flat at shoulder height', 'Lower chest to wall, elbows at 45°', 'Push back to start', 'Keep body straight throughout'],
        phases: [{ icon: '⬆', label: 'Away', note: 'Arms extended' }, { icon: '⬇', label: 'Toward', note: 'Chest near wall' }],
    },
    decline_pushups: {
        label: 'Decline Push-ups',
        animClass: 'anim-decline-pushup',
        muscles: 'Upper Pectorals, Triceps, Shoulders',
        effort: '🔥 Upper chest focus',
        tips: ['Feet elevated on chair or step', 'Hands on floor, shoulder-width', 'Body straight, hips level', 'Lower chest to floor', 'Drive up explosively'],
        phases: [{ icon: '⬆', label: 'Up', note: 'Full arm press' }, { icon: '⬇', label: 'Down', note: 'Chest to floor' }],
    },
    mountain_climbers: {
        label: 'Mountain Climbers',
        animClass: 'anim-mountain-climber',
        muscles: 'Core, Shoulders, Hip Flexors, Quads',
        effort: '🔥 Full body cardio',
        tips: ['Start in high plank position', 'Drive knees to chest alternately', 'Keep hips level — don\'t bounce', 'Fast but controlled pace', 'Breathe rhythmically'],
        phases: [{ icon: '⬅', label: 'Left', note: 'Left knee drives in' }, { icon: '➡', label: 'Right', note: 'Right knee drives in' }],
    },

    // ── Cardio ───────────────────────────────────────────────────
    jumping_jacks: {
        label: 'Jumping Jacks',
        animClass: 'anim-jumping-jack',
        muscles: 'Calves, Abductors, Shoulders, Cardio',
        effort: '⭐ Full body cardio',
        tips: ['Start with feet together, arms at sides', 'Jump out while raising arms overhead', 'Jump back to start position', 'Keep a steady rhythm', 'Land softly on balls of feet'],
        phases: [{ icon: '⬆', label: 'Open', note: 'Arms up, feet wide' }, { icon: '⬇', label: 'Close', note: 'Arms down, feet together' }],
    },
    marching: {
        label: 'Marching in Place',
        animClass: 'anim-march',
        muscles: 'Hip Flexors, Calves, Core',
        effort: '🌱 Low-impact cardio',
        tips: ['Lift knees to hip height', 'Swing opposite arm naturally', 'Stay on the balls of feet', 'Keep steady pace', 'Maintain upright posture'],
        phases: [{ icon: '⬅', label: 'Left', note: 'Left knee rises' }, { icon: '➡', label: 'Right', note: 'Right knee rises' }],
    },
    high_knees: {
        label: 'High Knees',
        animClass: 'anim-high-knees',
        muscles: 'Hip Flexors, Core, Calves, Quads',
        effort: '⚡ High-intensity cardio',
        tips: ['Drive knees above hip line', 'Pump arms in sync with legs', 'Stay on the balls of your feet', 'Fast, rhythmic pace', 'Keep core tight throughout'],
        phases: [{ icon: '⬆', label: 'Drive', note: 'Knee above hip' }, { icon: '⬇', label: 'Land', note: 'Ball of foot contact' }],
    },
    jump_rope: {
        label: 'Jump Rope (Simulated)',
        animClass: 'anim-jump-rope',
        muscles: 'Calves, Shoulders, Core, Cardio',
        effort: '⚡ Full body cardio',
        tips: ['Small, light jumps — 1–2 inches off floor', 'Rotate wrists (not whole arms)', 'Land on balls of feet', 'Keep elbows close to sides', 'Rhythm is key — find your pace'],
        phases: [{ icon: '⬆', label: 'Jump', note: 'Light hop' }, { icon: '↻', label: 'Spin', note: 'Wrist rotation' }],
    },
    sprint_in_place: {
        label: 'Sprint-in-Place',
        animClass: 'anim-sprint',
        muscles: 'Calves, Quads, Glutes, Core, Cardio',
        effort: '🏅 Max effort cardio',
        tips: ['Fast-pumping leg action', 'Drive arms hard for speed', 'High knee lift — think sprint mechanics', 'Stay on balls of feet', 'All-out effort for the full interval'],
        phases: [{ icon: '⚡', label: 'Drive', note: 'Maximum effort' }, { icon: '🔁', label: 'Cycle', note: 'Rapid leg turnover' }],
    },
    skater_jumps: {
        label: 'Skater Jumps',
        animClass: 'anim-skater',
        muscles: 'Glutes, Abductors, Calves, Core',
        effort: '⛷ Lateral power',
        tips: ['Leap sideways from one foot to the other', 'Swing trailing leg behind landing leg', 'Bend the knee on landing', 'Reach opposite hand to foot', 'Keep chest up, look forward'],
        phases: [{ icon: '⬅', label: 'Left', note: 'Land on left foot' }, { icon: '➡', label: 'Right', note: 'Land on right foot' }],
    },
    burpees: {
        label: 'Burpees',
        animClass: 'anim-burpee',
        muscles: 'Full Body — Chest, Legs, Core, Shoulders',
        effort: '🔥 Full body explosive',
        tips: ['Stand → squat → plank → push-up → squat → jump', 'Keep core tight in plank phase', 'Explosive jump with arms overhead', 'Land softly with bent knees', 'Maintain steady breathing rhythm'],
        phases: [{ icon: '⬆', label: 'Jump', note: 'Explosive leap' }, { icon: '⬇', label: 'Plank', note: 'Lower to push-up' }],
    },
};

// Fallback for any exercise not in the map
const DEFAULT_DEMO = {
    label: 'Exercise',
    animClass: 'anim-generic',
    muscles: 'Full Body',
    effort: '💪 Varies',
    tips: ['Warm up before starting', 'Keep good posture', 'Control each movement', 'Breathe steadily', 'Stop if you feel pain'],
    phases: [{ icon: '⬆', label: 'Up', note: 'Control up' }, { icon: '⬇', label: 'Down', note: 'Control down' }],
};

// ── Main ExerciseDemo Component ─────────────────────────────────
export default function ExerciseDemo({ exercise, onStartWorkout, onChangeExercise }) {
    const demo = DEMO_DATA[exercise?.id] || { ...DEFAULT_DEMO, label: exercise?.label || 'Exercise' };

    return (
        <div className="demo-shell">
            {/* ── TOP BAR ───────────────────────────────────── */}
            <div className="demo-topbar">
                <button className="demo-back" onClick={onChangeExercise}>← Change Exercise</button>
                <div className="demo-title-area">
                    <span className="demo-ex-icon">{exercise?.icon}</span>
                    <h2>{demo.label}</h2>
                </div>
                <div className="demo-phase-badges">
                    {demo.phases.map(p => (
                        <span key={p.label} className="phase-badge">{p.icon} <strong>{p.label}</strong> — {p.note}</span>
                    ))}
                </div>
            </div>

            {/* ── MAIN CONTENT ──────────────────────────────── */}
            <div className="demo-body">
                {/* LEFT — Animation panel */}
                <div className="demo-animation-panel">
                    <div className="demo-yt-stage">
                        {exercise?.ytId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${exercise.ytId}?autoplay=1&mute=1&loop=1&playlist=${exercise.ytId}&controls=0&modestbranding=1`}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                title={demo.label}
                                className="yt-iframe"
                            />
                        ) : (
                            <div className="demo-no-video">Demo video unavailable</div>
                        )}
                    </div>

                    {/* Muscles & Effort */}
                    <div className="demo-effort-row">
                        <div className="demo-effort-card">
                            <span className="eff-label">PRIMARY MUSCLES</span>
                            <span className="eff-value">{demo.muscles}</span>
                        </div>
                        <div className="demo-effort-card">
                            <span className="eff-label">EFFORT ZONE</span>
                            <span className="eff-value">{demo.effort}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Tips panel */}
                <div className="demo-tips-panel">
                    <h3>📋 Form Checklist</h3>
                    <ul className="demo-tips-list">
                        {demo.tips.map((tip, i) => (
                            <li key={i} className="demo-tip-item">
                                <span className="tip-num">{i + 1}</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="demo-sets-card">
                        <span className="sets-label">Recommended Volume</span>
                        {exercise?.targetSets ? (
                            <span className="sets-value">{exercise.targetSets} Sets × {exercise.targetReps} {exercise.isTime ? 'sec' : 'reps'}</span>
                        ) : (
                            <span className="sets-value">{exercise?.sets || '3 sets'}</span>
                        )}
                        <span className="track-mode">{exercise?.trackLabel}</span>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM CONTROLS ───────────────────────────── */}
            <div className="demo-footer">
                <button className="btn-demo-change" onClick={onChangeExercise}>Change Exercise</button>
                <button className="btn-demo-start" onClick={onStartWorkout}>
                    🎥 Start Workout — {demo.label}
                </button>
            </div>

            {/* ── STYLES ────────────────────────────────────── */}
            <style>{`
                /* ── Layout ───────────────────────────────── */
                .demo-shell { min-height:100vh; display:flex; flex-direction:column; color:white; font-family:'Inter',sans-serif; }
                .demo-topbar { display:flex; align-items:center; gap:20px; padding:20px 32px; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; }
                .demo-back { padding:8px 16px; background:transparent; border:1px solid rgba(255,255,255,0.14); color:#aaa; border-radius:8px; cursor:pointer; font-size:13px; }
                .demo-back:hover { color:white; border-color:rgba(255,255,255,0.3); }
                .demo-title-area { display:flex; align-items:center; gap:10px; flex:1; }
                .demo-ex-icon { font-size:24px; }
                .demo-title-area h2 { font-size:20px; font-weight:800; }
                .demo-phase-badges { display:flex; gap:10px; flex-wrap:wrap; }
                .phase-badge { font-size:11px; padding:4px 10px; border-radius:20px; background:rgba(0,245,255,0.08); border:1px solid rgba(0,245,255,0.15); color:#00f5ff; }

                .demo-body { display:grid; grid-template-columns:1fr 380px; gap:32px; padding:32px; flex:1; }
                @media(max-width:900px){ .demo-body { grid-template-columns:1fr; } }

                /* ── Video Stage ──────────────────────── */
                .demo-animation-panel { display:flex; flex-direction:column; gap:20px; }
                .demo-yt-stage { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:20px; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; overflow:hidden; }
                .yt-iframe { width:100%; height:100%; border:none; border-radius:20px; }
                .demo-no-video { color:rgba(255,255,255,0.4); font-size:14px; }

                /* Effort / muscle row */
                .demo-effort-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
                .demo-effort-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:4px; }
                .eff-label { font-size:9px; color:#666; text-transform:uppercase; letter-spacing:1px; font-weight:700; }
                .eff-value { font-size:13px; color:#e2e8f0; font-weight:600; }

                /* ── Tips Panel ───────────────────────────── */
                .demo-tips-panel { display:flex; flex-direction:column; gap:20px; }
                .demo-tips-panel h3 { font-size:14px; color:#888; text-transform:uppercase; letter-spacing:1px; margin:0; }
                .demo-tips-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
                .demo-tip-item { display:flex; align-items:flex-start; gap:12px; padding:12px 16px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid rgba(255,255,255,0.04); font-size:14px; color:#e2e8f0; line-height:1.4; }
                .tip-num { width:22px; height:22px; min-width:22px; border-radius:50%; background:linear-gradient(135deg,#00f5ff,#7c3aed); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; color:white; }
                .demo-sets-card { background:rgba(0,245,212,0.06); border:1px solid rgba(0,245,212,0.15); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:4px; margin-top:auto; }
                .sets-label { font-size:10px; color:#555; text-transform:uppercase; letter-spacing:0.5px; }
                .sets-value { font-size:18px; font-weight:800; color:#00f5d4; }
                .track-mode { font-size:11px; color:#888; }

                /* ── Footer ───────────────────────────────── */
                .demo-footer { display:flex; justify-content:center; gap:16px; padding:24px 32px; background:rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.06); }
                .btn-demo-change { padding:13px 28px; background:transparent; border:1px solid rgba(255,255,255,0.12); color:#888; border-radius:12px; cursor:pointer; font-size:14px; font-weight:600; }
                .btn-demo-change:hover { color:white; border-color:rgba(255,255,255,0.25); }
                .btn-demo-start { padding:13px 40px; background:linear-gradient(135deg,#00f5d4,#7c3aed); color:white; border:none; border-radius:12px; cursor:pointer; font-size:15px; font-weight:800; letter-spacing:0.5px; box-shadow:0 0 30px rgba(0,245,212,0.2); transition:all 0.2s; }
                .btn-demo-start:hover { transform:translateY(-2px); box-shadow:0 0 40px rgba(0,245,212,0.35); }
            `}</style>
        </div>
    );
}
