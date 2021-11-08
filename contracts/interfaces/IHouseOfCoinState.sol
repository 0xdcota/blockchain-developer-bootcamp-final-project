// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

interface IHouseOfCoinState {

    struct Factor{
        uint numerator;
        uint denominator;
    }

    /**
    * @dev Returns the type of House Contract.
    */
    function HOUSE_TYPE() external returns(bytes32);

    /**
    * @dev Returns the backedAsset that is minted by this HouseOfCoin.
    */
    function backedAsset() external view returns(address);

}