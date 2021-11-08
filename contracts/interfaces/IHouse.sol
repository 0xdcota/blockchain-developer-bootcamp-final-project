// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IHouse {

    struct Factor{
        uint numerator;
        uint denominator;
    }

    /**
    * @dev Returns the type of House Contract.
    */
    function HOUSE_TYPE() external returns(bytes32);
}