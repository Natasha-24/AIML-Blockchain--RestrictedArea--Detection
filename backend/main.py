
import hashlib
import json
import cv2
import time
import math
from ultralytics import YOLO
from centroidtracker import CentroidTracker
from collections import defaultdict

GROUP_DISTANCE_THRESHOLD = 80   # pixels
GROUP_TIME_THRESHOLD = 5        # seconds
MIN_GROUP_SIZE = 3

group_start_time = defaultdict(float)

model = YOLO("yolov8n.pt")
tracker = CentroidTracker(maxDisappeared=40)

LOITER_TIME_THRESHOLD = 10
loitering_data = {}
alert_logged = {}
group_alert_logged = {}

# Restricted Area
RX1, RY1 = 200, 100
RX2, RY2 = 450, 350


def detect_people(frame):
    results = model(frame, conf=0.4, verbose=False)
    boxes = []

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            if int(box.cls[0]) == 0:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                boxes.append((x1, y1, x2, y2))
    return boxes


def hash_alert(alert_data):
    alert_string = json.dumps(alert_data, sort_keys=True)
    return hashlib.sha256(alert_string.encode()).hexdigest()


def inside_restricted(cx, cy):
    return RX1 <= cx <= RX2 and RY1 <= cy <= RY2


def distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)


class Block:
    def __init__(self, index, timestamp, data, previous_hash):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()


class Blockchain:
    def __init__(self):
        self.chain = []
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis = Block(0, time.time(), "Genesis Block", "0")
        self.chain.append(genesis)

    def add_block(self, data):
        previous_block = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            data=data,
            previous_hash=previous_block.hash
        )
        self.chain.append(new_block)

    def save_chain(self, filename="alert_blockchain.json"):
        with open(filename, "w") as f:
            json.dump([block.__dict__ for block in self.chain], f, indent=4)

    def log_alert_to_file(self, alert_data, block_hash, filename="alerts_log.jsonl"):
        log_entry = alert_data.copy()
        log_entry["block_hash"] = block_hash
        with open(filename, "a") as f:
            f.write(json.dumps(log_entry) + "\n")


alert_blockchain = Blockchain()

cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (640, 480))
    current_time = time.time()

    flash = int(current_time * 2) % 2
    zone_color = (0, 0, 255) if flash else (0, 0, 150)

    cv2.rectangle(frame, (RX1, RY1), (RX2, RY2), zone_color, 2)
    cv2.putText(frame, "RESTRICTED AREA",
                (RX1, RY1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6, zone_color, 2)

    boxes = detect_people(frame)

    box_centroids = []
    for (x1, y1, x2, y2) in boxes:
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)
        box_centroids.append((cx, cy, x1, y1, x2, y2))

    objects = tracker.update(boxes)

    active_people = {}

    for obj_id, (cx, cy) in objects.items():

        in_zone = inside_restricted(cx, cy)

        if in_zone:
            active_people[obj_id] = (cx, cy)

            if obj_id not in loitering_data:
                loitering_data[obj_id] = {
                    "start_time": current_time,
                    "hashed": False
                }

            elapsed = current_time - loitering_data[obj_id]["start_time"]
        else:
            loitering_data.pop(obj_id, None)
            elapsed = 0

        is_loitering = elapsed > LOITER_TIME_THRESHOLD

        min_dist = float("inf")
        matched_box = None

        for (bx, by, x1, y1, x2, y2) in box_centroids:
            d = math.hypot(cx - bx, cy - by)
            if d < min_dist:
                min_dist = d
                matched_box = (x1, y1, x2, y2)

        if matched_box is not None:
            x1, y1, x2, y2 = matched_box

            color = (0, 255, 0)
            label = f"PERSON {obj_id}"

            if is_loitering and obj_id not in alert_logged:
                alert_data = {
                    "alert_type": "LOITERING_IN_RESTRICTED_AREA",
                    "person_id": obj_id,
                    "camera_id": "CAM_01",
                    "zone": "RESTRICTED_AREA",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "duration_seconds": round(elapsed, 2)
                }

                alert_blockchain.add_block(alert_data)
                alert_blockchain.save_chain()

                alert_hash = hash_alert(alert_data)
                alert_blockchain.log_alert_to_file(alert_data, alert_hash)

                alert_logged[obj_id] = True
                loitering_data[obj_id]["hashed"] = True

                print("LOITERING ALERT GENERATED")
                print("Alert Data:", alert_data)
                print("SHA-256 Hash:", alert_hash)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label,
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6, color, 2)

        cv2.circle(frame, (cx, cy), 4, (255, 0, 0), -1)

        if is_loitering:
            cv2.putText(frame,
                        f"TIME IN ZONE: {elapsed:.1f}s",
                        (cx - 60, cy - 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 0, 255),
                        2)

            cv2.rectangle(frame, (0, 0), (640, 40), (0, 0, 255), -1)
            cv2.putText(frame,
                        "SUSPICIOUS LOITERING DETECTED",
                        (40, 28),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.9,
                        (255, 255, 255),
                        2)

    # ---------------- GROUP DETECTION ----------------
    group_members = []
    people_ids = list(active_people.keys())

    for i in range(len(people_ids)):
        for j in range(i + 1, len(people_ids)):
            p1 = active_people[people_ids[i]]
            p2 = active_people[people_ids[j]]

            if distance(p1, p2) < GROUP_DISTANCE_THRESHOLD:
                group_members.append(people_ids[i])
                group_members.append(people_ids[j])

    group_members = list(set(group_members))

    if len(group_members) >= MIN_GROUP_SIZE:

        group_key = tuple(sorted(group_members))

        if group_key not in group_start_time:
            group_start_time[group_key] = current_time

        group_duration = current_time - group_start_time[group_key]

        if group_duration > GROUP_TIME_THRESHOLD:

            cv2.putText(frame,
                        "GROUP FORMATION DETECTED",
                        (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 0, 255),
                        2)

            group_key_str = "_".join(map(str, sorted(group_members)))

            if group_key_str not in group_alert_logged:

                alert_data = {
                    "alert_type": "GROUP_FORMATION_IN_RESTRICTED_AREA",
                    "group_members": group_members,
                    "camera_id": "CAM_01",
                    "zone": "RESTRICTED_AREA",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "duration_seconds": round(group_duration, 2)
                }

                alert_blockchain.add_block(alert_data)
                alert_blockchain.save_chain()

                alert_hash = hash_alert(alert_data)
                alert_blockchain.log_alert_to_file(alert_data, alert_hash)

                group_alert_logged[group_key_str] = True

                print("GROUP FORMATION ALERT GENERATED")
                print("Alert Data:", alert_data)
                print("SHA-256 Hash:", alert_hash)

    else:
        group_start_time.clear()

    cv2.imshow("Suspicious Crowd Behaviour Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
