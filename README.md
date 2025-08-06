# YouTube Fitness Filter Chrome Extension

A Chrome extension that enhances YouTube for fitness enthusiasts by adding smart filtering, workout tracking, and personal dashboard features.

## Features

### 🎯 Smart Filtering
- **Duration filters**: Under 10 min, 10-20 min, 20-30 min, 30-45 min, 45+ min
- **Equipment filters**: No equipment, Dumbbells, Resistance bands, Kettlebell, Full gym
- **Workout type filters**: HIIT, Strength, Yoga, Pilates, Cardio, Abs, Upper body, Lower body, Full body, Stretching
- **Difficulty levels**: Beginner, Intermediate, Advanced
- **Special filters**: No talking/music only, Follow along, Apartment friendly

### 📊 Workout Tracking
- Mark videos as completed with visual checkmarks
- Track workout history and statistics
- Personal workout dashboard with analytics
- Weekly streak tracking with heat map visualization

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
├── manifest.json          # Extension configuration
├── content.js            # Main content script for YouTube integration
├── popup.html            # Dashboard popup interface
├── popup.js              # Popup functionality and data visualization
├── background.js         # Service worker for data management
├── styles.css            # Styles for filter bar and overlays
├── icons/                # Extension icons (optional)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Technologies Used
- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No external dependencies
- **Chrome Storage API**: Cross-device data synchronization
- **CSS3**: Modern styling with animations and responsive design
- **Tailwind CSS**: Utility-first CSS framework (via CDN for popup)

### Data Storage
- Uses `chrome.storage.sync` for cross-device synchronization
- Data limit: 100KB total storage
- Automatic cleanup of old workout data
- Export functionality for data backup

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Supported (Chromium-based)
- **Firefox**: Not supported (uses Manifest V2)
- **Safari**: Not supported

## Development

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension card
4. Test your changes on YouTube

### Key Development Notes
- The extension only activates on `youtube.com` domains
- Filter bar appears only on search results with fitness keywords
- Uses `MutationObserver` to handle YouTube's dynamic content loading
- Shadow DOM prevents style conflicts with YouTube's CSS

### Testing
Test the extension on these YouTube page types:
- Search results (`/results?search_query=workout`)
- Home page (filter bar should not appear)
- Video watch pages (completion tracking only)
- Channel pages (completion tracking only)

## Troubleshooting

### Filter Bar Not Appearing
- Ensure you're on a YouTube search results page
- Search for fitness-related keywords (workout, fitness, HIIT, yoga, etc.)
- Check if the extension is enabled in `chrome://extensions/`

### Data Not Syncing
- Verify Chrome sync is enabled in browser settings
- Check available storage space (extensions have 100KB limit)
- Try refreshing the extension

### Performance Issues
- The extension is optimized for performance with debounced inputs
- Large amounts of tracked data may slow down the dashboard
- Use the "Clear All" button to reset data if needed

## Privacy & Permissions

### Required Permissions
- **Storage**: To save workout tracking data
- **ActiveTab**: To access YouTube page content
- **Host Permissions**: Only for `*.youtube.com` domains

### Data Privacy
- All data is stored locally in your browser
- No data is sent to external servers
- Chrome sync is optional and controlled by your browser settings

## Contributing

### Bug Reports
Please include:
- Chrome version
- Extension version
- Steps to reproduce the issue
- Screenshots if applicable

### Feature Requests
We welcome suggestions for new features! Consider:
- New filter options
- Additional workout tracking metrics
- UI/UX improvements
- Integration with fitness apps

## Roadmap

### Planned Features
- Export to CSV format
- Integration with Google Fit / Apple Health
- Custom workout collections/playlists
- Social sharing of workout achievements
- Advanced analytics and insights
- Integration with popular fitness YouTubers

### Version History
- **v1.0.0**: Initial release with core filtering and tracking features

## License

This project is open source. See LICENSE file for details.

## Support

For support, feature requests, or bug reports, please open an issue in the project repository.

---

**Made with ❤️ for the fitness community**