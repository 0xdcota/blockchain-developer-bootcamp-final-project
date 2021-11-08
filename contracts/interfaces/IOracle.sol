// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IOracle {
    
    function getLastPrice() external returns(uint);

    function oraclePriceDecimals() external returns(uint);
}