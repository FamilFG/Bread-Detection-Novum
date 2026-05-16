from AllTransformations import *
import os 

folder_path = r"C:/Users/User/Desktop/Projects/Projects_Python/Cv_Novum_Data_Augmentation/final_trans_dataset" # source folder
files = os.listdir(folder_path)
NumberT = 10
images = [f for f in files if f.endswith(".jpg")]

def laberTaker(boxPath):
    with open(boxPath,"r",encoding="utf-8") as f:
        line = f.read()

    cls, x, y, w, h = map(float, line.split())

    bboxes = [[x, y, w, h]]
    labels = [int(cls)]
    return bboxes, labels

def laberWriter(filename,bbox,label):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(str(int(label[0])) + " " + str(bbox[0][0])+" "+str(bbox[0][1])+" "+str(bbox[0][2])+" "+str(bbox[0][3]))


for img_name in images:

    img_path = os.path.join(folder_path, img_name)

    # Remove .jpg extension to get the matching .txt label name
    base = os.path.splitext(img_name)[0]
    txt_path = os.path.join(folder_path, base + ".txt")





    # --- image ---
    image = cv2.imread(img_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # --- labels ---
    orig_bboxes, orig_labels  = laberTaker(txt_path)

    for i in range(NumberT):

        transformed = transform(
                    image=image,
                    bboxes=orig_bboxes,
                    class_labels=orig_labels
                )

        aug_image = transformed["image"]
        aug_bboxes = transformed["bboxes"]
        aug_labels = transformed["class_labels"]

        count = int(time.time_ns())
        #Picture writer
        filenamePNG = f"C:/Users/User/Desktop/Projects/Projects_Python/Cv_Novum_Data_Augmentation/test_dataset/aug{count}.jpg" # target folder
        cv2.imwrite(filenamePNG, cv2.cvtColor(aug_image, cv2.COLOR_RGB2BGR))

        #Label writer
        filenameTXT = f"C:/Users/User/Desktop/Projects/Projects_Python/Cv_Novum_Data_Augmentation/test_dataset/aug{count}.txt"# target folder
        laberWriter(filenameTXT,aug_bboxes,aug_labels)
