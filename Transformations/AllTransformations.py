# USE THIS FILE WITH dataAugmentation.py only
import cv2
import albumentations as A
import matplotlib.pyplot as plt
import numpy as np
import time


transform = A.Compose([

    A.HorizontalFlip(p=0.5),

    A.Affine(
    translate_percent=(-0.05, 0.05),  # FIX APPLIED HERE
    scale=(0.9, 1.1),
    rotate=(-10, 10),
    p=0.7
    ),

    A.Perspective(scale=(0.02, 0.05), p=0.3),

    A.RandomBrightnessContrast(p=0.6),

    A.RandomGamma(p=0.3),

    A.OneOf([
        A.GaussNoise(p=1.0),
        A.MotionBlur(p=1.0),
    ], p=0.2),

],
bbox_params=A.BboxParams(
    format='yolo',
    label_fields=['class_labels'],
    min_visibility=0.5
))

AllTransforms = [transform]
