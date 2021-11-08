// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IHouse {

    /**
    * @dev Returns the type of House Contract.
    */
    function HOUSE_TYPE() external returns(bytes32);
}