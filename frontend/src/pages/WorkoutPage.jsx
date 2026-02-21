import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePose } from '../hooks/usePose';
import { useRepCounter } from '../hooks/useRepCounter';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { getPlan, EXERCISE_LIBRARY } from '../utils/workoutPlan';
import ExerciseDemo from '../components/ExerciseDemo';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const GOAL_LABELS = {
    weight_loss: 'Fat Loss', muscle_gain: 'Muscle Gain',
    endurance: 'Endurance', general_fitness: 'General Fitness',
    maintenance: 'Maintenance', flexibility: 'Flexibility',
};
const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export default function WorkoutPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const lastDescRef = useRef(null);

    // Load user profile
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { exercises: planExercises, isDefault, missingFields } = getPlan(user);

    const [selectedExId, setSelectedExId] = useState(null); // exercise library id
    const [showDemo, setShowDemo] = useState(false); // demo screen visible?
    const [isActive, setIsActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [sessionDone, setSessionDone] = useState(false);
    const [sessionResult, setSessionResult] = useState(null);

    // Set logic state
    const [currentSet, setCurrentSet] = useState(1);
    const [restSeconds, setRestSeconds] = useState(0);
    const [totalSessionReps, setTotalSessionReps] = useState(0);
    const [shouldEndSession, setShouldEndSession] = useState(false);

    // Person lock
    const [personLocked, setPersonLocked] = useState(false);
    const [lockTarget, setLockTarget] = useState(null);
    const [isPersonLost, setIsPersonLost] = useState(false);

    // Selected exercise object from library
    const selectedEx = selectedExId ? EXERCISE_LIBRARY[selectedExId] : null;
    // For pose counter: map trackAs → counter key  ('squat' | 'pushup' | 'lunge')
    const trackAsType = selectedEx?.trackAs || 'squat';

    const { reps, accuracy, feedback, phase, processLandmarks, reset } = useRepCounter(trackAsType);
    const { speak } = useVoiceAssistant();

    const tReps = selectedEx?.targetReps || 10;
    const tSets = selectedEx?.targetSets || 3;

    // ── Reps target logic & Voice ──────────────────────────────────────
    useEffect(() => {
        if (!isActive || restSeconds > 0 || reps === 0) return;

        if (reps < tReps) {
            // Normal rep announcement
            speak(reps.toString(), true);
        } else if (reps >= tReps) {
            // Set complete!
            const isLast = currentSet >= tSets;
            setTotalSessionReps(prev => prev + tReps);
            reset(); // Immediately reset for next phase

            if (isLast) {
                speak("Workout completed. Great job!", true);
                setShouldEndSession(true);
            } else {
                const rSec = selectedEx?.restSeconds || 30;
                speak(`Set ${currentSet} completed. Rest for ${rSec} seconds.`, true);
                setRestSeconds(rSec);
            }
        }
    }, [reps, isActive, restSeconds, currentSet, selectedEx, speak, tReps, tSets, reset]);

    // ── Rest Timer Countdown ─────────────────────────────────────────
    useEffect(() => {
        let iv;
        if (isActive && restSeconds > 0) {
            iv = setInterval(() => {
                setRestSeconds(prev => {
                    if (prev === 1) {
                        setCurrentSet(c => c + 1);
                        speak(`Start Set ${currentSet + 1}.`, true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(iv);
    }, [isActive, restSeconds, currentSet, speak]);

    useEffect(() => {
        if (shouldEndSession) {
            setShouldEndSession(false);
            handleEndSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldEndSession]);

    useEffect(() => {
        if (feedback?.includes('⚠') && restSeconds === 0) speak(feedback.replace('⚠', ''), false);
    }, [feedback, restSeconds, speak]);

    useEffect(() => {
        let iv;
        if (isActive && sessionStartTime)
            iv = setInterval(() => setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000)), 1000);
        return () => clearInterval(iv);
    }, [isActive, sessionStartTime]);

    // Pose result handler
    const handlePoseResults = useCallback(
        (results, isLost) => {
            setIsPersonLost(!!isLost);
            if (restSeconds > 0) return; // Do not process poses during rest sequence
            if (results?.poseLandmarks && !isLost) processLandmarks(results.poseLandmarks);
        },
        [processLandmarks, restSeconds]
    );
    const handleLockData = useCallback((desc) => { lastDescRef.current = desc; }, []);

    usePose(videoRef, canvasRef, handlePoseResults, isActive, personLocked, handleLockData, lockTarget);

    // Camera controls
    const startCamera = async () => {
        if (!selectedExId) return alert('⚠️ Please select a workout before starting!');
        setCameraError('');
        setCurrentSet(1);
        setRestSeconds(0);
        setTotalSessionReps(0);
        reset();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }, audio: false,
            });
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            setIsActive(true);
            setSessionStartTime(Date.now());
            speak(`Starting ${selectedEx?.label || 'workout'} session. Good luck!`, true);
        } catch (err) {
            setCameraError(err.name === 'NotAllowedError'
                ? '🚫 Camera permission denied. Allow camera access in browser settings.'
                : `❌ Camera error: ${err.message}`);
        }
    };

    const stopCamera = () => {
        setIsActive(false);
        setPersonLocked(false);
        setLockTarget(null);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleLockPerson = () => {
        if (lastDescRef.current) {
            setLockTarget(lastDescRef.current);
            setPersonLocked(true);
            speak('Person locked. Tracking you only.', true);
        }
    };
    const handleUnlockPerson = () => {
        setPersonLocked(false);
        setLockTarget(null);
        setIsPersonLost(false);
        speak('Tracking unlocked.', true);
    };

    const generateSummary = (acc, r) => {
        const label = selectedEx?.label || 'Exercise';
        if (acc >= 90) return `Excellent ${label} form! ${r} perfect reps.`;
        if (acc >= 75) return `Good work! ${r} ${label}s with solid form.`;
        return `${r} ${label}s completed. Keep practicing your form!`;
    };

    const handleEndSession = async () => {
        stopCamera();
        setSubmitting(true);
        speak('Session complete. Great work today!', true);
        const exerciseType = trackAsType;
        const finalReps = totalSessionReps + reps;
        try {
            const payload = { exerciseType, repsCompleted: finalReps, accuracyScore: accuracy, duration: elapsedTime, feedbackSummary: generateSummary(accuracy, finalReps) };
            const { data } = await api.post('/session/complete', payload);
            setSessionResult({ ...payload, improvement: data.data.improvementPercentage, streak: data.data.currentStreak });
            setSessionDone(true);
        } catch {
            setSessionDone(true);
            setSessionResult({ exerciseType, repsCompleted: finalReps, accuracyScore: accuracy, duration: elapsedTime, improvement: 0, streak: 0 });
        } finally { setSubmitting(false); }
    };

    const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const getPhaseColor = () => phase === 'DOWN' ? '#ff4d6d' : phase === 'UP' ? '#00f5ff' : '#94a3b8';

    // ── Demo Screen ──────────────────────────────────────────────
    if (showDemo && selectedEx) {
        return (
            <div className="page-shell">
                <Navbar />
                <ExerciseDemo
                    exercise={selectedEx}
                    onStartWorkout={() => { setShowDemo(false); startCamera(); }}
                    onChangeExercise={() => { setShowDemo(false); setSelectedExId(null); }}
                />
            </div>
        );
    }

    // ── Session Complete ─────────────────────────────────────────
    if (sessionDone && sessionResult) {
        return (
            <div className="page-shell">
                <Navbar />
                <main className="session-result">
                    <div className="result-card">
                        <div className="result-icon">🎉</div>
                        <h1>{selectedEx?.label || 'Workout'} Complete!</h1>
                        <p className="result-summary">{generateSummary(sessionResult.accuracyScore, sessionResult.repsCompleted)}</p>
                        <div className="result-stats">
                            <div className="result-stat"><span className="rs-value">{sessionResult.repsCompleted}</span><span className="rs-label">Reps</span></div>
                            <div className="result-stat"><span className="rs-value">{sessionResult.accuracyScore}%</span><span className="rs-label">Accuracy</span></div>
                            <div className="result-stat"><span className="rs-value">{formatTime(sessionResult.duration)}</span><span className="rs-label">Duration</span></div>
                            <div className="result-stat">
                                <span className="rs-value" style={{ color: sessionResult.improvement >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {sessionResult.improvement >= 0 ? '+' : ''}{sessionResult.improvement}%
                                </span>
                                <span className="rs-label">Improvement</span>
                            </div>
                            <div className="result-stat"><span className="rs-value">🔥 {sessionResult.streak}</span><span className="rs-label">Day Streak</span></div>
                        </div>
                        <div className="result-actions">
                            <button className="btn btn-primary" onClick={() => { reset(); setSessionDone(false); setElapsedTime(0); setSelectedExId(null); }}>
                                🔄 New Session
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ── Main UI ──────────────────────────────────────────────────
    return (
        <div className="page-shell">
            <Navbar />
            <main className="workout-page">

                {/* ─── TODAY'S PLAN BANNER ────────────────────── */}
                <div className="plan-banner">
                    <span className="plan-title">📋 Today's Plan:</span>
                    {planExercises.map(ex => (
                        <button
                            key={ex.id}
                            className={`plan-pill ${selectedExId === ex.id ? 'plan-active' : ''} ${isActive ? 'plan-disabled' : ''}`}
                            onClick={() => { if (!isActive) { setSelectedExId(ex.id); setShowDemo(true); } }}
                            title={`${ex.trackLabel} — click to preview`}
                        >
                            {ex.icon} {ex.label}
                            {selectedExId === ex.id && <span className="plan-sel-dot">●</span>}
                        </button>
                    ))}
                    {!isDefault && (
                        <span className="plan-meta-badge">
                            {LEVEL_LABELS[user.fitnessLevel]} · {GOAL_LABELS[user.goal]}
                        </span>
                    )}
                    {isDefault && missingFields.length > 0 && (
                        <button className="plan-profile-prompt" onClick={() => navigate('/profile')}>
                            ⚠️ Complete profile for personalised plan
                        </button>
                    )}
                </div>

                {/* ─── HEADER ─────────────────────────────────── */}
                <div className="workout-header">
                    <div className="header-left">
                        <h1>🏋️ {selectedEx ? `Tracking: ${selectedEx.label}` : 'Select a Workout'}</h1>
                        {isActive && <span className="live-badge">● LIVE</span>}
                        {isActive && personLocked && (
                            <span className={`lock-badge ${isPersonLost ? 'lock-lost' : 'lock-ok'}`}>
                                {isPersonLost ? '🟡 Person Lost' : '🔒 Person Locked'}
                            </span>
                        )}
                    </div>

                    {/* Exercise selector — shows today's plan + all exercises */}
                    {!isActive && (
                        <div className="exercise-selector" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            {/* Plan exercises get priority / highlighted */}
                            {planExercises.map(ex => (
                                <button key={ex.id}
                                    className={`selector-btn ${selectedExId === ex.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedExId(ex.id); setShowDemo(true); }}
                                    title={`${ex.trackLabel} — click to preview form`}
                                    style={{ position: 'relative' }}
                                >
                                    {ex.icon} {ex.label}
                                    <span className="plan-dot" title="In today's plan" />
                                </button>
                            ))}
                            {/* Divider if there are other exercises not in plan */}
                            {(() => {
                                // Offer other common trackable exercises for manual override
                                const tracked = ['bw_squats', 'pushups', 'forward_lunges', 'squats', 'std_pushups', 'dynamic_lunges'];
                                const planIds = new Set(planExercises.map(e => e.id));
                                const others = tracked.filter(id => !planIds.has(id));
                                if (others.length === 0) return null;
                                return (
                                    <>
                                        <span style={{ fontSize: '11px', color: '#555', padding: '0 4px' }}>or</span>
                                        {others.map(id => {
                                            const ex = EXERCISE_LIBRARY[id];
                                            if (!ex) return null;
                                            return (
                                                <button key={id}
                                                    className={`selector-btn ${selectedExId === id ? 'active' : ''}`}
                                                    onClick={() => { setSelectedExId(id); setShowDemo(true); }}
                                                    title={`${ex.trackLabel} — click to preview form`}
                                                    style={{ opacity: 0.7 }}
                                                >
                                                    {ex.icon} {ex.label}
                                                </button>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="workout-layout">
                    {/* ─── CAMERA ─────────────────────────────── */}
                    <div className="camera-container">
                        {!isActive && !cameraError && (
                            <div className="camera-placeholder">
                                <div className="camera-icon">📷</div>
                                <p>{selectedEx
                                    ? `Ready to track your ${selectedEx.label}?`
                                    : 'Select a workout from today\'s plan above'}</p>
                                <p className="camera-hint">Ensure your full body is visible in the frame</p>
                            </div>
                        )}
                        {cameraError && <div className="camera-error"><p>{cameraError}</p></div>}
                        <video ref={videoRef} className="workout-video" playsInline muted
                            style={{ display: isActive ? 'block' : 'none', transform: 'scaleX(-1)' }} />
                        <canvas ref={canvasRef} className="pose-canvas"
                            style={{ display: isActive ? 'block' : 'none', transform: 'scaleX(-1)' }} />

                        <div className="camera-controls">
                            {!isActive ? (
                                <button className="btn btn-primary btn-lg" onClick={startCamera}>🎥 Start Workout</button>
                            ) : (
                                <div className="active-controls">
                                    {!personLocked
                                        ? <button className="btn btn-lock" onClick={handleLockPerson}>🔒 Lock Person</button>
                                        : <button className="btn btn-unlock" onClick={handleUnlockPerson}>🔓 Unlock</button>}
                                    <button className="btn btn-danger btn-lg" onClick={handleEndSession} disabled={submitting}>
                                        {submitting ? <span className="spinner" /> : '⏹ End Session'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── FEEDBACK PANEL ─────────────────────── */}
                    <div className="feedback-panel">
                        <div className="panel-card timer-card">
                            <div className="timer-display">{formatTime(elapsedTime)}</div>
                            <div className="timer-label">Session Time</div>
                        </div>

                        {isActive && (
                            <div className="panel-card phase-card" style={{ borderColor: getPhaseColor() }}>
                                <div className="phase-indicator" style={{ color: getPhaseColor() }}>
                                    {phase === 'DOWN' ? '⬇ DOWN' : phase === 'UP' ? '⬆ UP' : '⏸ READY'}
                                </div>
                            </div>
                        )}

                        {restSeconds > 0 ? (
                            <div className="panel-card timer-card" style={{ borderColor: '#f59e0b' }}>
                                <div className="big-number" style={{ color: '#f59e0b' }}>{restSeconds}s</div>
                                <div className="panel-label">REST TIMER</div>
                            </div>
                        ) : (
                            <div className="panel-card reps-card">
                                <div className="big-number">{reps} <span style={{ fontSize: '18px', color: '#888' }}>/ {tReps}</span></div>
                                <div className="panel-label">REPS (SET {currentSet} OF {tSets})</div>
                            </div>
                        )}

                        <div className="panel-card accuracy-card">
                            <div className="big-number" style={{ color: accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#f59e0b' : '#ef4444' }}>
                                {accuracy}%
                            </div>
                            <div className="panel-label">ACCURACY</div>
                            <div className="accuracy-bar">
                                <div className="accuracy-fill" style={{
                                    width: `${accuracy}%`,
                                    background: accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#f59e0b' : '#ef4444',
                                }} />
                            </div>
                        </div>

                        <div className="panel-card feedback-card">
                            <div className="feedback-message">{feedback}</div>
                            <div className="panel-label">ASSISTANT FEEDBACK</div>
                        </div>

                        {/* Info panel when stopped */}
                        {!isActive && selectedEx && (
                            <div className="panel-card instructions-card">
                                <h4>{selectedEx.icon} {selectedEx.label}</h4>
                                <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>{selectedEx.sets}</p>
                                <span className={`track-badge ${selectedEx.trackAs ? '' : 'freeform'}`}>
                                    {selectedEx.trackLabel}
                                </span>
                                {selectedEx.trackAs === null && (
                                    <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px' }}>
                                        ⚠️ This exercise does not have AI angle tracking. Reps will not be counted automatically.
                                    </p>
                                )}
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                                    {selectedEx.id === 'jumping_jacks' && 'Stand with feet together, jump out while raising arms, jump back. Keep rhythm.'}
                                    {selectedEx.id === 'bw_squats' && 'Feet shoulder width apart, lower hips back and down, keep chest tall.'}
                                    {selectedEx.id === 'knee_pushups' && 'Kneel on floor, lower chest to ground, push back up. Keep core tight.'}
                                    {selectedEx.id === 'marching' && 'March on the spot lifting knees high. Keep a steady pace.'}
                                    {selectedEx.id === 'step_ups' && 'Step up onto a stable surface, alternate legs. Keep core braced.'}
                                    {selectedEx.id === 'light_squats' && 'As bodyweight squat but slower pace. Focus on form.'}
                                    {selectedEx.id === 'wall_pushups' && 'Place hands on wall at shoulder height, lean in and push back.'}
                                    {selectedEx.id === 'mountain_climbers' && 'In plank, drive knees to chest alternately. Keep hips level.'}
                                    {selectedEx.id === 'burpees' && 'Jump, squat, plank, push-up, back to squat, jump. Full body.'}
                                    {selectedEx.id === 'pushups' && 'Keep body straight, lower chest to floor, elbows at 45°.'}
                                    {selectedEx.id === 'forward_lunges' && 'Step forward, lower back knee near floor, push back.'}
                                    {selectedEx.id === 'high_knees' && 'Run on the spot lifting knees to hip height. Pump arms.'}
                                    {selectedEx.id === 'jump_rope' && 'Simulate rope with wrist rotations while jumping lightly.'}
                                    {selectedEx.id === 'squats' && 'Feet hip-width apart, lower until thighs parallel, drive up.'}
                                    {selectedEx.id === 'std_pushups' && 'Full push-up: body straight, chest to floor, elbows at 45°.'}
                                    {selectedEx.id === 'jump_squats' && 'Squat deeply then explode upward. Land softly, reset.'}
                                    {selectedEx.id === 'pistol_squats' && 'Single-leg squat, extend other leg forward. Full depth.'}
                                    {selectedEx.id === 'decline_pushups' && 'Feet elevated on chair. Lower chest, keep body straight.'}
                                    {selectedEx.id === 'sprint_in_place' && 'Rapid, high-intensity running on the spot. Max effort.'}
                                    {selectedEx.id === 'skater_jumps' && 'Lateral leaps from foot to foot, mimicking a speed skater.'}
                                    {selectedEx.id === 'dynamic_lunges' && 'Alternating forward/reverse lunges in one fluid motion.'}
                                    {selectedEx.id === 'adv_pushups' && 'Advanced standard push-up: strict form, controlled descent.'}
                                </p>
                                <p className="voice-hint">🔊 Voice assistant will guide you.</p>
                            </div>
                        )}
                        {!isActive && !selectedEx && (
                            <div className="panel-card instructions-card">
                                <h4>Voice Assistant Active 🔊</h4>
                                <p>Select a workout from today's plan, then press Start. The assistant will count reps and guide form.</p>
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    .plan-banner { display:flex; align-items:center; gap:10px; padding:14px 32px; background:rgba(0,245,255,0.04); border-bottom:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; }
                    .plan-title  { font-size:13px; color:#888; font-weight:700; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }
                    .plan-pill   { padding:6px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:#ccc; cursor:pointer; font-size:13px; display:flex; align-items:center; gap:6px; transition:all 0.2s; }
                    .plan-pill:hover:not(.plan-disabled) { border-color:rgba(0,245,255,0.4); color:#00f5ff; }
                    .plan-active { border-color:#00f5d4 !important; background:rgba(0,245,212,0.1) !important; color:#00f5d4 !important; font-weight:700; }
                    .plan-disabled { opacity:0.5; cursor:not-allowed; }
                    .plan-sel-dot { width:6px; height:6px; background:#00f5d4; border-radius:50%; }
                    .plan-meta-badge { margin-left:auto; font-size:11px; color:#a78bfa; background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.2); padding:3px 10px; border-radius:20px; white-space:nowrap; }
                    .plan-profile-prompt { margin-left:auto; font-size:11px; color:#f59e0b; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); padding:4px 10px; border-radius:20px; cursor:pointer; }
                    .plan-dot { display:inline-block; width:6px; height:6px; background:#00f5d4; border-radius:50%; margin-left:5px; vertical-align:middle; }
                    .lock-badge { font-size:12px; padding:3px 10px; border-radius:10px; margin-left:12px; font-weight:700; }
                    .lock-ok   { background:rgba(0,245,212,0.15); color:#00f5d4; border:1px solid #00f5d4; }
                    .lock-lost { background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid #f59e0b; animation:pulse 1s ease infinite; }
                    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
                    .active-controls { display:flex; gap:10px; align-items:center; }
                    .btn-lock   { padding:10px 18px; background:rgba(0,245,212,0.15); border:1px solid #00f5d4; color:#00f5d4; border-radius:10px; cursor:pointer; font-weight:700; font-size:13px; }
                    .btn-unlock { padding:10px 18px; background:rgba(239,68,68,0.1); border:1px solid #ef4444; color:#f87171; border-radius:10px; cursor:pointer; font-weight:700; font-size:13px; }
                    .track-badge { font-size:11px; padding:3px 8px; border-radius:6px; background:rgba(0,245,255,0.08); color:#00f5ff; font-weight:600; }
                    .track-badge.freeform { background:rgba(245,158,11,0.08); color:#f59e0b; }
                    .voice-hint { font-size:11px; color:#888; margin-top:10px; }
                `}</style>
            </main>
        </div>
    );
}
