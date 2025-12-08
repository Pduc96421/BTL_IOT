"""
serverAi.py

AI Server cho:
- ĐĂNG KÝ KHUÔN MẶT từ video (frame base64)
- GỬI EMBEDDING để Node nhận diện tự động

Namespace Socket.IO: /ai

Node -> Python:
  - "start_register": { name }
  - "frame": { image: "<base64_jpeg>" }

Python -> Node:
  - "register_progress": { name, current, total, no_face? }
  - "register_result": { name, embedding }
  - "recognize_embedding": { embedding }  (hoặc embedding = None khi không thấy mặt)
"""

import base64
import io
import numpy as np
from PIL import Image

import torch
from facenet_pytorch import MTCNN, InceptionResnetV1
import socketio

# ==============================
# 1. Khởi tạo model
# ==============================

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("[AI] Using device:", device)

mtcnn = MTCNN(
    image_size=160,
    margin=20,
    min_face_size=40,
    thresholds=[0.6, 0.7, 0.7],
    post_process=True,
    device=device,
)

resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)
print("[AI] MTCNN & InceptionResnetV1 initialized")

# ==============================
# 2. Trạng thái đăng ký
# ==============================

REGISTERING = False
REGISTER_NAME = ""
REGISTER_EMBS: list[np.ndarray] = []
MAX_REGISTER_FRAMES = 20  # thu ít cho nhanh test, sau muốn thì tăng

# ==============================
# 3. Hàm convert base64 -> embedding
# ==============================


def embedding_from_base64_jpeg(b64_str: str):
    try:
        img_bytes = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        frame = np.array(img)  # (H, W, 3), RGB

        faces, probs = mtcnn(frame, return_prob=True)
        if faces is None:
            return None

        if faces.ndim == 3:
            faces = faces.unsqueeze(0)

        with torch.no_grad():
            embs = resnet(faces.to(device)).cpu().numpy()

        return embs[0]  # lấy mặt đầu tiên
    except Exception as e:
        print("[ERROR] embedding_from_base64_jpeg:", e)
        return None


# ==============================
# 4. Socket.IO client
# ==============================

sio = socketio.Client()
NODE_SOCKET_URL = "http://localhost:8080"  # không có /ai


@sio.event(namespace="/ai")
def connect():
    print("[SOCKET] Connected to /ai at", NODE_SOCKET_URL)


@sio.event(namespace="/ai")
def disconnect():
    print("[SOCKET] Disconnected from /ai")


# --------- ĐĂNG KÝ KHUÔN MẶT TỪ VIDEO ---------


@sio.on("start_register", namespace="/ai")
def on_start_register(data):
    global REGISTERING, REGISTER_NAME, REGISTER_EMBS
    name = data.get("name")
    if not name:
        print("[AI] start_register: thiếu name")
        return

    REGISTERING = True
    REGISTER_NAME = name
    REGISTER_EMBS = []
    print(f"[AI] BẮT ĐẦU đăng ký cho: {REGISTER_NAME}")


@sio.on("frame", namespace="/ai")
def on_frame(data):
    """
    Node gửi frame base64 từ ESP32 liên tục.
    - Nếu đang REGISTERING -> gom frame để đăng ký.
    - Nếu KHÔNG -> trích embedding và gửi cho Node để nhận diện tự động.
    """
    global REGISTERING, REGISTER_NAME, REGISTER_EMBS

    b64_img = data.get("image")
    if not b64_img:
        print("[AI] frame: thiếu image")
        return

    chip_cam_id = data.get("chip_cam_id")

    emb = embedding_from_base64_jpeg(b64_img)

    # ====== KHÔNG THẤY MẶT ======
    if emb is None:
        # print("[AI] Không trích được embedding (không thấy mặt?)")

        if REGISTERING:
            # Báo cho React biết là KHÔNG thấy mặt khi đang đăng ký
            sio.emit(
                "register_progress",
                {
                    "name": REGISTER_NAME,
                    "current": len(REGISTER_EMBS),
                    "total": MAX_REGISTER_FRAMES,
                    "no_face": True,
                },
                namespace="/ai",
            )
        else:
            # Báo cho Node để nó đẩy 'NoFace' về React
            sio.emit(
                "recognize_embedding",
                {"embedding": None},
                namespace="/ai",
            )
        return

    # ====== CÓ MẶT ======

    # --- MODE ĐĂNG KÝ ---
    if REGISTERING:
        REGISTER_EMBS.append(emb)
        current = len(REGISTER_EMBS)
        print(f"[AI] Collected {current}/{MAX_REGISTER_FRAMES} for {REGISTER_NAME}")

        # gửi tiến độ về Node (no_face = False)
        sio.emit(
            "register_progress",
            {
                "name": REGISTER_NAME,
                "current": current,
                "total": MAX_REGISTER_FRAMES,
                "no_face": False,
            },
            namespace="/ai",
        )

        if current >= MAX_REGISTER_FRAMES:
            mean_emb = np.mean(REGISTER_EMBS, axis=0)

            # gửi embedding về Node để lưu DB
            sio.emit(
                "register_result",
                {
                    "name": REGISTER_NAME,
                    "embedding": mean_emb.tolist(),
                },
                namespace="/ai",
            )

            print(
                f"[AI] DONE register for {REGISTER_NAME}, sent register_result to Node"
            )

            REGISTERING = False
            REGISTER_NAME = ""
            REGISTER_EMBS = []

        return

    # --- MODE NHẬN DIỆN TỰ ĐỘNG ---
    sio.emit(
        "recognize_embedding",
        {"embedding": emb.tolist(), "chip_cam_id": chip_cam_id},
        namespace="/ai",
    )


def main():
    try:
        sio.connect(NODE_SOCKET_URL, namespaces=["/ai"])
        print("[AI] serverAi.py is running, waiting for events...")
        sio.wait()
    except Exception as e:
        print("[ERROR] Cannot connect to Node:", e)


if __name__ == "__main__":
    main()
