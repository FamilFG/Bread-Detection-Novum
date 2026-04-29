from ultralytics import YOLO
import cv2
import numpy as np

model = YOLO("runs/segment/train/weights/best.pt")

cap = cv2.VideoCapture("bread_video.mp4")

ret, frame = cap.read()
if not ret:
    exit()

roi = cv2.selectROI("Select ROI", frame, False, False)
cv2.destroyAllWindows()

rx, ry, rw, rh = map(int, roi)
rx2, ry2 = rx + rw, ry + rh

zone_top = ry + int(rh * 0.45)
zone_bottom = ry + int(rh * 0.55)

cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

track_data = {}
total = 0

class Kalman2D:
    def __init__(self):
        self.kf = cv2.KalmanFilter(4, 2)
        self.kf.transitionMatrix = np.array([
            [1,0,1,0],
            [0,1,0,1],
            [0,0,1,0],
            [0,0,0,1]
        ], np.float32)

        self.kf.measurementMatrix = np.eye(2, 4, dtype=np.float32)
        self.kf.processNoiseCov = np.eye(4, dtype=np.float32) * 0.03

    def update(self, x, y):
        meas = np.array([[np.float32(x)], [np.float32(y)]])
        self.kf.correct(meas)
        pred = self.kf.predict()
        return float(pred[0][0]), float(pred[1][0])

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model.track(
        frame,
        persist=True,
        conf=0.15,
        iou=0.5,
        tracker="bytetrack.yaml",
        device="cpu",
        verbose=False
    )

    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        ids = results[0].boxes.id.cpu().numpy().astype(int)

        for box, tid in zip(boxes, ids):
            x1, y1, x2, y2 = map(int, box)

            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            inside_roi = (rx <= cx <= rx2) and (ry <= cy <= ry2)

            if not inside_roi:
                continue

            if tid not in track_data:
                track_data[tid] = {
                    "kalman": Kalman2D(),
                    "history": [],
                    "counted": False
                }

            kx, ky = track_data[tid]["kalman"].update(cx, cy)

            hist = track_data[tid]["history"]
            hist.append(ky)
            if len(hist) > 10:
                hist.pop(0)

            speed = hist[-1] - hist[0] if len(hist) > 1 else 0

            if (not track_data[tid]["counted"] and
                ry <= ky <= ry2 and
                zone_top <= ky <= zone_bottom and
                speed > 2):

                total += 1
                track_data[tid]["counted"] = True

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
            cv2.circle(frame, (int(kx), int(ky)), 3, (0,255,255), -1)

    cv2.rectangle(frame, (rx, ry), (rx2, ry2), (255,0,0), 2)
    cv2.rectangle(frame, (rx, zone_top), (rx2, zone_bottom), (0,0,255), 2)

    cv2.putText(frame, f"COUNT: {total}", (30,50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,255), 3)

    cv2.imshow("ROI Stable Counter", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()