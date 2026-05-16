# Python Integration Guide: Camera Source

The application now sends the camera source (entered in the UI) to a file named `camera_source.txt` in the root directory. Follow these steps to update your Python script.

## 1. Update `optimized-live-detection.py`

Replace the hardcoded `cv2.VideoCapture` line with logic that reads the source from the text file.

### Proposed Code Snippet

Replace this:
```python
cap = cv2.VideoCapture("data/bread-shorter.mp4")
```

With this:
```python
import os

# --- Read Camera Source ---
source_file = "camera_source.txt"
camera_source = "0"  # Default fallback

if os.path.exists(source_file):
    with open(source_file, "r") as f:
        camera_source = f.read().strip()

# Convert to integer if it's a digit (for local cameras), else keep as string
try:
    if camera_source.isdigit():
        video_origin = int(camera_source)
    else:
        video_origin = camera_source
except Exception:
    video_origin = 0

print(f"[Python] Connecting to source: {video_origin}")
# Use the origin when creating VideoCapture
cap = cv2.VideoCapture(video_origin)
# --------------------------
```

## 2. Explanation

1.  **File Reading**: The script checks if `camera_source.txt` exists.
2.  **Type Conversion**:
    *   If the input is just numbers (e.g., `0`, `1`), it converts it to an `int`. This is required by OpenCV for local webcams.
    *   If the input is a path or URL (e.g., `data/video.mp4` or `rtsp://...`), it keeps it as a `string`.
3.  **Fallback**: If the file is missing or empty, it defaults to camera `0`.

## 3. Benefits

- **Flexibility**: You can now switch between multiple connected webcams or use local video files for testing directly from the app's UI.
- **Dynamic**: No need to restart the Electron app to change cameras, just enter the new ID and click "Start Detection".
