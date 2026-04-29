from ultralytics import YOLO
import cv2

model = YOLO("runs/segment/train/weights/best.pt")

cap = cv2.VideoCapture(0)

ret, frame = cap.read()
if not ret:
    print("Camera not working")
    exit()

roi_box = cv2.selectROI("Select ROI (ENTER to confirm)", frame, fromCenter=False, showCrosshair=True)
cv2.destroyWindow("Select ROI (ENTER to confirm)")

x, y, w, h = roi_box
x1, y1, x2, y2 = int(x), int(y), int(x + w), int(y + h)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    roi = frame[y1:y2, x1:x2].copy()

    results = model(roi, conf=0.6, verbose=False)

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        for box in boxes:
            bx1, by1, bx2, by2 = map(int, box)

            cv2.rectangle(frame,
                          (x1 + bx1, y1 + by1),
                          (x1 + bx2, y1 + by2),
                          (0, 255, 0), 2)

    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

    cv2.imshow("ROI Live Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()