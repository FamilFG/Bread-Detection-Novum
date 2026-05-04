import cv2
import numpy as np
from ultralytics import YOLO
from final_base import *

# =========================
# 1. MODEL
# =========================
model = YOLO("data/best.pt")

# =========================
# 2. CAMERA вместо видео
# =========================
rtsp_url = "rtsp://192.168.0.112:554/rtsp/streaming?channel=01&subtype=0"
cap = cv2.VideoCapture(rtsp_url)

if not cap.isOpened():
    print("Ошибка: камера не найдена")
    exit()

# =========================
# 3. Считываем первый кадр
# =========================
ret, frame = cap.read()
if not ret:
    print("Ошибка: не удалось получить кадр")
    exit()

# =========================
# 4. ROI выбор
# =========================
roi = cv2.selectROI("Select ROI and press ENTER", frame, False, False)
cv2.destroyWindow("Select ROI and press ENTER")

rx, ry, rw, rh = map(int, roi)
rx2, ry2 = rx + rw, ry + rh
line_y = ry + int(rh * 0.5)

# =========================
# 5. TRACKING DATA
# =========================
track_history = {}
counted_ids = set()
total_count = 0

# =========================
# 6. GUI WINDOW (CONTROL PANEL)
# =========================
def nothing(x):
    pass

cv2.namedWindow("Controls")
cv2.createTrackbar("Confidence x100", "Controls", 99, 100, nothing)
cv2.createTrackbar("Exit (0/1)", "Controls", 0, 1, nothing)

print("Камера запущена. Нажми 'q' для выхода.")

# =========================
# 7. MAIN LOOP
# =========================
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # GUI values
    conf_thres = cv2.getTrackbarPos("Confidence x100", "Controls") / 100.0
    exit_flag = cv2.getTrackbarPos("Exit (0/1)", "Controls")

    if exit_flag == 1:
        Base_Write(total_count)
        break

    # =========================
    # YOLO TRACKING
    # =========================
    results = model.track(
        frame,
        persist=True,
        conf=0.25,
        iou=0.45,
        imgsz=640,
        tracker="bytetrack.yaml",
        device="0",
        verbose=False
    )

    for r in results:
        if r.boxes is None or r.boxes.id is None:
            continue

        boxes = r.boxes.xyxy.cpu().numpy()
        ids = r.boxes.id.cpu().numpy().astype(int)
        confs = r.boxes.conf.cpu().numpy()

        for box, tid, conf in zip(boxes, ids, confs):

            # динамический фильтр из GUI
            if conf < conf_thres:
                continue

            x1, y1, x2, y2 = map(int, box)
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

            # ROI check
            if rx <= cx <= rx2 and ry <= cy <= ry2:

                if tid in track_history:
                    prev_y = track_history[tid]

                    if prev_y < line_y <= cy and tid not in counted_ids:
                        total_count += 1
                        counted_ids.add(tid)

                track_history[tid] = cy

            # draw
            color = (0, 255, 0) if tid not in counted_ids else (255, 0, 255)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"ID:{tid} {conf:.2f}",
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, color, 2)

    # =========================
    # VISUALS
    # =========================
    cv2.line(frame, (rx, line_y), (rx2, line_y), (0, 0, 255), 2)
    cv2.rectangle(frame, (rx, ry), (rx2, ry2), (255, 255, 0), 1)

    # счетчик
    cv2.rectangle(frame, (10, 10), (260, 60), (0, 0, 0), -1)
    cv2.putText(frame, f"TOTAL: {total_count}",
                (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                1, (255, 255, 255), 2)

    cv2.imshow("Camera Counter (GUI)", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        Base_Write(total_count)
        break

cap.release()
cv2.destroyAllWindows()