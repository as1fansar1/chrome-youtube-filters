class YouTubeFitnessFilter {
    constructor() {
        this.workouts = [];
        this.activeFilters = {
            duration: null,
            equipment: null,
            workoutType: null,
            difficulty: null,
            special: null
        };
        this.filterBar = null;
        this.isInjected = false;
        // Track which DOM nodes we've already counted as hidden so we don't
        // double-count when the MutationObserver re-runs over the same cards.
        this.countedHidden = new WeakSet();

        this.init();
    }

    async init() {
        await this.loadWorkoutData();
        this.setupMutationObserver();
        this.injectFilterBar();
        this.addVideoOverlays();
        // Run the rule engine once on initial paint; afterwards the
        // MutationObserver covers it.
        this.applyChannelRules();
    }

    async loadWorkoutData() {
        try {
            const result = await chrome.storage.sync.get(['workouts']);
            this.workouts = result.workouts || [];
        } catch (error) {
            console.error('Error loading workout data:', error);
        }
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    setTimeout(() => {
                        this.addVideoOverlays();
                        this.applyChannelRules();
                        if (!this.isInjected && this.shouldShowFilterBar()) {
                            this.injectFilterBar();
                        }
                    }, 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    shouldShowFilterBar() {
        const url = window.location.href;
        const searchParams = new URLSearchParams(window.location.search);
        const searchQuery = searchParams.get('search_query') || '';
        
        const fitnessKeywords = [
            'workout', 'fitness', 'exercise', 'hiit', 'yoga', 'pilates',
            'cardio', 'strength', 'abs', 'stretching', 'bodyweight',
            'gym', 'training', 'muscle', 'burn', 'tone'
        ];

        return url.includes('/results') && 
               fitnessKeywords.some(keyword => 
                   searchQuery.toLowerCase().includes(keyword)
               );
    }

    injectFilterBar() {
        if (this.isInjected || !this.shouldShowFilterBar()) return;

        const container = document.querySelector('#container #primary');
        if (!container) return;

        this.filterBar = this.createFilterBar();
        container.insertBefore(this.filterBar, container.firstChild);
        this.isInjected = true;

        setTimeout(() => {
            this.filterBar.classList.add('show');
        }, 100);
    }

    createFilterBar() {
        const filterBar = document.createElement('div');
        filterBar.id = 'fitness-filter-bar';
        filterBar.className = 'fitness-filter-bar';
        
        filterBar.innerHTML = `
            <div class="filter-container">
                <div class="filter-header">
                    <span class="filter-title">🏋️ Fitness Filters</span>
                    <button class="collapse-btn" id="collapse-filters">−</button>
                </div>
                <div class="filter-content" id="filter-content">
                    <div class="filter-group">
                        <label>Duration:</label>
                        <select id="duration-filter">
                            <option value="">All Durations</option>
                            <option value="short">Under 10 min</option>
                            <option value="medium-short">10-20 min</option>
                            <option value="medium">20-30 min</option>
                            <option value="medium-long">30-45 min</option>
                            <option value="long">45+ min</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Equipment:</label>
                        <select id="equipment-filter">
                            <option value="">All Equipment</option>
                            <option value="no-equipment">No Equipment</option>
                            <option value="dumbbells">Dumbbells</option>
                            <option value="resistance-bands">Resistance Bands</option>
                            <option value="kettlebell">Kettlebell</option>
                            <option value="full-gym">Full Gym</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Workout Type:</label>
                        <select id="workout-type-filter">
                            <option value="">All Types</option>
                            <option value="hiit">HIIT</option>
                            <option value="strength">Strength</option>
                            <option value="yoga">Yoga</option>
                            <option value="pilates">Pilates</option>
                            <option value="cardio">Cardio</option>
                            <option value="abs">Abs</option>
                            <option value="upper-body">Upper Body</option>
                            <option value="lower-body">Lower Body</option>
                            <option value="full-body">Full Body</option>
                            <option value="stretching">Stretching</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Difficulty:</label>
                        <select id="difficulty-filter">
                            <option value="">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Special:</label>
                        <select id="special-filter">
                            <option value="">All Videos</option>
                            <option value="no-talking">No Talking/Music Only</option>
                            <option value="follow-along">Follow Along</option>
                            <option value="apartment-friendly">Apartment Friendly</option>
                        </select>
                    </div>
                    
                    <button id="clear-filters" class="clear-btn">Clear All</button>
                </div>
            </div>
        `;

        this.setupFilterEventListeners(filterBar);
        return filterBar;
    }

    setupFilterEventListeners(filterBar) {
        const collapseBtn = filterBar.querySelector('#collapse-filters');
        const filterContent = filterBar.querySelector('#filter-content');
        
        collapseBtn.addEventListener('click', () => {
            filterContent.classList.toggle('collapsed');
            collapseBtn.textContent = filterContent.classList.contains('collapsed') ? '+' : '−';
        });

        const filterSelects = filterBar.querySelectorAll('select');
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.activeFilters[e.target.id.replace('-filter', '')] = e.target.value || null;
                this.applyFilters();
            });
        });

        filterBar.querySelector('#clear-filters').addEventListener('click', () => {
            this.clearAllFilters();
        });
    }

    applyFilters() {
        const videos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer');
        
        videos.forEach(video => {
            const shouldShow = this.videoMatchesFilters(video);
            video.style.display = shouldShow ? 'block' : 'none';
            if (!shouldShow) this.tallyHide(video);
        });
    }

    /**
     * Walk every video card, evaluate user-defined rules from the Options
     * page, and hide matching cards. Also increments the savings counter
     * exactly once per card (WeakSet-tracked).
     */
    applyChannelRules() {
        if (!window.FitnessRules) return;
        const rules = window.FitnessRules.getRules();
        if (!rules || rules.length === 0) return;

        const videos = document.querySelectorAll(
            'ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer'
        );
        videos.forEach(video => {
            // If something else already hid it, skip; the previous hide path
            // owns the counter.
            if (video.style.display === 'none') return;

            const titleEl = video.querySelector('#video-title, h3 a, a#video-title-link');
            const channelEl = video.querySelector(
                'ytd-channel-name a, #channel-name a, .ytd-channel-name a'
            );
            const durationEl = video.querySelector(
                'ytd-thumbnail-overlay-time-status-renderer span, .ytd-thumbnail-overlay-time-status-renderer'
            );
            const title = titleEl ? titleEl.textContent.trim() : '';
            const channel = channelEl ? channelEl.textContent.trim() : '';
            const durationText = durationEl ? durationEl.textContent.trim() : '';
            const href = titleEl && titleEl.href ? titleEl.href : (video.querySelector('a[href]')?.href || '');
            const isShort = /\/shorts\//.test(href);

            const hide = window.FitnessRules.shouldHide({
                channel, title, durationText, isShort
            });
            if (hide) {
                video.style.display = 'none';
                this.tallyHide(video);
            }
        });
    }

    tallyHide(node) {
        if (!node || this.countedHidden.has(node)) return;
        this.countedHidden.add(node);
        if (window.FitnessRules) {
            // Fire-and-forget; storage writes are debounced by Chrome.
            window.FitnessRules.recordHide();
        }
    }

    videoMatchesFilters(videoElement) {
        const titleElement = videoElement.querySelector('#video-title, h3 a');
        const descriptionElement = videoElement.querySelector('#description-text, #metadata-line');
        
        if (!titleElement) return true;
        
        const title = titleElement.textContent.toLowerCase();
        const description = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
        const fullText = title + ' ' + description;

        return Object.entries(this.activeFilters).every(([filterType, filterValue]) => {
            if (!filterValue) return true;
            
            switch (filterType) {
                case 'duration':
                    return this.matchesDuration(fullText, filterValue);
                case 'equipment':
                    return this.matchesEquipment(fullText, filterValue);
                case 'workoutType':
                    return this.matchesWorkoutType(fullText, filterValue);
                case 'difficulty':
                    return this.matchesDifficulty(fullText, filterValue);
                case 'special':
                    return this.matchesSpecial(fullText, filterValue);
                default:
                    return true;
            }
        });
    }

    matchesDuration(text, duration) {
        const durationPatterns = {
            'short': /(\b([1-9])\s*(min|minute)|under\s*10)/i,
            'medium-short': /(1[0-9]\s*(min|minute)|20\s*(min|minute))/i,
            'medium': /(2[0-9]\s*(min|minute)|30\s*(min|minute))/i,
            'medium-long': /(3[0-9]\s*(min|minute)|4[0-5]\s*(min|minute))/i,
            'long': /([4-9][5-9]\s*(min|minute)|[1-9]\d{2,}\s*(min|minute)|hour)/i
        };
        
        return durationPatterns[duration]?.test(text) || false;
    }

    matchesEquipment(text, equipment) {
        const equipmentPatterns = {
            'no-equipment': /no\s*equipment|bodyweight|body\s*weight/i,
            'dumbbells': /dumbbell|weight/i,
            'resistance-bands': /resistance\s*band|band/i,
            'kettlebell': /kettlebell/i,
            'full-gym': /gym|barbell|machine/i
        };
        
        return equipmentPatterns[equipment]?.test(text) || false;
    }

    matchesWorkoutType(text, workoutType) {
        const typePatterns = {
            'hiit': /hiit|high\s*intensity|tabata/i,
            'strength': /strength|weight|resistance|muscle/i,
            'yoga': /yoga/i,
            'pilates': /pilates/i,
            'cardio': /cardio|aerobic|dance/i,
            'abs': /abs|abdominal|core/i,
            'upper-body': /upper\s*body|arms|chest|back|shoulder/i,
            'lower-body': /lower\s*body|legs|glutes|butt|thigh/i,
            'full-body': /full\s*body|total\s*body|whole\s*body/i,
            'stretching': /stretch|flexibility|cool\s*down/i
        };
        
        return typePatterns[workoutType]?.test(text) || false;
    }

    matchesDifficulty(text, difficulty) {
        const difficultyPatterns = {
            'beginner': /beginner|easy|starter|basic/i,
            'intermediate': /intermediate|moderate/i,
            'advanced': /advanced|hard|intense|extreme/i
        };
        
        return difficultyPatterns[difficulty]?.test(text) || false;
    }

    matchesSpecial(text, special) {
        const specialPatterns = {
            'no-talking': /no\s*talking|music\s*only|silent/i,
            'follow-along': /follow\s*along|real\s*time/i,
            'apartment-friendly': /apartment|quiet|low\s*impact|no\s*jump/i
        };
        
        return specialPatterns[special]?.test(text) || false;
    }

    clearAllFilters() {
        this.activeFilters = {
            duration: null,
            equipment: null,
            workoutType: null,
            difficulty: null,
            special: null
        };
        
        if (this.filterBar) {
            const selects = this.filterBar.querySelectorAll('select');
            selects.forEach(select => select.value = '');
        }
        
        const videos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer');
        videos.forEach(video => {
            video.style.display = 'block';
        });
    }

    addVideoOverlays() {
        const videos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer');
        
        videos.forEach(video => {
            if (video.querySelector('.fitness-overlay')) return;
            
            const titleElement = video.querySelector('#video-title, h3 a');
            if (!titleElement) return;
            
            const videoUrl = titleElement.href;
            const videoId = this.extractVideoId(videoUrl);
            
            if (!videoId) return;
            
            const workout = this.workouts.find(w => w.videoId === videoId);
            const overlay = this.createVideoOverlay(workout, videoId, titleElement.textContent);
            
            const thumbnailContainer = video.querySelector('#thumbnail, ytd-thumbnail');
            if (thumbnailContainer) {
                thumbnailContainer.style.position = 'relative';
                thumbnailContainer.appendChild(overlay);
            }
        });
    }

    createVideoOverlay(workout, videoId, title) {
        const overlay = document.createElement('div');
        overlay.className = 'fitness-overlay';
        
        const isCompleted = !!workout;
        overlay.innerHTML = `
            ${isCompleted ? '<div class="completion-badge">✓</div>' : ''}
            <div class="overlay-actions">
                <button class="action-btn mark-complete ${isCompleted ? 'completed' : ''}" 
                        data-video-id="${videoId}" data-title="${title}">
                    ${isCompleted ? '✓' : '+'}
                </button>
            </div>
        `;
        
        const markCompleteBtn = overlay.querySelector('.mark-complete');
        markCompleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleWorkoutCompletion(videoId, title);
        });
        
        return overlay;
    }

    async toggleWorkoutCompletion(videoId, title) {
        const existingIndex = this.workouts.findIndex(w => w.videoId === videoId);
        
        if (existingIndex >= 0) {
            this.workouts.splice(existingIndex, 1);
        } else {
            const workout = {
                videoId,
                title,
                channel: this.extractChannelName(),
                completedAt: new Date().toISOString(),
                durationWatched: this.estimateDuration(title),
                totalDuration: this.estimateDuration(title),
                notes: '',
                rating: 0,
                detected_tags: this.detectTags(title),
                manual_tags: [],
                equipment: this.detectEquipment(title),
                bodyParts: this.detectBodyParts(title)
            };
            
            this.workouts.push(workout);
        }
        
        try {
            await chrome.storage.sync.set({ workouts: this.workouts });
            this.addVideoOverlays();
        } catch (error) {
            console.error('Error saving workout data:', error);
        }
    }

    extractVideoId(url) {
        if (!url) return null;
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }

    extractChannelName() {
        const channelElement = document.querySelector('ytd-channel-name a, #channel-name a');
        return channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
    }

    estimateDuration(title) {
        const match = title.match(/(\d+)\s*min/i);
        return match ? parseInt(match[1]) : 20; // Default to 20 minutes
    }

    detectTags(title) {
        const tags = [];
        const text = title.toLowerCase();
        
        const tagPatterns = {
            'hiit': /hiit|high.intensity/i,
            'beginner': /beginner|easy|starter/i,
            'advanced': /advanced|hard|intense/i,
            'no-equipment': /no.equipment|bodyweight/i,
            'full-body': /full.body|total.body/i
        };
        
        Object.entries(tagPatterns).forEach(([tag, pattern]) => {
            if (pattern.test(text)) {
                tags.push(tag);
            }
        });
        
        return tags;
    }

    detectEquipment(title) {
        const equipment = [];
        const text = title.toLowerCase();
        
        if (/no.equipment|bodyweight/i.test(text)) equipment.push('bodyweight');
        if (/dumbbell|weight/i.test(text)) equipment.push('dumbbells');
        if (/resistance.band/i.test(text)) equipment.push('resistance-bands');
        if (/kettlebell/i.test(text)) equipment.push('kettlebell');
        
        return equipment;
    }

    detectBodyParts(title) {
        const bodyParts = [];
        const text = title.toLowerCase();
        
        if (/abs|core/i.test(text)) bodyParts.push('abs');
        if (/arm|chest|back|shoulder/i.test(text)) bodyParts.push('upper-body');
        if (/leg|glute|butt|thigh/i.test(text)) bodyParts.push('lower-body');
        if (/full.body|total.body/i.test(text)) bodyParts.push('full-body');
        
        return bodyParts;
    }
}

if (window.location.hostname === 'www.youtube.com') {
    let fitnessFilter;
    
    function initializeFilter() {
        if (!fitnessFilter) {
            fitnessFilter = new YouTubeFitnessFilter();
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFilter);
    } else {
        initializeFilter();
    }
    
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(() => {
                if (fitnessFilter) {
                    fitnessFilter.isInjected = false;
                    fitnessFilter.injectFilterBar();
                    fitnessFilter.addVideoOverlays();
                    fitnessFilter.applyChannelRules();
                }
            }, 1000);
        }
    }).observe(document, { subtree: true, childList: true });
}
