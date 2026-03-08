# AIML Blockchain Restricted Area Detection
A real-time restricted area monitoring system that detects loitering and group formation using computer vision and stores alert hashes on a blockchain for secure record keeping.

---
## Overview
This project monitors a restricted area in real time using a camera feed.
It detects:
1. Loitering inside a restricted zone
2. Group formation inside the same zone
When suspicious activity is detected, an alert is generated, hashed using SHA-256, and recorded for integrity verification. The alert hash is stored on a blockchain using a Solidity smart contract.

In addition to software-based detection, the project also integrates an Arduino-based hardware alert system. The hardware module includes:

1. 16x2 LCD display to show alert type
2. Two LEDs to indicate loitering or group detection
3. Buzzer to generate an SOS Morse code signal on every alert

This makes the system more practical and suitable for real-time surveillance applications.

---
## Hardware Alert Integration

The system includes an Arduino Uno connected to:

1. 16x2 LCD for displaying alert messages
2. LED 1 for loitering alerts
3. LED 2 for group formation alerts
4. Buzzer for SOS Morse code audio alerts

Serial Commands Used

1. LOITER → activates loitering LED, LCD message, and buzzer
2. GROUP → activates group LED, LCD message, and buzzer
3. CLEAR → resets LEDs, LCD, and buzzer

LCD Output

1. ALERT: LOITERING
2. ALERT: GROUP DETECTED

Buzzer Behavior

The buzzer generates an SOS Morse code pattern whenever an alert is triggered.

---
## Working
1. A webcam feed is processed frame by frame.
2. YOLOv8 detects people in the frame.
3. A centroid tracker assigns a unique ID to each person.
4. If a person stays inside the restricted area longer than a defined threshold, a loitering alert is generated.
5. If multiple people stay close together for a defined duration inside the restricted area, a group formation alert is generated.
6. The generated alert is secured using a hash-linked blockchain record, saved locally, and can be stored on-chain for tamper-proof verification.
7. The AlertHashRegistry smart contract was deployed using Remix IDE, and MetaMask was used to sign and send transactions that store alert hashes on the blockchain.
8. The python script sends a serial command to Arduino
9. Arduino activates LCD display, corresponding LED and buzzer SOS signal.

---
## Technologies Used
- Python
- OpenCV
- YOLOv8 (Ultralytics)
- NumPy
- SciPy
- Solidity (Smart Contract)
- Remix IDE (Smart contract development and testing)
- MetaMask (Wallet for signing and sending blockchain transactions)
- Arduino UNO

---
## Installation

pip install -r requirements.txt
python backend/main.py

---

## Project Structure
```bash
project-root/
├── detection_system.py
├── centroidtracker.py
├── arduino_alert_system/
│   └── arduino_alert_system.ino
├── snapshots/
├── README.md
└── requirements.txt
