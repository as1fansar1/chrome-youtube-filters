# YouTube Fitness Filter Chrome Extension

A Chrome extension that enhances YouTube for fitness enthusiasts by adding smart filtering, workout tracking, and personal dashboard features.

## Features

### 🎯 Smart Filtering
- **Duration filters**: Under 10 min, 10-20 min, 20-30 min, 30-45 min, 45+ min
- **Equipment filters**: No equipment, Dumbbells, Resistance bands, Kettlebell, Full gym
- **Workout type filters**: HIIT, Strength, Yoga, Pilates, Cardio, Abs, Upper body, Lower body, Full body, Stretching
- **Difficulty levels**: Beginner, Intermediate, Advanced
- **Special filters**: No talking/music only, Follow along, Apartment friendly

### 🧰 Custom filter rules (v1.1)
Open the Options page (right-click the extension icon → "Options", or use the "Manage rules →" link in the popup) to add your own rules. Each rule has three pieces:

- **Channel name** — the exact channel name to target, or `*` to apply globally.
- **Filter type** — one of:
  - `shorts` — hide every YouTube Short from the matching channel.
  - `minDuration` — hide videos shorter than N minutes (helps skip filler).
  - `keyword` — hide videos whose title or channel contains the given substring (case-insensitive).
- **Value** — the minutes threshold for `minDuration`, or the keyword for `keyword`. Ignored for `shorts`.

Rules persist to `chrome.storage.sync`, so they roam with your Chrome profile. Edits take effect on the next page render — no reload required.

### 📊 Workout Tracking
- Mark videos as completed with visual checkmarks
- Track workout history and statistics
- Personal workout dashboard with analytics
- Weekly streak tracking with heat map visualization

### ⏱️ Savings counter (v1.1)
Every time the extension hides a video for you, it bumps a counter stored in `chrome.storage.local` under the key `stats`:

```json
{
  "hiddenThisWeek": 12,
  "hiddenAllTime": 247,
  "estimatedTimeSavedMin": 1976,
  "weekStart": "2026-05-11T00:00:00.000Z"
}
```

Time saved assumes an 8-minute average per hidden video (a reasonable proxy for a typical YouTube session). The popup surfaces "This week" totals up front and an all-time line beneath it. The weekly counter resets automatically when `weekStart` is more than 7 days old.

### 🎨 Clean UI
- Non-intrusive filter bar that slides down on fitness-related searches
- Dark/light mode compatibility with YouTube
- Responsive design for all screen sizes
- Smooth animations and transitions

## Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download/Clone the Extension**
   ```bash
   git clone <repository-url>
   # OR download and extract the ZIP file
   ```

2. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - OR Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension folder containing `manifest.json`

5. **Add Icons (Optional)**
   - The extension will work with default Chrome icons
   - To add custom icons, place PNG files in the `icons/` folder:
     - `icon16.png` (16x16 pixels)
     - `icon32.png` (32x32 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)

### Method 2: Chrome Web Store (Future)
This extension is not yet published to the Chrome Web Store.

## Usage

### Getting Started
1. **Install the extension** following the steps above
2. **Navigate to YouTube** and search for fitness-related terms like:
   - "workout"
   - "fitness"
   - "HIIT"
   - "yoga"
   - "pilates"
   - "exercise"

3. **The filter bar will automatically appear** on fitness-related search results

### Using the Filter Bar
- **Automatic Detection**: The filter bar appears on YouTube search results when fitness keywords are detected
- **Multiple Filters**: Use multiple filters simultaneously for precise results
- **Instant Filtering**: Videos are filtered in real-time without page reloads
- **Collapsible**: Click the "−" button to collapse/expand the filter bar
- **Clear All**: Reset all filters with the "Clear All" button

### Tracking Workouts
- **Mark Complete**: Click the "+" button on video thumbnails to mark as completed
- **Visual Indicators**: Completed videos show a green checkmark and left border
- **Workout History**: View your progress in the extension popup

### Dashboard Features
- **Click the extension icon** to open your personal fitness dashboard
- **This week panel**: see how many videos the extension hid and roughly how much time it saved you, with a link to manage your custom rules
- **Weekly Stats**: See workouts completed this week and total minutes
- **Streak Tracking**: Visualize your workout consistency with a weekly heat map
- **Body Parts Chart**: Track which muscle groups you've worked this week
- **Recent Workouts**: Quick access to your latest completed workouts
- **Export Data**: Download your workout data as JSON
- **Clear Data**: Reset all tracking data if needed

## Technical Details

### File Structure
```
youtube-fitness-filter/
├── manifest.json           # Extension configuration
├── content.js              # Main content script for YouTube integration
├── rules.js                # Custom-rules engine + savings counter
├── options.html            # Filter rules editor UI
├── options.js              # Filter rules editor logic
├── popup.html              # Dashboard popup interface
├── popup.js                # Popup functionality and data visualization
├── background.js           # Service worker for data management
├── styles.css              # Styles for filter bar and overlays
├── icons/                  # Extension icons (optional)
└── README.md               # This file
```

### Technologies Used
- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No external dependencies
- **Chrome Storage API**: Cross-device data synchronization
- **CSS3**: Modern styling with animations and responsive design
- **Tailwind CSS**: Utility-first CSS framework (via CDN for popup)

### Data Storage
- Workouts and filter rules go to `chrome.storage.sync` (synced across devices)
- Savings stats go to `chrome.storage.local` (per-device, larger quota)
- Export functionality for data backup

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Supported (Chromium-based)
- **Firefox**: Not supported (uses Manifest V2)
- **Safari**: Not supported

## Privacy & Permissions

### Required Permissions
- **Storage**: To save workout tracking data and custom filter rules
- **ActiveTab**: To access YouTube page content
- **Host Permissions**: Only for `*.youtube.com` domains

### Data Privacy
- All data is stored locally in your browser
- No data is sent to external servers
- Chrome sync is optional and controlled by your browser settings

## Version History
- **v1.1.0**: Per-channel filter rules + weekly savings counter
- **v1.0.0**: Initial release with core filtering and tracking features

## License

This project is open source. See LICENSE file for details.

---

**Made with ❤️ for the fitness community**
