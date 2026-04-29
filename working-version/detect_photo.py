from ultralytics import YOLO
import cv2

model = YOLO("runs/segment/train/weights/best.pt")

img = cv2.imread("frame_000009.jpg")

roi = cv2.selectROI("Select ROI", img, False, False)
cv2.destroyAllWindows()

rx, ry, rw, rh = map(int, roi)
rx2, ry2 = rx + rw, ry + rh

results = model.predict(img, conf=0.15, device="cpu", verbose=False)

count = 0

if results[0].boxes is not None:
    boxes = results[0].boxes.xyxy.cpu().numpy()

    for box in boxes:
        x1, y1, x2, y2 = map(int, box)

        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        if rx <= cx <= rx2 and ry <= cy <= ry2:
            count += 1
            cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 2)

cv2.rectangle(img, (rx, ry), (rx2, ry2), (255,0,0), 2)

cv2.putText(img, f"COUNT: {count}", (30,50),
            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,255), 3)

cv2.imshow("Image Counter", img)
cv2.waitKey(0)
cv2.destroyAllWindows()