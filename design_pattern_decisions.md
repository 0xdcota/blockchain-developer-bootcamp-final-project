# Design Pattern Decisions

## Design patterns used in Efiat.world
- Inter-Contract Execution
The eFIAT system contains 3 core contract that need to interact with each other. This is done to maintain simplicity in the contracts with just a few associated functions. The {HouseOfReserve} contract custodies user's deposited funds, and only hanldles deposits and withdrawals of reserves. A seperate HouseOfReserve contract is needed to back different types of backed assets (or fiat curerncies). The {HouseOfCoin} allows users to mint and burn the backed asset. It considers the reserve asset type the user wants to use to back the minted amount. The {AssetAccountant} keeps log of all deposit and minted amounts via modified-ERC1155 tokens. The interaction between these contracts requires inter-contract execution.
- Inheritance and Interfaces
To allow easy integration of an upgradeable system, the contract logic for {HouseOfReserves}, {HouseOfCoin} and {AssetsAccountant} are split into state variables and functions. For each the functionality contract inherits from the contract containing the state variables. Interfaces for the contracts have been defined and as mentioned in the first point these are required for inter-contracct interactions. Use of some of the Openzeppelin libraries is done through inheritance; this includes AccessControl and Initializable. 
