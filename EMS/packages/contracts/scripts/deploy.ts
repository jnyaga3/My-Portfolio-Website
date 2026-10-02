import { ethers } from 'hardhat';
async function main(){const now=Math.floor(Date.now()/1000);const Election=await ethers.getContractFactory('Election');const election=await Election.deploy('City Council • District 4',now,now+30*24*60*60,['Avery Johnson','Morgan Lee','Sam Rivera']);await election.waitForDeployment();console.log(`Election deployed to ${await election.getAddress()}`);}
main().catch(e=>{console.error(e);process.exitCode=1});
