// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AlertHashRegistry {

    struct Alert {
        string alertType;
        string alertHash;
        string cameraId;
        uint256 timestamp;
    }

    Alert[] public alerts;

    event AlertStored(
        uint256 indexed alertId,
        string alertType,
        string alertHash,
        string cameraId,
        uint256 timestamp
    );

    function storeAlert(
        string memory _alertType,
        string memory _alertHash,
        string memory _cameraId
    ) public {
        alerts.push(
            Alert({
                alertType: _alertType,
                alertHash: _alertHash,
                cameraId: _cameraId,
                timestamp: block.timestamp
            })
        );

        emit AlertStored(
            alerts.length - 1,
            _alertType,
            _alertHash,
            _cameraId,
            block.timestamp
        );
    }

    function getAlert(uint256 _id)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256
        )
    {
        Alert memory a = alerts[_id];
        return (
            a.alertType,
            a.alertHash,
            a.cameraId,
            a.timestamp
        );
    }

    function getTotalAlerts() public view returns (uint256) {
        return alerts.length;
    }
}
