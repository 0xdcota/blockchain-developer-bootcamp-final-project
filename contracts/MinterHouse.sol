// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The MinterHouse contract allows users with acceptable reserves to mint backedAsset. 

contract MinterHouse {

    address public backedAsset;

    function mintWithReserveAsset(address reserveAsset, uint amount) public returns (bool) {
        // Validate reserveAsset and amount inputs.

        // Check if msg.sender has enough reserveAsset to mint amount.

        // Generate tokenId for AssetAccountant

        // Mint in AssetsAccountant amount.

    }

    function _generateTokenID(address reserveAsset) internal view returns(uint) {
        return uint(keccak256(abi.encodePacked(backedAsset, reserveAsset, "backed underlying")));

    }

}