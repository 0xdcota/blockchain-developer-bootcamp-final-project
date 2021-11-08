// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./Ihouse.sol";

interface IHouseOfReserve is IHouse.sol {

    /**
     * @dev Returns the reserveAsset of a HouseOfReserve.
     */
    function reserveAsset() external returns(address);

    /**
     * @dev Returns the tokenID{AssetsAccountant} of the reserveAsset in HouseOfReserve.
     */
    function tokenID() external returns(uint);

}