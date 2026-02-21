/**
 * workoutPlan.js — Adaptive rule-based workout plan system
 *
 * Plans are keyed by fitnessLevel × goal.
 * Each exercise has:
 *   id       — unique key
 *   label    — display name
 *   icon     — emoji
 *   sets     — recommended volume string
 *   trackAs  — maps to pose-tracking engine ('squat' | 'pushup' | 'lunge' | null)
 *   trackLabel — short description of what is tracked
 */

export const EXERCISE_LIBRARY = {
    // ── Beginner ─────────────────────────────────────────────────
    jumping_jacks: { id: 'jumping_jacks', label: 'Jumping Jacks', icon: '⭐', sets: '3 × 20 reps', trackAs: null, trackLabel: 'Free-form cardio' },
    bw_squats: { id: 'bw_squats', label: 'Bodyweight Squats', icon: '🦵', sets: '3 × 15 reps', trackAs: 'squat', trackLabel: 'Knee angle tracked' },
    knee_pushups: { id: 'knee_pushups', label: 'Knee Push-ups', icon: '💪', sets: '3 × 10 reps', trackAs: 'pushup', trackLabel: 'Elbow angle tracked' },
    marching: { id: 'marching', label: 'Marching in Place', icon: '🏃', sets: '3 × 1 min', trackAs: null, trackLabel: 'Free-form cardio' },
    step_ups: { id: 'step_ups', label: 'Step-ups', icon: '🪜', sets: '3 × 10 reps each side', trackAs: 'lunge', trackLabel: 'Knee angle tracked' },
    light_squats: { id: 'light_squats', label: 'Light Squats', icon: '🦵', sets: '3 × 12 reps', trackAs: 'squat', trackLabel: 'Knee angle tracked' },
    wall_pushups: { id: 'wall_pushups', label: 'Wall Push-ups', icon: '🤲', sets: '3 × 12 reps', trackAs: 'pushup', trackLabel: 'Elbow angle tracked' },

    // ── Intermediate ─────────────────────────────────────────────
    mountain_climbers: { id: 'mountain_climbers', label: 'Mountain Climbers', icon: '🧗', sets: '3 × 30 sec', trackAs: 'pushup', trackLabel: 'Body alignment tracked' },
    burpees: { id: 'burpees', label: 'Burpees', icon: '🔥', sets: '3 × 10 reps', trackAs: 'squat', trackLabel: 'Squat phase tracked' },
    pushups: { id: 'pushups', label: 'Push-ups', icon: '💪', sets: '3 × 12 reps', trackAs: 'pushup', trackLabel: 'Elbow angle tracked' },
    forward_lunges: { id: 'forward_lunges', label: 'Forward Lunges', icon: '🏃', sets: '3 × 10 reps each side', trackAs: 'lunge', trackLabel: 'Knee angle tracked' },
    high_knees: { id: 'high_knees', label: 'High Knees', icon: '⚡', sets: '3 × 45 sec', trackAs: null, trackLabel: 'Free-form cardio' },
    jump_rope: { id: 'jump_rope', label: 'Jump Rope (simulated)', icon: '🪢', sets: '3 × 1 min', trackAs: null, trackLabel: 'Free-form cardio' },
    squats: { id: 'squats', label: 'Squats', icon: '🦵', sets: '3 × 15 reps', trackAs: 'squat', trackLabel: 'Knee angle tracked' },
    std_pushups: { id: 'std_pushups', label: 'Standard Push-ups', icon: '💪', sets: '3 × 15 reps', trackAs: 'pushup', trackLabel: 'Elbow angle tracked' },

    // ── Advanced ─────────────────────────────────────────────────
    jump_squats: { id: 'jump_squats', label: 'Jump Squats', icon: '🚀', sets: '4 × 15 reps', trackAs: 'squat', trackLabel: 'Knee angle tracked' },
    pistol_squats: { id: 'pistol_squats', label: 'Pistol Squats', icon: '🎯', sets: '3 × 8 reps each side', trackAs: 'squat', trackLabel: 'Knee angle tracked' },
    decline_pushups: { id: 'decline_pushups', label: 'Decline Push-ups', icon: '💥', sets: '4 × 12 reps', trackAs: 'pushup', trackLabel: 'Elbow angle tracked' },
    sprint_in_place: { id: 'sprint_in_place', label: 'Sprint-in-Place', icon: '🏅', sets: '4 × 30 sec', trackAs: null, trackLabel: 'Free-form cardio' },
    skater_jumps: { id: 'skater_jumps', label: 'Skater Jumps', icon: '⛷', sets: '3 × 20 reps', trackAs: null, trackLabel: 'Free-form cardio' },
    dynamic_lunges: { id: 'dynamic_lunges', label: 'Dynamic Lunges', icon: '🦵', sets: '3 × 12 reps each side', trackAs: 'lunge', trackLabel: 'Knee angle tracked' },
    adv_pushups: { id: 'adv_pushups', label: 'Push-ups', icon: '💪', sets: '4 × 15 reps', trackAs: 'pushup', trackLabel: 'Elbow angle tracked' },
};

/**
 * PLAN_MATRIX[fitnessLevel][goal] = [exerciseId1, exerciseId2]
 *
 * Goal keys match the backend enum:
 *   weight_loss | muscle_gain | endurance | general_fitness | maintenance | flexibility
 */
const PLAN_MATRIX = {
    beginner: {
        weight_loss: ['jumping_jacks', 'bw_squats'],
        muscle_gain: ['bw_squats', 'knee_pushups'],
        endurance: ['marching', 'step_ups'],
        general_fitness: ['light_squats', 'wall_pushups'],
        maintenance: ['light_squats', 'wall_pushups'],
        flexibility: ['light_squats', 'wall_pushups'],
    },
    intermediate: {
        weight_loss: ['mountain_climbers', 'burpees'],
        muscle_gain: ['pushups', 'forward_lunges'],
        endurance: ['high_knees', 'jump_rope'],
        general_fitness: ['squats', 'std_pushups'],
        maintenance: ['squats', 'std_pushups'],
        flexibility: ['forward_lunges', 'std_pushups'],
    },
    advanced: {
        weight_loss: ['jump_squats', 'burpees'],
        muscle_gain: ['pistol_squats', 'decline_pushups'],
        endurance: ['sprint_in_place', 'skater_jumps'],
        general_fitness: ['dynamic_lunges', 'adv_pushups'],
        maintenance: ['dynamic_lunges', 'adv_pushups'],
        flexibility: ['dynamic_lunges', 'adv_pushups'],
    },
};

/** Default fallback if profile is incomplete */
const DEFAULT_PLAN = ['bw_squats', 'wall_pushups'];

/**
 * getPlan(user) → array of 2 exercise objects from EXERCISE_LIBRARY
 *
 * @param {{ fitnessLevel?: string, goal?: string }} user
 * @returns {{ exercises: object[], isDefault: boolean, missingFields: string[] }}
 */
export function getPlan(user = {}) {
    const missing = [];
    const level = user.fitnessLevel || '';
    const goal = user.goal || '';

    if (!level) missing.push('Fitness Level');
    if (!goal) missing.push('Primary Goal');

    const levelPlan = PLAN_MATRIX[level];
    const ids = levelPlan?.[goal] || DEFAULT_PLAN;

    return {
        exercises: ids.map(id => EXERCISE_LIBRARY[id]).filter(Boolean),
        isDefault: ids === DEFAULT_PLAN,
        missingFields: missing,
    };
}
