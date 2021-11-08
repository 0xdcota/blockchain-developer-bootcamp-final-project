// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IHouseOfReserveState {

    struct Factor{
        uint numerator;
        uint denominator;
    }

    /**
    * @dev Returns the type of House Contract.
    */
    function HOUSE_TYPE() external returns(bytes32);

    /**
     * @dev Returns the collateralizationRatio of a HouseOfReserve.
     */
    function collaterizationRatio() external view returns(Factor memory);

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