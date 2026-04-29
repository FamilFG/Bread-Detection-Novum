import cv2
import numpy as np
from ultralytics import YOLO

model = YOLO("runs/segment/train/weights/best.pt")

VIDEO_PATH = "bread_video.mp4"

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Video not found!")
    exit()

line_y = 400
count = 0
track_memory = set()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model.track(frame, persist=True, imgsz=960, conf=0.25, verbose=False, device='cpu')

    annotated = results[0].plot()

    cv2.line(annotated, (0, line_y), (annotated.shape[1], line_y), (0, 0, 255), 3)

    if results[0].boxes is not None and results[0].boxes.id is not None:
        ids = results[0].boxes.id.cpu().numpy()
        boxes = results[0].boxes.xyxy.cpu().numpy()

        for track_id, box in zip(ids, boxes):
            x1, y1, x2, y2 = box
            center_y = int((y1 + y2) / 2)

            if center_y > line_y and track_id not in track_memory:
                track_memory.add(track_id)
                count += 1

    cv2.putText(
        annotated,
        f"COUNT: {count}",
        (30, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        2,
        (0, 255, 0),
        4
    )

    cv2.imshow("Bread Counter", annotated)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

print("Final Count:", count)