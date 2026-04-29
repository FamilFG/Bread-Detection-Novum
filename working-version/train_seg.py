from ultralytics import YOLO

model = YOLO("yolov8s-seg.pt")

model.train(
    data="data.yaml",
    epochs=60,
    imgsz=960,
    batch=8,
    workers=4,
    device=0
)