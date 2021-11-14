# Efiat.world - digital currencies system
### Consensys Blockchain Developer Project
November 7, 2021

### Electronic currencies for smaller economies
Although cryptocurrencies of many types already exist, there is fairly a low adoption in developing countries. This project will focus on Latin America (Latam).
Among the reasons, is that no popular and widely accepted representation of a stablecoin has been created for the currencies in Latam. In this project, a create a simple MVP of a stablecoin system to create electronic versions of currencies in a permisionless way.

### Price Oracle 
One of the barriers for a creating a digital cryptocurrency  that represents a Latam currency is the lack of price oracle feeds for these currencies. For this project, in coordination with [Redstone Finance](https://redstone.finance/), some Latam currency prices were made available. 

## Set up
This project uses Node.js, TruffleSuite, and Satic-Server, and will be needed to test the application. 

Pre-requisites:
- Install globally [Static-server](https://yarnpkg.com/package/static-server). `npm install -g ganache-cli`
- Install globally [Ganache-cli](https://github.com/trufflesuite/ganache-cli-archive) `npm -g install static-server`

Copy repository: `git clone https://github.com/DaigaroCota/blockchain-developer-bootcamp-final-project`

User your preferred package manager, the commands in this instruction assume Yarn.

Install dependencies:` yarn install`

To test application in a local environment, you will need three terminals:

- On one terminal run the web host server: `yarn server`
- On another terminal run the development blockchain:  `yarn ganache`
- On the remaining terminal run: `yarn deploy`

Open a browser and go to: `http://localhost:9080/`