import cv2
import json
import os
import threading
import time
import numpy as np
import torch
from urllib.parse import quote
from ultralytics import YOLO
from database_config import *

cv2.setUseOptimized(True)
torch.set_num_threads(max(1, (os.cpu_count() or 4)))

model = YOLO("data/best.pt")
try:
    model.fuse()
except Exception:
    pass

ConfigPath = "camera_config.json"
STOP_FLAG_PATH = "stop_detection.flag"

ConfigDefault = {
    "username": "admin",
    "password": "",
    "ip": "192.168.1.64",
}

def DataSetter():
    OurConfig = ConfigDefault.copy()

    if(os.path.exists(ConfigPath)):
        with open(ConfigPath,"r") as f:
            OurConfig.update(json.load(f))

    return OurConfig

def RtspSetter(OurConfig):
    user = quote(str(OurConfig["username"]))
    passw = quote(str(OurConfig["password"]))
    Ip = quote(str(OurConfig["ip"]))
    return f"rtsp://{user}:{passw}@{Ip}:554/Streaming/Channels/101"


rtsp_url = RtspSetter(DataSetter())

os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
    "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;0|"
    "reorder_queue_size;0|probesize;32|analyzeduration;0"
)

cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

ret, frame = cap.read()
if not ret:
    print("Error: video not found or cannot be read.")
    exit()
 
FULL_W, FULL_H = frame.shape[1], frame.shape[0]
 
SKIP_FRAMES = 0
CONF_THRESHOLD = 0.98  # Single threshold: filtered directly in track()
 
# ─── 1. Zoom Zone Selection ──────────────────────────────────────────────────
print("Select the zoom zone and press ENTER")
zoom_roi = cv2.selectROI("Select ZOOM zone (ENTER to confirm)", frame, False, False)
cv2.destroyAllWindows()
 
ZX, ZY, ZW, ZH = map(int, zoom_roi)
ZX2, ZY2 = ZX + ZW, ZY + ZH
 
# ─── 2. Line Drawing ─────────────────────────────────────────────────────────
line_points = []
 
def draw_line(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN and len(line_points) < 2:
        line_points.append((x, y))
 
# Show stretched crop only as a preview for drawing the line
zoomed_preview = cv2.resize(frame[ZY:ZY2, ZX:ZX2], (FULL_W, FULL_H))
 
cv2.namedWindow("Draw Line (2 clicks) + ENTER")
cv2.setMouseCallback("Draw Line (2 clicks) + ENTER", draw_line)
 
print("Click 2 points for the line, then press ENTER. Press R to reset.")
 
while True:
    temp = zoomed_preview.copy()
    cv2.rectangle(temp, (0, 0), (FULL_W-1, FULL_H-1), (255, 255, 0), 3)
    cv2.putText(temp, "ZOOM ZONE", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
 
    for pt in line_points:
        cv2.circle(temp, pt, 6, (0, 0, 255), -1)
    if len(line_points) == 2:
        cv2.line(temp, line_points[0], line_points[1], (0, 0, 255), 2)
        cv2.putText(temp, "Press ENTER to confirm", (20, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
 
    cv2.imshow("Draw Line (2 clicks) + ENTER", temp)
 
    key = cv2.waitKey(1) & 0xFF
    if key == 13 and len(line_points) == 2:
        break
    elif key == ord('r'):
        line_points.clear()
 
cv2.destroyAllWindows()
 
lp1_zoom = line_points[0]
lp2_zoom = line_points[1]
 
# Convert line points from preview coordinates to crop coordinates
def zoom_to_orig(px, py):
    ox = int(px * ZW / FULL_W) + ZX
    oy = int(py * ZH / FULL_H) + ZY
    return (ox, oy)
 
lp1 = zoom_to_orig(*lp1_zoom)
lp2 = zoom_to_orig(*lp2_zoom)

def flush_capture_buffer(capture, label="", max_drop=20):
    """Drop a few stale frames without breaking the RTSP session."""
    dropped = 0
    while dropped < max_drop and capture.grab():
        dropped += 1
    if dropped:
        capture.retrieve()
    if label and dropped:
        print(f"[Camera] {label}: dropped {dropped} buffered frame(s)")
    return dropped

def side_of_line(px, py, ax, ay, bx, by):
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax)



class LatestFrameReader:
    """Background thread keeps the newest frame (read() only — works with more RTSP URLs)."""

    def __init__(self, capture):
        self._cap = capture
        self._lock = threading.Lock()
        self._frame = None
        self._running = True
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()

    def _worker(self):
        while self._running and self._cap.isOpened():
            ret, frame = self._cap.read()
            if ret and frame is not None:
                with self._lock:
                    self._frame = frame
            else:
                time.sleep(0.01)

    def read(self):
        with self._lock:
            if self._frame is None:
                return False, None
            return True, self._frame.copy()

    def stop(self):
        self._running = False
        self._thread.join(timeout=2.0)


def show_frame(img):
    h, w = img.shape[:2]
    if w > DISPLAY_MAX_W:
        scale = DISPLAY_MAX_W / w
        img = cv2.resize(
            img,
            (DISPLAY_MAX_W, int(h * scale)),
            interpolation=cv2.INTER_LINEAR,
        )
    cv2.imshow("Clean Counter", img)


TRACK_KWARGS = dict(
    persist=True,
    conf=CONF_THRESHOLD,
    iou=0.5,
    imgsz=320,
    tracker="bytetrack.yaml",
    device="cpu",
    verbose=False,
    augment=False,
    max_det=20,
)

DISPLAY_MAX_W = 960
LP1X, LP1Y = lp1[0], lp1[1]
LP2X, LP2Y = lp2[0], lp2[1]

# ─── Tracking ────────────────────────────────────────────────────────────────
track_history = {}
counted_ids = set()
total_count = 0
frame_idx = 0
last_boxes_draw = []
session_saved = False


def should_stop():
    return os.path.exists(STOP_FLAG_PATH)


def save_session():
    global session_saved
    if not session_saved:
        Base_Write(total_count)
        session_saved = True
        print(f"[Python] Saved session count: {total_count}")


if os.path.exists(STOP_FLAG_PATH):
    os.remove(STOP_FLAG_PATH)

print("Warming up model...")
model.track(frame[ZY:ZY2, ZX:ZX2], **TRACK_KWARGS)

flush_capture_buffer(cap, "After ROI setup")
frame_reader = LatestFrameReader(cap)

cv2.namedWindow("Clean Counter", cv2.WINDOW_NORMAL)
for _ in range(100):
    ret, live_frame = frame_reader.read()
    if ret:
        frame = live_frame
        break
    time.sleep(0.05)
else:
    print("Warning: camera thread slow to start, using last setup frame.")

print(
    f"Processing started. Frame skip: {SKIP_FRAMES}. "
    "Press ESC or use Terminate Process in the app to save and exit."
)

try:
    with torch.inference_mode():
        while cap.isOpened():
            ret, frame = frame_reader.read()
            if not ret or frame is None:
                time.sleep(0.001)
                continue

            if frame_idx % (SKIP_FRAMES + 1) == 0:
                crop = frame[ZY:ZY2, ZX:ZX2]
                r = model.track(crop, **TRACK_KWARGS)[0]
                last_boxes_draw = []

                if r.boxes is not None and r.boxes.id is not None:
                    boxes = r.boxes.xyxy.numpy()
                    ids = r.boxes.id.numpy().astype(int)

                    for box, tid in zip(boxes, ids):
                        x1, y1, x2, y2 = map(int, box)
                        ox1 = x1 + ZX
                        oy1 = y1 + ZY
                        ox2 = x2 + ZX
                        oy2 = y2 + ZY
                        cx = (ox1 + ox2) // 2
                        cy = (oy1 + oy2) // 2

                        curr_side = side_of_line(cx, cy, LP1X, LP1Y, LP2X, LP2Y)

                        if tid in track_history:
                            if (
                                track_history[tid] * curr_side < 0
                                and tid not in counted_ids
                            ):
                                total_count += 1
                                counted_ids.add(tid)

                        track_history[tid] = curr_side
                        last_boxes_draw.append((ox1, oy1, ox2, oy2, tid))

            for ox1, oy1, ox2, oy2, tid in last_boxes_draw:
                color = (255, 0, 255) if tid in counted_ids else (0, 255, 0)
                cv2.rectangle(frame, (ox1, oy1), (ox2, oy2), color, 2)

            cv2.rectangle(frame, (ZX, ZY), (ZX2, ZY2), (255, 255, 0), 2)
            cv2.line(frame, lp1, lp2, (0, 0, 255), 2)
            cv2.rectangle(frame, (10, 10), (220, 60), (0, 0, 0), -1)
            cv2.putText(
                frame,
                f"TOTAL: {total_count}",
                (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 255, 255),
                2,
            )

            show_frame(frame)
            frame_idx += 1

            key = cv2.waitKey(1) & 0xFF
            if key == 27 or should_stop():
                save_session()
                break
finally:
    if os.path.exists(STOP_FLAG_PATH):
        os.remove(STOP_FLAG_PATH)
    frame_reader.stop()
    cap.release()
    cv2.destroyAllWindows()

