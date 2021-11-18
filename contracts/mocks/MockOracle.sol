// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

/**
* @title Mock Oracle contract used for testing.
*/

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockOracleState{

    string public trackingAssetSymbol;

    uint internal lastPrice;

    uint public oraclePriceDecimals;

    uint public lastTimestampUpdate;

}

contract MockOracle is Ownable, MockOracleState {

    constructor (
        string memory _trackingassetSymbol,
        uint _oraclePriceDecimals
    ) {
        trackingAssetSymbol = _trackingassetSymbol;
        oraclePriceDecimals = _oraclePriceDecimals;
    }

    function getLastPrice() external view returns(uint){
        return lastPrice;
    }

    function setPrice(uint newPrice) external onlyOwner {
        lastPrice = newPrice;
        lastTimestampUpdate = block.timestamp;
    }
     
}