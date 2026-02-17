# AIML Blockchain Restricted Area Detection
A real-time restricted area monitoring system that detects loitering and group formation using computer vision and stores alert hashes on a blockchain for secure record keeping.

---
## Overview
This project monitors a restricted area in real time using a camera feed.
It detects:
1. Loitering inside a restricted zone
2. Group formation inside the same zone
When suspicious activity is detected, an alert is generated, hashed using SHA-256, and recorded for integrity verification. The alert hash is stored on a blockchain using a Solidity smart contract.

---
## Working
1. A webcam feed is processed frame by frame.
2. YOLOv8 detects people in the frame.
3. A centroid tracker assigns a unique ID to each person.
4. If a person stays inside the restricted area longer than a defined threshold, a loitering alert is generated.
5. If multiple people stay close together for a defined duration inside the restricted area, a group formation alert is generated.
6. The generated alert is secured using a hash-linked blockchain record, saved locally, and can be stored on-chain for tamper-proof verification.
7. The AlertHashRegistry smart contract was deployed using Remix IDE, and MetaMask was used to sign and send transactions that store alert hashes on the blockchain.

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

---
## Installation
```bash
pip install -r requirements.txt
python backend/main.py

---
## Project Structure
backend/
│
├── main.py
├── centroidtracker.py
│
blockchain/
│
├── contracts/
│   └── AlertHashRegistry.sol
│
requirements.txt
README.md
