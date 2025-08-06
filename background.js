class FitnessBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupStorageListener();
        this.setupInstallListener();
        this.updateBadge();
    }

    setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.workouts) {
                this.updateBadge();
            }
        });
    }

    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onUpdate();
            }
        });
    }

    async onFirstInstall() {
        try {
            await chrome.storage.sync.set({
                workouts: [],
                settings: {
                    autoDetectWorkouts: true,
                    showCompletionBadges: true,
                    syncAcrossDevices: true
                }
            });
            
            chrome.tabs.create({
                url: 'https://www.youtube.com/results?search_query=fitness+workout'
            });
        } catch (error) {
            console.error('Error during first install:', error);
        }
    }

    async onUpdate() {
        try {
            const result = await chrome.storage.sync.get(['workouts', 'settings']);
            
            if (!result.settings) {
                await chrome.storage.sync.set({
                    settings: {
                        autoDetectWorkouts: true,
                        showCompletionBadges: true,
                        syncAcrossDevices: true
                    }
                });
            }
            
            this.migrateOldData(result.workouts);
        } catch (error) {
            console.error('Error during update:', error);
        }
    }

    migrateOldData(workouts) {
        if (!workouts || !Array.isArray(workouts)) return;
        
        const migratedWorkouts = workouts.map(workout => {
            if (!workout.bodyParts) {
                workout.bodyParts = this.detectBodyParts(workout.title || '');
            }
            if (!workout.equipment) {
                workout.equipment = this.detectEquipment(workout.title || '');
            }
            return workout;
        });
        
        chrome.storage.sync.set({ workouts: migratedWorkouts });
    }

    async updateBadge() {
        try {
            const result = await chrome.storage.sync.get(['workouts']);
            const workouts = result.workouts || [];
            
            const today = new Date().toDateString();
            const todayWorkouts = workouts.filter(workout => 
                new Date(workout.completedAt).toDateString() === today
            );
            
            const badgeText = todayWorkouts.length > 0 ? todayWorkouts.length.toString() : '';
            const badgeColor = todayWorkouts.length > 0 ? '#4CAF50' : '#9E9E9E';
            
            chrome.action.setBadgeText({ text: badgeText });
            chrome.action.setBadgeBackgroundColor({ color: badgeColor });
            
            const totalWorkouts = workouts.length;
            const title = totalWorkouts > 0 
                ? `Fitness Tracker - ${totalWorkouts} total workouts, ${todayWorkouts.length} today`
                : 'Fitness Tracker - Start tracking your workouts!';
            
            chrome.action.setTitle({ title });
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    detectBodyParts(title) {
        const bodyParts = [];
        const text = title.toLowerCase();
        
        if (/abs|core|abdominal/i.test(text)) bodyParts.push('abs');
        if (/arm|chest|back|shoulder|upper/i.test(text)) bodyParts.push('upper-body');
        if (/leg|glute|butt|thigh|lower/i.test(text)) bodyParts.push('lower-body');
        if (/full.body|total.body|whole.body/i.test(text)) bodyParts.push('full-body');
        
        return bodyParts;
    }

    detectEquipment(title) {
        const equipment = [];
        const text = title.toLowerCase();
        
        if (/no.equipment|bodyweight|body.weight/i.test(text)) equipment.push('bodyweight');
        if (/dumbbell|weight/i.test(text)) equipment.push('dumbbells');
        if (/resistance.band|band/i.test(text)) equipment.push('resistance-bands');
        if (/kettlebell/i.test(text)) equipment.push('kettlebell');
        if (/gym|barbell|machine/i.test(text)) equipment.push('gym-equipment');
        
        return equipment;
    }
}

new FitnessBackground();