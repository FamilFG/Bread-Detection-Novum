import cv2
import numpy as np
from ultralytics import YOLO
from final_base import *

# 1. Загрузка модели
model = YOLO("data/best.pt")

# 2. Видео
cap = cv2.VideoCapture("data/bread_video.mp4")


ret, frame = cap.read()
if not ret:
    print("Ошибка: Видео не найдено или не читается.")
    exit()

# 3. Выбор ROI (Зона интереса)
roi = cv2.selectROI("Select ROI and press ENTER", frame, False, False)
cv2.destroyAllWindows()

rx, ry, rw, rh = map(int, roi)
rx2, ry2 = rx + rw, ry + rh
line_y = ry + int(rh * 0.5)

cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

# Переменные для счета
track_history = {} 
counted_ids = set() 
total_count = 0

print("Обработка запущена. Нажмите 'q' для выхода.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # 4. Трекинг с ускорением (imgsz=640 и stream=True)
    results = model.track(
        frame,
        persist=True,
        conf=0.25,        # Базовый порог для трекера
        iou=0.45,
        imgsz=640,        # РЕЗКО УСКОРЯЕТ РАБОТУ
        tracker="bytetrack.yaml",
        device="0",       # Если есть NVIDIA GPU
        verbose=False,
        stream=True       # Экономит память и ускоряет поток
    )

    # В режиме stream=True 'results' — это генератор, поэтому используем цикл
    for r in results:
        if r.boxes is not None and r.boxes.id is not None:
            boxes = r.boxes.xyxy.cpu().numpy()
            ids = r.boxes.id.cpu().numpy().astype(int)
            confs = r.boxes.conf.cpu().numpy()

            for box, tid, conf in zip(boxes, ids, confs):
                
                # СТРОГИЙ ФИЛЬТР УВЕРЕННОСТИ 97%
                if conf < 0.99:
                    continue
                
                x1, y1, x2, y2 = map(int, box)
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

                # Проверка ROI и линии счета
                if rx <= cx <= rx2 and ry <= cy <= ry2:
                    if tid in track_history:
                        prev_y = track_history[tid]
                        # Считаем проход сверху вниз
                        if prev_y < line_y <= cy and tid not in counted_ids:
                            total_count += 1
                            counted_ids.add(tid)
                    
                    track_history[tid] = cy

                # Отрисовка только уверенных объектов
                color = (0, 255, 0) if tid not in counted_ids else (255, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                # Текст с ID и уверенностью
                label = f"ID:{tid} {conf:.2f}"
                cv2.putText(frame, label, (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    # 5. Визуальный интерфейс
    # Линия счета
    cv2.line(frame, (rx, line_y), (rx2, line_y), (0, 0, 255), 2)
    # Рамка ROI (необязательно, для отладки)
    cv2.rectangle(frame, (rx, ry), (rx2, ry2), (255, 255, 0), 1)
    
    # Счетчик на экране
    cv2.rectangle(frame, (10, 10), (250, 60), (0, 0, 0), -1)
    cv2.putText(frame, f"TOTAL: {total_count}", (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    cv2.imshow("Fast Counter 97% Conf", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        Base_Write(total_count)
        break

cap.release()
cv2.destroyAllWindows()
