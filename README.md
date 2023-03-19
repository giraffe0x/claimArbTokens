# claimArbTokens
JS script to help compromised accounts claim ARB airdrop

How to use:
1. Clone repo and $ npm install
2. Add private keys to .env-example file -- a) compromised account and b) a safe account with some eth
3. Change .env-example file name to .env
4. In claim.js, line 40 change value to your claimable arb tokens
5. run $ node claim.js


Do not deposit ETH into compromised account ahead of time, sweeper bots will steal it away
