"""
Demo nhận diện khuôn mặt bằng webcam laptop
- Phát hiện khuôn mặt bằng MTCNN
- Trích xuất embedding bằng InceptionResnetV1 (FaceNet)
- Lưu / đọc database khuôn mặt từ file faces_db.pkl

Cách dùng:
1) Đăng ký khuôn mặt mới:
   python face_recognition_demo.py --mode register --name "Bao"

2) Nhận diện realtime:
   python face_recognition_demo.py --mode recognize
"""

import cv2
import torch
import numpy as np
import pickle
import os
import argparse
from facenet_pytorch import MTCNN, InceptionResnetV1

DB_PATH = "faces_db.pkl"


# ============================================================
# 1. Hàm tiện ích lưu / đọc database embedding
# ============================================================

def load_database(db_path=DB_PATH):
    """Đọc file database (dict: name -> embedding trung bình)"""
    if os.path.exists(db_path):
        with open(db_path, "rb") as f:
            db = pickle.load(f)
        print(f"[INFO] Đã load database, có {len(db)} người.")
    else:
        db = {}
        print("[INFO] Chưa có database, sẽ tạo mới.")
    return db


def save_database(db, db_path=DB_PATH):
    """Lưu dict vào file"""
    with open(db_path, "wb") as f:
        pickle.dump(db, f)
    print(f"[INFO] Đã lưu database ({len(db)} người) vào {db_path}")


# ============================================================
# 2. Khởi tạo model MTCNN + FaceNet
# ============================================================

def init_models(device):
    """
    Khởi tạo:
    - MTCNN: phát hiện và crop mặt từ ảnh
    - InceptionResnetV1: trích xuất embedding 512 chiều
    """
    print(f"[INFO] Dùng device: {device}")
    mtcnn = MTCNN(
        image_size=160,  # kích thước đầu vào cho FaceNet
        margin=20,       # margin xung quanh mặt
        min_face_size=40,
        thresholds=[0.6, 0.7, 0.7],
        post_process=True,
        device=device
    )

    resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    print("[INFO] Đã khởi tạo MTCNN + InceptionResnetV1")
    return mtcnn, resnet


# ============================================================
# 3. Hàm trích xuất embedding từ một frame
# ============================================================

def get_face_embeddings_from_frame(frame_bgr, mtcnn, resnet, device):
    """
    Từ một frame BGR (opencv), dùng MTCNN crop các mặt,
    sau đó dùng resnet để lấy embedding.

    Trả về:
    - embeddings: tensor shape (num_faces, 512)
    - boxes: ndarray (num_faces, 4) hoặc None
    """
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    faces, probs = mtcnn(frame_rgb, return_prob=True)

    # Không thấy mặt nào
    if faces is None:
        return None, None

    # Nếu chỉ có 1 mặt, faces sẽ là tensor 3D (3, 160, 160) -> thêm chiều batch
    if faces.ndim == 3:
        faces = faces.unsqueeze(0)

    # Tính embedding cho từng mặt
    embeddings = resnet(faces.to(device)).detach().cpu()

    # Lấy boxes từ MTCNN.detect
    boxes, _ = mtcnn.detect(frame_rgb)

    return embeddings, boxes


# ============================================================
# 4. Tính khoảng cách giữa embedding mới và database
# ============================================================

def cosine_similarity(a, b):
    """Tính cosine similarity giữa 2 vector numpy"""
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)
    return np.dot(a, b)


def find_best_match(embedding, db, threshold=0.6):
    """
    embedding: vector numpy (512,)
    db: dict name -> embedding numpy (512,)
    threshold: ngưỡng cosine similarity (0..1), càng gần 1 càng giống

    Trả về:
    - best_name: tên người khớp nhất hoặc "Unknown"
    - best_score: điểm similarity
    """
    if len(db) == 0:
        return "Unknown", 0.0

    best_name = "Unknown"
    best_score = -1.0

    for name, emb_ref in db.items():
        score = cosine_similarity(embedding, emb_ref)
        if score > best_score:
            best_score = score
            best_name = name

    if best_score < threshold:
        best_name = "Unknown"

    return best_name, best_score


# ============================================================
# 5. Chế độ đăng ký khuôn mặt
# ============================================================

def register_new_face(name, device):
    """
    Đăng ký khuôn mặt mới:
    - Mở webcam
    - Lấy N frame có mặt, trích embedding
    - Lấy trung bình embedding và lưu vào database
    """
    db = load_database()
    if name in db:
        print(f"[WARNING] Tên '{name}' đã có trong database, sẽ ghi đè.")

    mtcnn, resnet = init_models(device)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[ERROR] Không mở được webcam.")
        return

    print("[INFO] Nhấn 's' để bắt đầu ghi khuôn mặt, 'q' để thoát.")
    embedding_list = []
    collecting = False
    num_target = 20  # số frame muốn thu thập

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        text = f"Name: {name} | Collected: {len(embedding_list)}/{num_target}"
        cv2.putText(frame, text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        if collecting:
            embeddings, boxes = get_face_embeddings_from_frame(
                frame, mtcnn, resnet, device
            )
            if embeddings is not None and boxes is not None:
                # Chỉ lấy mặt đầu tiên
                emb = embeddings[0].numpy()
                embedding_list.append(emb)

                # Vẽ bbox cho vui
                x1, y1, x2, y2 = boxes[0].astype(int)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

                if len(embedding_list) >= num_target:
                    print("[INFO] Đã đủ số frame, dừng ghi.")
                    collecting = False

        cv2.imshow("Register - press 's' to start, 'q' to quit", frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('s'):
            print("[INFO] Bắt đầu thu thập khuôn mặt...")
            embedding_list = []
            collecting = True
        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if len(embedding_list) == 0:
        print("[INFO] Không thu được embedding nào, không lưu.")
        return

    # Lấy trung bình embedding
    mean_embedding = np.mean(embedding_list, axis=0)
    db[name] = mean_embedding
    save_database(db)
    print(f"[INFO] Đăng ký khuôn mặt cho '{name}' thành công.")


# ============================================================
# 6. Chế độ nhận diện realtime
# ============================================================

def recognize_realtime(device):
    """
    Nhận diện realtime:
    - Load database
    - Mở webcam
    - Mỗi frame: phát hiện mặt, trích embedding, so sánh với db
    """
    db = load_database()
    mtcnn, resnet = init_models(device)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Không mở được webcam.")
        return

    print("[INFO] Nhấn 'q' để thoát.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        embeddings, boxes = get_face_embeddings_from_frame(
            frame, mtcnn, resnet, device
        )

        if embeddings is not None and boxes is not None:
            for emb, box in zip(embeddings, boxes):
                if box is None:
                    continue
                emb_np = emb.numpy()
                name, score = find_best_match(emb_np, db, threshold=0.6)

                x1, y1, x2, y2 = box.astype(int)
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                label = f"{name} ({score:.2f})"
                cv2.putText(frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        cv2.imshow("Face Recognition - press 'q' to quit", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


# ============================================================
# 7. Hàm main + CLI
# ============================================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="Demo nhận diện khuôn mặt bằng webcam."
    )
    parser.add_argument(
        "--mode",
        type=str,
        required=True,
        choices=["register", "recognize"],
        help="Chế độ chạy: 'register' (đăng ký) hoặc 'recognize' (nhận diện)."
    )
    parser.add_argument(
        "--name",
        type=str,
        default=None,
        help="Tên người dùng khi đăng ký khuôn mặt."
    )
    parser.add_argument(
        "--cpu",
        action="store_true",
        help="Bắt buộc dùng CPU (mặc định nếu không có GPU)."
    )
    return parser.parse_args()


def main():
    args = parse_args()
    device = torch.device("cuda:0" if torch.cuda.is_available() and not args.cpu else "cpu")

    if args.mode == "register":
        if not args.name:
            print("[ERROR] Cần truyền --name khi ở chế độ register.")
            return
        register_new_face(args.name, device)

    elif args.mode == "recognize":
        recognize_realtime(device)


if __name__ == "__main__":
    main()
# & C:/face_recognise/venv/Scripts/python.exe c:/face_recognise/face_recognition_demo.py --mode recognize
