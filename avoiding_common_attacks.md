# Avoiding Common Attack Vectors

## Attack Vectors addressed in Efiat.world
- SWC-135: Code with No Effects
In {AssetsAccount} contract, the 'SafeTransferFrom' functions are disabled. However, they are done by adding a revert function call to avoid 'SW-135'.
- SWC-107: Reentrancy attack
Withdraw operation in the {HouseOfReserve} contract is done usingt the Checks-Effects-Interactions pattern.
