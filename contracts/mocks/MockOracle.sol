// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockOracleState{

    string public trackingAssetSymbol;

    uint internal lastPrice;

    uint public oraclePriceDecimals;

    uint public lastTimestampUpdate;

}

contract MockOracleMethods is Initializable, Ownable, MockOracleState {

    constructor (
        string calldata _tackingassetSymbol,
        uint _oraclePriceDecimals
    ) {
        trackingAssetSymbol = _tackingassetSymbol;
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