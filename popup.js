class FitnessPopup {
    constructor() {
        this.workouts = [];
        this.stats = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadData() {
        try {
            const synced = await chrome.storage.sync.get(['workouts']);
            this.workouts = synced.workouts || [];
            const local = await chrome.storage.local.get(['stats']);
            this.stats = local.stats || {
                hiddenThisWeek: 0,
                hiddenAllTime: 0,
                estimatedTimeSavedMin: 0,
                weekStart: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
        const manage = document.getElementById('manage-rules');
        if (manage) {
            manage.addEventListener('click', (e) => {
                e.preventDefault();
                if (chrome.runtime.openOptionsPage) {
                    chrome.runtime.openOptionsPage();
                } else {
                    window.open(chrome.runtime.getURL('options.html'));
                }
            });
        }
    }

    updateUI() {
        this.updateStats();
        this.updateSavingsPanel();
        this.updateHeatMap();
        this.updateBodyPartsChart();
        this.updateRecentWorkouts();
    }

    updateSavingsPanel() {
        if (!this.stats) return;
        const hours = (this.stats.estimatedTimeSavedMin || 0) / 60;
        document.getElementById('hidden-week').textContent = this.stats.hiddenThisWeek || 0;
        const timeEl = document.getElementById('time-saved-week');
        // For weekly time, scale by weekly hide ratio so the headline ties
        // to the "this week" framing.
        const weeklyMin = (this.stats.hiddenThisWeek || 0) * 8;
        timeEl.textContent = weeklyMin >= 60
            ? `~${(weeklyMin / 60).toFixed(1)} hrs`
            : `~${weeklyMin} min`;
        document.getElementById('all-time-line').textContent =
            `All-time: ${this.stats.hiddenAllTime || 0} hidden · ~${hours.toFixed(1)} hrs saved`;
    }

    updateStats() {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeekWorkouts = this.workouts.filter(workout => 
            new Date(workout.completedAt) >= weekStart
        );

        const totalMinutes = thisWeekWorkouts.reduce((sum, workout) => 
            sum + (workout.durationWatched || 0), 0
        );

        const streak = this.calculateStreak();

        document.getElementById('weekly-workouts').textContent = thisWeekWorkouts.length;
        document.getElementById('weekly-minutes').textContent = Math.round(totalMinutes);
        document.getElementById('total-workouts').textContent = this.workouts.length;
        document.getElementById('streak-counter').textContent = `${streak} day streak`;
    }

    calculateStreak() {
        if (this.workouts.length === 0) return 0;

        const sortedWorkouts = [...this.workouts].sort((a, b) => 
            new Date(b.completedAt) - new Date(a.completedAt)
        );

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const dateStr = currentDate.toDateString();
            const hasWorkout = sortedWorkouts.some(workout => 
                new Date(workout.completedAt).toDateString() === dateStr
            );

            if (hasWorkout) {
                streak++;
            } else if (streak > 0) {
                break;
            }

            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    updateHeatMap() {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            const dayWorkouts = this.workouts.filter(workout => 
                new Date(workout.completedAt).toDateString() === date.toDateString()
            );

            const dayElement = document.getElementById(`day-${i}`);
            if (dayWorkouts.length > 0) {
                const intensity = Math.min(dayWorkouts.length, 3);
                dayElement.className = `heat-map-day w-8 h-8 rounded mb-1 cursor-pointer ${
                    intensity === 1 ? 'bg-green-200' :
                    intensity === 2 ? 'bg-green-400' : 
                    'bg-green-600'
                }`;
                dayElement.title = `${dayWorkouts.length} workout${dayWorkouts.length > 1 ? 's' : ''}`;
            } else {
                dayElement.className = 'heat-map-day w-8 h-8 bg-gray-200 rounded mb-1 cursor-pointer';
                dayElement.title = 'No workouts';
            }
        }
    }

    updateBodyPartsChart() {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeekWorkouts = this.workouts.filter(workout => 
            new Date(workout.completedAt) >= weekStart
        );

        const bodyPartCounts = {};
        thisWeekWorkouts.forEach(workout => {
            if (workout.bodyParts) {
                workout.bodyParts.forEach(part => {
                    bodyPartCounts[part] = (bodyPartCounts[part] || 0) + 1;
                });
            }
        });

        const chartContainer = document.getElementById('body-parts-chart');
        if (Object.keys(bodyPartCounts).length === 0) {
            chartContainer.innerHTML = '<div class="text-sm text-gray-500 text-center py-2">No data this week</div>';
            return;
        }

        const maxCount = Math.max(...Object.values(bodyPartCounts));
        chartContainer.innerHTML = Object.entries(bodyPartCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([part, count]) => {
                const percentage = (count / maxCount) * 100;
                return `
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 capitalize">${part}</span>
                        <div class="flex items-center">
                            <div class="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                <div class="h-2 bg-blue-500 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                            <span class="text-xs text-gray-600 w-6">${count}</span>
                        </div>
                    </div>
                `;
            }).join('');
    }

    updateRecentWorkouts() {
        const container = document.getElementById('recent-workouts');
        const recentWorkouts = [...this.workouts]
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 5);

        if (recentWorkouts.length === 0) {
            container.innerHTML = '<div class="text-sm text-gray-500 text-center py-2">No workouts yet</div>';
            return;
        }

        container.innerHTML = recentWorkouts.map(workout => {
            const date = new Date(workout.completedAt);
            const timeAgo = this.getTimeAgo(date);
            return `
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate" title="${workout.title}">
                            ${workout.title}
                        </div>
                        <div class="text-xs text-gray-500">${workout.channel} • ${timeAgo}</div>
                    </div>
                    <div class="text-xs text-blue-600 ml-2">
                        ${Math.round(workout.durationWatched || 0)}min
                    </div>
                </div>
            `;
        }).join('');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    async exportData() {
        const dataStr = JSON.stringify(this.workouts, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all workout data? This cannot be undone.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.remove(['stats']);
                this.workouts = [];
                this.stats = {
                    hiddenThisWeek: 0,
                    hiddenAllTime: 0,
                    estimatedTimeSavedMin: 0,
                    weekStart: new Date().toISOString(),
                };
                this.updateUI();
            } catch (error) {
                console.error('Error clearing data:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FitnessPopup();
});
