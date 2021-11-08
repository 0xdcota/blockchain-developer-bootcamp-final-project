// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./IHouse.sol";

interface IHouseOfCoinState is IHouse {

    /**
    * @dev Returns the backedAsset that is minted by this HouseOfCoin.
    */
    function backedAsset() external view returns(address);

}