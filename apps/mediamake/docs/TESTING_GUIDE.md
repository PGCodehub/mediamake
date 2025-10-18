# Custom Theme Background Preset - Testing Guide

## 🧪 Testing Instructions

This guide will help you test all features of the Custom Theme Background Preset.

## Prerequisites

1. Start the MediaMake development server:
   ```bash
   cd apps/mediamake
   npm run dev
   ```

2. Navigate to the Presets page in your browser (typically `/presets` or `/studio`)

3. Select "Custom Theme Background" from the preset list

## Test Cases

### Test 1: Predefined Palettes ✓

**Objective**: Verify all predefined palettes work correctly

**Steps**:
1. Set `paletteMode` to "predefined"
2. Set `backgroundType` to "linear-gradient"
3. Test each palette:
   - [ ] Sunset - Should show warm orange/yellow gradient
   - [ ] Ocean - Should show cool blue gradient
   - [ ] Neon - Should show vibrant pink/purple/yellow gradient
   - [ ] Forest - Should show green nature tones
   - [ ] Monochrome - Should show grayscale gradient
   - [ ] Pastel - Should show soft light colors
   - [ ] Fire - Should show red/orange/gold gradient
   - [ ] Purple - Should show purple shades
   - [ ] Tropical - Should show cyan/pink/gold/mint
   - [ ] Autumn - Should show brown/tan earth tones

**Expected Result**: Each palette should display distinct color themes

---

### Test 2: Custom Colors ✓

**Objective**: Verify custom color input works

**Steps**:
1. Set `paletteMode` to "custom"
2. Set `backgroundType` to "linear-gradient"
3. Test with different color arrays:
   - [ ] 2 colors: `["#FF0000", "#0000FF"]` - Red to blue
   - [ ] 3 colors: `["#FF0000", "#00FF00", "#0000FF"]` - RGB
   - [ ] 5 colors: `["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF"]` - Rainbow

**Expected Result**: Gradients should use the exact custom colors provided

---

### Test 3: Background Types ✓

**Objective**: Test all background type options

**Configuration**: Use "ocean" palette for consistency

1. **Solid Background**
   - [ ] Set `backgroundType` to "solid"
   - Expected: Single solid color (first color from palette)

2. **Linear Gradient**
   - [ ] Set `backgroundType` to "linear-gradient"
   - [ ] Try different directions: to-right, to-left, to-top, to-bottom
   - Expected: Gradient flows in specified direction

3. **Radial Gradient**
   - [ ] Set `backgroundType` to "radial-gradient"
   - Expected: Circular gradient from center outward

4. **Pattern - Dots**
   - [ ] Set `backgroundType` to "pattern"
   - [ ] Set `patternType` to "dots"
   - [ ] Try density values: 1, 5, 10
   - Expected: Dots over gradient, density increases with higher values

5. **Pattern - Stripes**
   - [ ] Set `backgroundType` to "pattern"
   - [ ] Set `patternType` to "stripes"
   - Expected: Diagonal stripes over gradient

6. **Pattern - Grid**
   - [ ] Set `backgroundType` to "pattern"
   - [ ] Set `patternType` to "grid"
   - Expected: Grid lines over gradient

7. **Pattern - Checkerboard**
   - [ ] Set `backgroundType` to "pattern"
   - [ ] Set `patternType` to "checkerboard"
   - Expected: Checkerboard pattern with gradient colors

---

### Test 4: Media Overlays ✓

**Objective**: Test image and video overlay functionality

**Prerequisites**: You'll need test media URLs

1. **Image Overlay**
   - [ ] Set `backgroundType` to "image-overlay"
   - [ ] Set `mediaUrl` to a valid image URL
   - [ ] Set `mediaOpacity` to 0.3
   - Expected: Image visible with 30% opacity gradient overlay
   - [ ] Try opacity values: 0.1, 0.5, 0.9
   - Expected: Overlay intensity changes

2. **Video Overlay**
   - [ ] Set `backgroundType` to "video-overlay"
   - [ ] Set `mediaUrl` to a valid video URL
   - [ ] Set `mediaOpacity` to 0.5
   - Expected: Video plays with 50% opacity gradient overlay
   - Expected: Video is muted and loops

---

### Test 5: Animations ✓

**Objective**: Test all animation types

**Configuration**: Use "neon" palette with "linear-gradient"

1. **No Animation**
   - [ ] Set `animationType` to "none"
   - Expected: Static background

2. **Gradient Shift**
   - [ ] Set `animationType` to "gradient-shift"
   - [ ] Set `animationSpeed` to 10
   - Expected: Colors cycle through hue rotation over 10 seconds
   - Expected: Animation loops continuously

3. **Gradient Rotate**
   - [ ] Set `animationType` to "gradient-rotate"
   - [ ] Set `animationSpeed` to 15
   - Expected: Background rotates 360° over 15 seconds
   - Expected: Smooth rotation

4. **Parallax**
   - [ ] Set `animationType` to "parallax"
   - [ ] Set `animationSpeed` to 8
   - Expected: Subtle up-down motion over 8 seconds
   - Expected: Smooth oscillation

5. **Slow Pan**
   - [ ] Set `animationType` to "slow-pan"
   - [ ] Set `animationSpeed` to 12
   - Expected: Horizontal panning motion over 12 seconds
   - Expected: Smooth left-to-right movement

---

### Test 6: Duration Modes ✓

**Objective**: Test duration configuration

1. **Fixed Duration**
   - [ ] Set `durationMode` to "fixed"
   - [ ] Set `fixedDuration` to 15
   - Expected: Composition duration is 15 seconds
   - [ ] Try values: 5, 10, 30
   - Expected: Duration changes accordingly

2. **Match Component**
   - Prerequisites: Add another preset with known duration (e.g., audio track)
   - [ ] Set `durationMode` to "match-component"
   - [ ] Set `matchComponentId` to the target component ID (e.g., "AudioTrack")
   - Expected: Background duration matches the referenced component

---

### Test 7: Aspect Ratios ✓

**Objective**: Test different aspect ratio configurations

**Steps**:
1. Test common aspect ratios:
   - [ ] `16:9` - Expected: 1920x1080 (widescreen)
   - [ ] `9:16` - Expected: 1080x1920 (vertical/mobile)
   - [ ] `1:1` - Expected: 1080x1080 (square)
   - [ ] `4:3` - Expected: 1440x1080 (classic)

**Expected Result**: Video dimensions should match the aspect ratio

---

### Test 8: Preset Combination ✓

**Objective**: Test combining with other presets

**Scenario 1: Background + Text Overlay**
1. [ ] Apply Custom Theme Background preset (gradient + animation)
2. [ ] Apply Text Overlay preset
3. Expected: Text appears on top of animated background
4. Expected: Both presets work together without conflicts

**Scenario 2: Background + Waveform**
1. [ ] Apply Custom Theme Background preset
2. [ ] Apply Waveform preset with audio
3. Expected: Waveform visualizes on top of background
4. Expected: Duration can sync with audio

**Scenario 3: Complete Music Video**
1. [ ] Apply Custom Theme Background (video overlay + animation)
2. [ ] Apply Audio Track preset
3. [ ] Apply Waveform preset
4. [ ] Apply Text Overlay preset (title)
5. [ ] Apply Subtitles preset
6. Expected: All layers combine into cohesive video
7. Expected: No visual conflicts or rendering issues

---

### Test 9: Edge Cases ✓

**Objective**: Test boundary conditions and error handling

1. **Invalid Media URLs**
   - [ ] Set `backgroundType` to "image-overlay"
   - [ ] Set `mediaUrl` to invalid URL
   - Expected: Graceful fallback or error message

2. **Extreme Values**
   - [ ] Pattern density = 1 (sparse)
   - [ ] Pattern density = 10 (dense)
   - [ ] Animation speed = 1 (fast)
   - [ ] Animation speed = 20 (very slow)
   - Expected: All values work without breaking

3. **Empty Custom Colors**
   - [ ] Set `paletteMode` to "custom"
   - [ ] Leave `customColors` empty
   - Expected: Falls back to predefined palette or shows validation error

---

### Test 10: Form UI ✓

**Objective**: Verify the auto-generated form UI works correctly

1. [ ] All input fields render correctly
2. [ ] Dropdown menus show all options
3. [ ] Number inputs respect min/max constraints
4. [ ] Color inputs (if rendered) allow color picking
5. [ ] Help text/descriptions are visible
6. [ ] Default values populate correctly
7. [ ] JSON mode toggle works
8. [ ] Generate button triggers preview

---

## Performance Testing

### Visual Quality ✓
- [ ] No flickering during animations
- [ ] Smooth gradient transitions
- [ ] Patterns render crisply
- [ ] Colors appear vibrant and correct
- [ ] No visual artifacts

### Rendering Performance ✓
- [ ] Preview loads quickly
- [ ] Animations run at 30fps smoothly
- [ ] Video overlays don't lag
- [ ] Multiple presets don't slow down rendering
- [ ] Export/render completes successfully

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

---

## Bug Reporting Template

If you find issues, document them:

```
Bug: [Brief description]
Steps to Reproduce:
1. ...
2. ...
3. ...

Expected Behavior: ...
Actual Behavior: ...
Configuration Used: [Copy JSON]
Browser: ...
Screenshot: [If applicable]
```

---

## Success Criteria

The preset is working correctly if:
- ✅ All 10 predefined palettes render correctly
- ✅ Custom colors work with 1-5 colors
- ✅ All 6 background types display properly
- ✅ All 4 pattern types work
- ✅ Media overlays load and blend correctly
- ✅ All 5 animation types run smoothly
- ✅ Duration modes work (fixed and match-component)
- ✅ Aspect ratios produce correct dimensions
- ✅ Preset combines well with other presets
- ✅ No console errors or warnings
- ✅ UI form is functional and intuitive

---

## Quick Test Configurations

Copy these JSON configs for quick testing:

### Config 1: Animated Neon Gradient
```json
{
  "paletteMode": "predefined",
  "predefinedPalette": "neon",
  "backgroundType": "linear-gradient",
  "gradientDirection": "to-bottom-right",
  "animationType": "gradient-shift",
  "animationSpeed": 12,
  "durationMode": "fixed",
  "fixedDuration": 20
}
```

### Config 2: Ocean Pattern with Parallax
```json
{
  "paletteMode": "predefined",
  "predefinedPalette": "ocean",
  "backgroundType": "pattern",
  "patternType": "dots",
  "patternDensity": 7,
  "animationType": "parallax",
  "animationSpeed": 10,
  "durationMode": "fixed",
  "fixedDuration": 25
}
```

### Config 3: Custom Colors Radial
```json
{
  "paletteMode": "custom",
  "customColors": ["#FF1493", "#00CED1", "#FFD700"],
  "backgroundType": "radial-gradient",
  "animationType": "gradient-rotate",
  "animationSpeed": 15,
  "durationMode": "fixed",
  "fixedDuration": 30
}
```

---

**Note**: This preset is designed to work as a foundation layer. Always apply it first, then add other presets on top for best results.





