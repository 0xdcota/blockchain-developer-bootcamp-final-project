// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

// The AssetsAccountant keeps records of all deposits, withdrawals, and minted assets by user.

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IHouseOfReserveState.sol";
import "./interfaces/IHouseOfCoinState.sol";

contract AssetsAccountantState {

    // reserveAsset address => houseOfReserve 
    mapping(address => address) public houseOfReserves;

    // backedAsset address => houseOfCoin
    mapping(address => address) public houseOfCoins;

    mapping(address => bool) internal _isARegisteredHouse;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

}

contract AssetsAccountant is ERC1155, AccessControl, AssetsAccountantState {

    // AssetsAccountant Events

    /* 
    * Emit when a HouseOfReserve is registered with AssetsAccountant
    */
    event HouseRegistered(address house, bytes32 indexed typeOfHouse, address indexed asset);

    constructor() ERC1155("") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(URI_SETTER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
    }

    function registerHouse(address houseAddress, address asset) 
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        // Check if House has been previously registered.
        require(!_isARegisteredHouse[houseAddress], "House already registered!");

        // Check type of House being registered and proceed accordingly

        if(IHouseOfReserveState(houseAddress).HOUSE_TYPE() == keccak256("RESERVE_HOUSE")) {

            IHouseOfReserveState hOfReserve = IHouseOfReserveState(houseAddress);

            // Check that asset has NOT a house address assigned
            require(houseOfReserves[asset] != address(0), "ReserveAsset already registered!");

            // Check intended asset matches House
            require(
                hOfReserve.reserveAsset() == asset,
                "Asset input does not matche reserveAsset in houseAddress!"
            );

            // Register mappings
            houseOfReserves[asset] = houseAddress;
            _isARegisteredHouse[houseAddress] = true;

            // Assign Roles
            _setupRole(MINTER_ROLE, houseAddress);
            _setupRole(BURNER_ROLE, houseAddress);

            emit HouseRegistered(houseAddress, hOfReserve.HOUSE_TYPE(), asset);
            
        } else if (IHouseOfCoinState(houseAddress).HOUSE_TYPE() == keccak256("COIN_HOUSE")) {

            IHouseOfCoinState hOfCoin = IHouseOfCoinState(houseAddress);

            // Check that asset has NOT a house address assigned
            require(houseOfCoins[asset] != address(0), "backedAsset already registered!");

            // Check intended asset matches House
            require(
                hOfCoin.backedAsset() == asset,
                "Asset input does not matche backedAsset in houseAddress!"
            );

            // Register mappings
            houseOfCoins[asset] = houseAddress;
            _isARegisteredHouse[houseAddress] = true;

            // Assign Roles
            _setupRole(MINTER_ROLE, houseAddress);
            _setupRole(BURNER_ROLE, houseAddress);

            emit HouseRegistered(houseAddress, hOfCoin.HOUSE_TYPE(), asset);

        } else {
            revert("house address type invalid!");
        }
    }

    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        external
        onlyRole(MINTER_ROLE)
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        external
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public onlyRole(BURNER_ROLE) {
        _burn(account, id, value);
    }

    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public onlyRole(BURNER_ROLE) {
        _burnBatch(account, ids, values);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}