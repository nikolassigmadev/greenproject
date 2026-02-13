# Camera Testing Guide - Ethical Shopper

## Overview
The camera feature has been debugged across two rounds of fixes:
1. **Cross-browser compatibility** - Works on Chrome, Firefox, Safari, Edge
2. **Critical runtime bugs** - Fixed stale closures, timeouts, race conditions

## Quick Start

### Start Dev Server
```bash
npm run dev
```

### Test URL
http://localhost:5173/scan

## Basic Test (1 minute)

1. **Open in Browser**
   - Navigate to http://localhost:5173/scan
   - Open DevTools: F12 or Cmd+Opt+I

2. **Test Camera Access**
   - Click "Use Camera" button
   - Allow camera permission when prompted
   - Check Console tab for these messages:
     - ✅ "Camera API available"
     - ✅ "Camera access granted with optimal settings"
     - ✅ "Video can play, dimensions: X x Y"
     - ✅ "Video playback started"

3. **Verify Camera Works**
   - Camera feed should display in video element
   - You should see the scanning overlay
   - Click capture button
   - Camera should close

## Comprehensive Test (5 minutes)

### Test 1: Normal Flow
```
1. Click "Use Camera"
2. Allow permission
3. Wait for initialization (1-2 seconds)
4. Verify camera displays
5. Take a photo
6. Verify image processes
7. Result: Should work smoothly ✅
```

### Test 2: Permission Handling
```
1. Clear site data for localhost
2. Click "Use Camera"
3. Click "Deny" when prompted
4. Verify error: "Camera permission denied"
5. Refresh page
6. Click "Use Camera" again
7. Click "Allow"
8. Result: Should work after permission ✅
```

### Test 3: Rapid Clicking
```
1. Click "Use Camera" button 10 times quickly
2. Camera should initialize only once
3. No error messages in console
4. No duplicate streams
5. Result: Should handle gracefully ✅
```

### Test 4: Refresh During Setup
```
1. Click "Use Camera"
2. During initialization (before video appears), press Cmd+R / Ctrl+R
3. Page should refresh cleanly
4. No error messages
5. Can click "Use Camera" again
6. Result: Should not hang ✅
```

### Test 5: Stop and Restart
```
1. Click "Use Camera"
2. Wait for camera to load
3. Click close (X) button
4. Click "Use Camera" again
5. Should work the same as first time
6. Result: Should restart cleanly ✅
```

### Test 6: Video Element Attributes
```
1. Camera active (showing feed)
2. Right-click on video > Inspect
3. Verify video element has:
   - autoPlay
   - playsInline
   - muted
   - webkit-playsinline="true"
4. Verify it's streaming (green border in DevTools)
5. Result: Attributes correct ✅
```

## Mobile Testing

### iPhone Testing
```
1. On Mac: npm run dev
2. Find local IP: ifconfig | grep "inet " (192.168.x.x)
3. On iPhone: Safari > http://192.168.x.x:5173/scan
4. Click "Use Camera"
5. Allow permission
6. Should see rear camera feed
7. Rotate phone - video should rotate
8. Take photo - should work
9. Result: Works on iOS ✅
```

### Android Testing
```
1. On development machine: npm run dev
2. On Android phone: Open Chrome
3. Go to http://192.168.x.x:5173/scan
4. Click "Use Camera"
5. Allow permission
6. Should see rear camera feed
7. Take photo - should work
8. Test both Chrome and Firefox
9. Result: Works on Android ✅
```

## Error Scenarios to Test

### Test: No Camera Found
```
Expected: "No camera found - Connect a camera and try again."
Cause: Device without camera
Action: Test on device with camera
```

### Test: Camera In Use
```
Expected: "Camera is in use - Close other apps using the camera."
Cause: Another app using camera
Action: Close other apps (Zoom, Teams, Discord, etc.)
```

### Test: Permission Denied
```
Expected: "Camera permission denied - Allow camera access in browser settings."
Cause: User denied permission
Action: Check browser permissions, retry
```

### Test: Timeout (Should Not Happen)
```
Expected: "Camera setup took too long. Try again."
Cause: Camera initialization exceeds 8 seconds (rare)
Action: Refresh page and retry
```

## Console Message Reference

### Success Path
```
Camera API available
Camera access granted with optimal settings
Video can play, dimensions: 1280 x 720
Video playback started
Photo captured: 123456 bytes
```

### Fallback Path (Low-Res Camera)
```
Camera API available
Optimal settings failed, trying standard settings: OverconstrainedError...
Camera access granted with basic settings
Video can play, dimensions: 640 x 480
Video playback started
```

### Error Path
```
Camera initialization error: NotAllowedError: Permission denied
```

## Performance Expectations

| Operation | Time |
|-----------|------|
| First camera init | 1-2 seconds |
| Subsequent init | <1 second |
| Photo capture | <500ms |
| Constraints fallback | <1 second |

## Browser Compatibility Matrix

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ (iOS) |
| Edge | ✅ | ✅ |

## Debug Information

The app displays debug info at bottom of page:
- **Browser**: Chrome, Safari, Firefox, etc.
- **Device**: Mobile or Desktop
- **Protocol**: HTTP or HTTPS
- **Host**: localhost or domain
- **mediaDevices**: Supported or not
- **getUserMedia**: Available or not
- **Secure Context**: Required or not

All should show green checkmarks (✅) for camera to work.

## Troubleshooting

### Camera doesn't work at all
1. Check browser console (F12)
2. Look for error messages
3. Check browser permissions (🔒 icon in address bar)
4. Try different browser
5. Check if other apps are using camera

### Camera hangs on initialization
1. Refresh page (Cmd+R / Ctrl+R)
2. Try different browser
3. Check console for timeout message
4. Restart browser

### Blurry or low-quality camera
1. Check lighting
2. Device may not support HD (1280x720)
3. App will fallback to lower resolution automatically
4. Still works, just lower quality

### Mobile camera won't rotate
1. Check device orientation lock (Settings)
2. Try landscape/portrait
3. Restart browser
4. Some devices have orientation restrictions

## Memory Leak Check

1. Open DevTools Memory tab
2. Take heap snapshot (before camera use)
3. Click "Use Camera" 20 times
4. Stop camera each time
5. Take another heap snapshot
6. Compare sizes - should not increase significantly

Expected: <10 MB difference for 20 camera initializations

## Test Checklist

- [ ] Basic test passes (1 min)
- [ ] Normal flow works
- [ ] Permission denial handled
- [ ] Rapid clicking doesn't break
- [ ] Refresh during setup OK
- [ ] Stop and restart works
- [ ] Video attributes correct
- [ ] iOS Safari works
- [ ] Android Chrome works
- [ ] Debug info displays correctly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance as expected

## Filing Issues

If camera doesn't work:
1. Take screenshot of error
2. Copy console error message
3. Note browser and device
4. Note what steps caused it
5. Include debug info from page

Example issue:
```
Browser: Safari on iPhone
Device: iOS 17.2
Error: Camera permission denied
Steps: 1. Click Use Camera 2. Tap Deny 3. Refresh 4. Click Use Camera again
Expected: Should ask permission again
Actual: Shows "Not Supported"
```

## References

- [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Browser API Compatibility](https://caniuse.com/getusermedia)
- [iOS Camera Restrictions](https://developer.apple.com/documentation/webkit/webkit_for_safari)

