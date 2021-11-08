// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./Ihouse.sol";

interface IHouseOfReserveState is IHouse.sol {

    /**
     * @dev Returns the collateralizationRatio of a HouseOfReserve.
     */
    function collaterizationRatio() external view returns(Factor);

    /**
     * @dev Returns the reserveAsset of this HouseOfReserve.
     */
    function reserveAsset() external view returns(address);

    /**
     * @dev Returns the backedAsset of this HouseOfReserve.
     */
    function backedAsset() external view returns(address);

    /**
     * @dev Returns the tokenID{AssetsAccountant} of the reserveAsset in HouseOfReserve.
     */
    function tokenID() external view returns(uint);

}