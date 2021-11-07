// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The HouseOfCoinMinting contract allows users with acceptable reserves to mint backedAsset.

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/IAssetsAccountant.sol";

contract HouseOfCoinMintingState {

    address public backedAsset;

    uint public tokenID;

    address public assetsAccountant;

}

contract HouseOfCoinMinting is Initializable, HouseOfCoinMintingState {

    // HouseOfCoinMinting Events


    function initialize(
        address _backedAsset,
        address _assetsAccountant
    ) public initializer() 
    {
        backedAsset = _backedAsset;
        tokenID = uint(keccak256(abi.encodePacked(backedAsset, "backedAsset")));
        assetsAccountant = _assetsAccountant;
    }

    function mintWithReserveAsset(address reserveAssetToUse, uint amountOfBackedAssetToMint) public returns (bool) {
        // Validate reserveAsset.
        require(
            IAssetsAccountantState(assetsAccountant).houseOfReserveForAsset(reserveAssetToUse) != address(0),
            "Not valid reserveAsset!"
        );

        // Check if msg.sender has enough reserveAsset to mint amount.

        // Generate tokenId for AssetAccountant

        // Mint in AssetsAccountant amount.

    }


}