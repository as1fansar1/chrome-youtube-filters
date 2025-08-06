# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Extension Development Commands

### Testing and Development
```bash
# Load extension in Chrome during development
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this directory
# 4. After making changes, click refresh button on extension card

# Test extension on different YouTube page types
# - Search results: youtube.com/results?search_query=workout
# - Home page: youtube.com (filter bar should NOT appear)  
# - Video watch pages: youtube.com/watch?v=... (completion tracking only)
# - Channel pages: youtube.com/@channel (completion tracking only)
```

### Key Testing Keywords
The extension only activates on YouTube search results containing fitness keywords: `workout`, `fitness`, `hiit`, `yoga`, `pilates`, `exercise`, `cardio`, `strength`, `abs`, `stretching`, `bodyweight`, `gym`, `training`, `muscle`, `burn`, `tone`.

## Architecture Overview

This is a Manifest V3 Chrome extension with a three-component architecture:

### Core Components

**Content Script (`content.js`)**
- Main class: `YouTubeFitnessFilter`
- Injected into all YouTube pages
- Handles filter bar injection and workout completion tracking
- Uses `MutationObserver` to handle YouTube's SPA navigation
- Key methods: `shouldShowFilterBar()`, `injectFilterBar()`, `addVideoOverlays()`, `toggleWorkoutCompletion()`

**Popup Dashboard (`popup.js` + `popup.html`)**  
- Main class: `FitnessPopup`
- Renders workout statistics, streaks, and analytics
- Uses Tailwind CSS via CDN
- Key methods: `updateStats()`, `updateHeatMap()`, `updateBodyPartsChart()`, `calculateStreak()`

**Background Service Worker (`background.js`)**
- Main class: `FitnessBackground` 
- Manages extension badge updates and data migrations
- Handles first install/update flows
- Key methods: `updateBadge()`, `onFirstInstall()`, `migrateOldData()`

### Data Architecture

**Storage Schema**
- Uses `chrome.storage.sync` (100KB limit, cross-device sync)
- Primary data structure: `workouts` array with workout objects
- Each workout contains: `videoId`, `title`, `channel`, `completedAt`, `durationWatched`, `detected_tags`, `equipment`, `bodyParts`

**Filter System**
- Pattern-based content detection using regex for workout attributes
- Real-time DOM filtering without page reloads
- Filters stored in `activeFilters` object: duration, equipment, workoutType, difficulty, special

### YouTube Integration Patterns

**Smart Injection**
- Filter bar only appears on search results with fitness keywords detected
- Uses `shouldShowFilterBar()` to check URL and search query
- Prevents injection on non-relevant pages

**DOM Interaction**
- Targets video containers: `ytd-video-renderer`, `ytd-grid-video-renderer`
- Uses relative positioning for overlays to avoid layout conflicts
- Extracts video metadata from title elements and hrefs

**SPA Navigation**
- `MutationObserver` watches for YouTube's dynamic content changes
- Handles filter bar re-injection on navigation
- Manages video overlay updates on infinite scroll

## Content Detection Logic

The extension uses sophisticated pattern matching to auto-detect workout attributes:

- **Duration**: Regex patterns like `/(\d+)\s*min/i` to extract time
- **Equipment**: Keywords like "no equipment", "dumbbells", "resistance bands"
- **Body Parts**: Detects "abs", "upper body", "lower body", "full body"
- **Difficulty**: Keywords like "beginner", "intermediate", "advanced"

## Development Considerations

**Performance Optimizations**
- Debounced filter inputs to prevent excessive DOM updates
- Lazy loading of dashboard charts
- CSS transforms for smooth animations

**YouTube Compatibility**
- Works with both dark and light YouTube themes via CSS selectors
- Shadow DOM usage prevents style conflicts
- Handles YouTube's aggressive content security policies

**Cross-Device Sync**
- Automatic data cleanup for storage limits
- Migration system for schema updates
- Export/import functionality for data portability

When modifying filtering logic, update the pattern matching functions in `content.js`. For dashboard features, work with the chart updating methods in `popup.js`. Always test on multiple YouTube page types after changes.