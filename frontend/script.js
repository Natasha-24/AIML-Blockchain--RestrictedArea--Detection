  <script>
        const CONTRACT_ADDRESS = '0x029Eb21a92570aAD662513B55deDD7771eeC1cCC';
        const CONTRACT_ABI = [
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "alertId",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "alertType",
                        "type": "string"
                    },
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "alertHash",
                        "type": "string"
                    },
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "cameraId",
                        "type": "string"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "name": "AlertStored",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "_alertType",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "_alertHash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "_cameraId",
                        "type": "string"
                    }
                ],
                "name": "storeAlert",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "alerts",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "alertType",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "alertHash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "cameraId",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    }
                ],
                "name": "getAlert",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTotalAlerts",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        let provider;
        let signer;
        let contract;
        let userAddress;

        // DOM Elements
        const connectBtn = document.getElementById('connectBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const walletError = document.getElementById('walletError');
        const mainContent = document.getElementById('mainContent');
        const totalAlerts = document.getElementById('totalAlerts');
       
        // Store Alert Elements
        const alertTypeInput = document.getElementById('alertTypeInput');
        const alertHashInput = document.getElementById('alertHashInput');
        const cameraIdInput = document.getElementById('cameraIdInput');
        const storeBtn = document.getElementById('storeBtn');
        const storeError = document.getElementById('storeError');
        const storeSuccess = document.getElementById('storeSuccess');
       
        // Fetch Alert Elements
        const alertIdInput = document.getElementById('alertIdInput');
        const fetchBtn = document.getElementById('fetchBtn');
        const fetchError = document.getElementById('fetchError');
        const fetchSuccess = document.getElementById('fetchSuccess');
        const alertDetailsSection = document.getElementById('alertDetailsSection');
        const alertDetailsBody = document.getElementById('alertDetailsBody');
        const loadingIndicator = document.getElementById('loadingIndicator');

        // Connect Wallet Function
        async function connectWallet() {
            try {
                if (typeof window.ethereum === 'undefined') {
                    showError(walletError, 'MetaMask is not installed. Please install MetaMask extension.');
                    return false;
                }

                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAddress = accounts[0];

                // Create provider and signer
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();

                // Check if connected to Sepolia
                const network = await provider.getNetwork();
                if (network.chainId !== 11155111) {
                    showError(walletError, 'Please connect to Sepolia Testnet in MetaMask.');
                    return false;
                }

                // Create contract instance
                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

                console.log('Connected:', userAddress);
                return userAddress;

            } catch (error) {
                console.error('Connection error:', error);
                showError(walletError, 'Failed to connect: ' + error.message);
                return false;
            }
        }

        // Get Total Alerts Function
        async function getTotalAlertsCount() {
            try {
                if (!contract) {
                    console.error('Contract not initialized');
                    return null;
                }

                const total = await contract.getTotalAlerts();
                console.log('Total Alerts:', total.toString());
                return total.toString();

            } catch (error) {
                console.error('Error getting total alerts:', error);
                return null;
            }
        }

        // Store Alert Function
        async function storeAlert(alertType, alertHash, cameraId) {
            try {
                if (!contract) {
                    showError(storeError, 'Please connect wallet first!');
                    return false;
                }

                showLoading();
                hideError(storeError);
                hideSuccess(storeSuccess);

                // Call the smart contract function
                const tx = await contract.storeAlert(alertType, alertHash, cameraId);
               
                showSuccess(storeSuccess, 'Transaction submitted! Waiting for confirmation...');
               
                // Wait for transaction confirmation
                const receipt = await tx.wait();
               
                console.log('Transaction confirmed:', receipt);
                showSuccess(storeSuccess, 'Alert stored successfully on blockchain! 🎉');
               
                // Refresh total alerts count
                await loadTotalAlerts();
               
                // Clear form
                alertTypeInput.value = '';
                alertHashInput.value = '';
                cameraIdInput.value = '';
               
                hideLoading();
                return true;

            } catch (error) {
                console.error('Error storing alert:', error);
               
                if (error.code === 4001) {
                    showError(storeError, 'Transaction rejected by user.');
                } else if (error.code === -32603) {
                    showError(storeError, 'Internal error. Please check your wallet has enough ETH for gas.');
                } else {
                    showError(storeError, 'Failed to store alert: ' + error.message);
                }
               
                hideLoading();
                return false;
            }
        }

        // Get Alert Function
        async function getAlert(alertId) {
            try {
                if (!contract) {
                    showError(fetchError, 'Please connect wallet first!');
                    return null;
                }

                const alert = await contract.getAlert(alertId);
               
                // Parse the response
                const alertData = {
                    id: alertId,
                    alertType: alert[0],
                    alertHash: alert[1],
                    cameraId: alert[2],
                    timestamp: alert[3]
                };

                console.log('Alert Data:', alertData);
                return alertData;

            } catch (error) {
                console.error('Error getting alert:', error);
                throw error;
            }
        }

        // Connect MetaMask Button Event
        connectBtn.addEventListener('click', async () => {
            const address = await connectWallet();
           
            if (address) {
                // Update UI
                walletAddress.textContent = address.substring(0, 6) + '...' + address.substring(38);
                walletInfo.classList.remove('hidden');
                connectBtn.textContent = 'Connected ✓';
                connectBtn.disabled = true;
                mainContent.classList.remove('hidden');
                hideError(walletError);

                // Load total alerts
                await loadTotalAlerts();
            }
        });

        // Store Alert Button Event
        storeBtn.addEventListener('click', async () => {
            const alertType = alertTypeInput.value.trim();
            const alertHash = alertHashInput.value.trim();
            const cameraId = cameraIdInput.value.trim();

            if (!alertType || !alertHash || !cameraId) {
                showError(storeError, 'Please fill in all fields.');
                return;
            }

            await storeAlert(alertType, alertHash, cameraId);
        });

        // Load total alerts
        async function loadTotalAlerts() {
            try {
                showLoading();
                const total = await getTotalAlertsCount();
                if (total !== null) {
                    totalAlerts.textContent = total;
                } else {
                    totalAlerts.textContent = 'Error';
                }
                hideLoading();
            } catch (error) {
                console.error('Error loading total alerts:', error);
                totalAlerts.textContent = 'Error';
                hideLoading();
            }
        }

        // Fetch alert details
        fetchBtn.addEventListener('click', async () => {
            const alertId = alertIdInput.value;

            if (alertId === '' || alertId < 0) {
                showError(fetchError, 'Please enter a valid alert ID.');
                return;
            }

            try {
                showLoading();
                hideError(fetchError);
                hideSuccess(fetchSuccess);

                const alertData = await getAlert(alertId);

                if (alertData) {
                    // Display alert details
                    displayAlertDetails(alertData);
                    showSuccess(fetchSuccess, 'Alert fetched successfully!');
                }
               
                hideLoading();
            } catch (error) {
                console.error('Error fetching alert:', error);
                showError(fetchError, 'Failed to fetch alert. Please check the Alert ID or ensure alerts exist.');
                alertDetailsSection.classList.add('hidden');
                hideLoading();
            }
        });

        // Display alert details in table
        function displayAlertDetails(alert) {
            const date = new Date(alert.timestamp.toNumber() * 1000);
            const formattedDate = date.toLocaleString();

            alertDetailsBody.innerHTML = `
                <tr>
                    <td><strong>Alert ID</strong></td>
                    <td>${alert.id}</td>
                </tr>
                <tr>
                    <td><strong>Alert Type</strong></td>
                    <td>${alert.alertType || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Alert Hash</strong></td>
                    <td style="word-break: break-all;">${alert.alertHash || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Camera ID</strong></td>
                    <td>${alert.cameraId || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Timestamp (Unix)</strong></td>
                    <td>${alert.timestamp.toString()}</td>
                </tr>
                <tr>
                    <td><strong>Timestamp (Human)</strong></td>
                    <td>${formattedDate}</td>
                </tr>
            `;

            alertDetailsSection.classList.remove('hidden');
        }

        // Helper functions
        function showError(element, message) {
            element.textContent = message;
            element.classList.remove('hidden');
        }

        function hideError(element) {
            element.classList.add('hidden');
        }

        function showSuccess(element, message) {
            element.textContent = message;
            element.classList.remove('hidden');
        }

        function hideSuccess(element) {
            element.classList.add('hidden');
        }

        function showLoading() {
            loadingIndicator.classList.remove('hidden');
        }

        function hideLoading() {
            loadingIndicator.classList.add('hidden');
        }

        // Handle account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    // User disconnected
                    location.reload();
                } else {
                    // User switched accounts
                    location.reload();
                }
            });

            window.ethereum.on('chainChanged', () => {
                location.reload();
            });
        }
    </script>
