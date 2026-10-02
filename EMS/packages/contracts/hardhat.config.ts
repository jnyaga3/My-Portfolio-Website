import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/config';
const config: HardhatUserConfig = { solidity: { version: '0.8.24', settings: { optimizer: { enabled: true, runs: 200 } } }, networks: { hardhat: {}, localhost: { url: process.env.RPC_URL || 'http://127.0.0.1:8545' } } };
export default config;
