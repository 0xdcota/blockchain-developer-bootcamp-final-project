// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The HouseOfCoinMinting contract:
// - allows users with acceptable reserves to mint backedAsset.
// - allows user to burn their minted asset to release their reserve.

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "./interfaces/IOracle.sol";
import "./interfaces/IAssetsAccountant.sol";
import "./interfaces/IAssetsAccountantState.sol";
import "./interfaces/IHouseOfReserveState.sol";

contract HouseOfCoinState {

    bytes32 public constant HOUSE_TYPE = keccak256("COIN_HOUSE");

    struct Factor{
        uint numerator;
        uint denominator;
    }

    address public backedAsset;

    address public assetsAccountant;

    address public oracle;
}

contract HouseOfCoin is Initializable, HouseOfCoinState {

    // HouseOfCoinMinting Events
    event CoinMinted(address indexed reserveAsset, uint amount);


    function initialize(
        address _backedAsset,
        address _assetsAccountant,
        address _oracle
    ) public initializer() 
    {
        backedAsset = _backedAsset;
        assetsAccountant = _assetsAccountant;
        oracle = _oracle;
    }

    function mintCoin(address reserveAsset, address houseOfReserve, uint amount) public {

        IHouseOfReserveState hOfReserve = IHouseOfReserveState(houseOfReserve);

        // Validate reserveAsset and houseOfReserve inputs.
        require(
            IAssetsAccountantState(assetsAccountant).houseOfReserves(reserveAsset) != address(0) &&
            hOfReserve.reserveAsset() == reserveAsset,
            "Not valid reserveAsset!"
        );

        // Checks minting power of msg.sender.
        uint mintingPower = checkMintingPower();
        require(mintingPower > 0, "Not enough reserves to mint!");

        
    }

    function burnCoin() public {

    }



    function checkMintingPower(IHouseOfReserveState hOfReserve, address reserveAsset) public view returns(uint) {
        // Need tokenIDs of botch reserves and backedAsset {AssetsAccountant}
        (uint reserveBal, uint mintedCoinBal) =  _checkBalances(
            hOfReserve.tokenID(),
            _getTokenID(reserveAsset)
        );

        // Check msg.sender has reserves
        if (reserveBal == 0) {
            return 0;
        } else {

        }

    }

    function _getTokenID(address _reserveAsset) internal view returns(uint) {
        return uint(keccak256(abi.encodePacked(backedAsset, _reserveAsset, "backedAsset")));
    }

    function _checkBalances(
        uint _reservesTokenID,
        uint _bAssetRTokenID
    ) internal view returns (uint reserveBal, uint mintedCoinBal) {

        uint[2] ids = [_reservesTokenID, _bAssetRTokenID];
        address[2] accounts = [msg.sender,msg.sender];

        uint balances = IERC1155(assetsAccountant).balanceOfBatch(accounts, ids);

        reserveBal = balances[0];
        mintedCoinBal = balances[1];
    }


}