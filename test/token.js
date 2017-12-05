let utils = require('./utils.js')

let token = artifacts.require("./LympoToken.sol");
let instance;
let totalSupply = 1000000000e18;
let init_time = 1508594400;
let start = 1520899199; // Time after ICO, when tokens became transferable. Monday, 12 March 2018 23:59:59 GMT
let tokensPreICO = 150000000e18; // 15%
let tokensICO = 500000000e18; //50%
let team_reserve = 130000000e18; // 13%
let ecosystem_reserve = 220000000e18; // 22%
let owner = "0x376c9fde9555e9a491c4cd8597ca67bb1bbf397e";
let ecoLock23 = 146652000e18; // 2/3 of ecosystem reserve
let ecoLock13 = 73326000e18; // 1/3 of ecosystem reserve
contract('token', accounts => {
         
         before(async() => {
                instance = await token.deployed();
                });
         
         it("test initialization", async() => {
            await instance.setCurrent(init_time);
            let balance = await instance.balances.call(accounts[0]);
            assert.equal(balance, totalSupply);
            let bal = await instance.balances.call(accounts[1]);
            assert.equal(bal, 0);
            let allowance = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowance, 0);
            let startTime = await instance.startTime.call();
            assert.equal(startTime, start);
        });
         
         it("test token allowence: should allow acc1 to spend 10k LYM", async() => {
            let result = await instance.approve(accounts[1], 10000e18);
            let event = result.logs[0].args;
            assert.equal(event._owner, accounts[0]);
            assert.equal(event.spender, accounts[1]);
            assert.equal(event.value, 10000e18);
            let allowed = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowed, 10000e18);
        });
         
         it("test token allowence: should fail to set allowance to 20k LYM", async() => {
                try {
                    let result = await instance.approve(accounts[1], 20000e18);
                    throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
                } catch (error) {
                }
        });
         
         it("test token allowence: should set allowance to 0 LYM", async() => {
            await instance.approve(accounts[1], 0);
            let allowed = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowed, 0);
        });
         
         it("test token allowence: should set allowance to 20k LYM", async() => {
            await instance.approve(accounts[1], 20000e18);
            let allowed = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowed.toNumber(), 20000e18);
        });
         
         it("test token transfering: should transfer 20k LYM from the owner to acc1", async() => {
            let result = await instance.transferFrom(accounts[0], accounts[1], 20000e18, {from: accounts[1]});
            let event = result.logs[0].args;
            assert.equal(event.from, accounts[0]);
            assert.equal(event.to, accounts[1]);
            assert.equal(event.value, 20000e18);
            let balance = await instance.balances(accounts[1]);
            assert.equal(balance, 20000e18);
            let bal = await instance.balances(accounts[0]);
            assert.equal(bal, totalSupply - 20000e18);
            let allowance = await instance.allowed(accounts[0], accounts[1]);
            assert.equal(allowance, 0);
        });
         
         it("test token transfering: should fail to transfer more funds to acc1 because of missing allowance", async() => {
            try {
                let result = await instance.transferFrom(accounts[0], accounts[1], 20000e18, {from: accounts[1]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
        });
         
         it("test token transfering: should fail to transfer from acc1, because trading not yet enabled", async() => {
            try {
                    let result = await instance.transfer(accounts[2], 5000e18, {from: accounts[1]});
                    throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
                } catch (error) {
                    try {
                        let result = await instance.transferFrom(accounts[1], accounts[2], 5000e18, {from: accounts[1]});
                        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
                    } catch (err) {
                    }
            }
        });
         
         it("test token burning: should fail to burn tokens because too early", async() => {
            let result = await instance.burn();
            assert.equal(result.logs.length, 0);//no Burn event
            let supply = await instance.totalSupply.call();
            assert.equal(supply, totalSupply);
        });
         
         it("test token transfering: should transfer from acc1 to acc2", async() => {
            // insreasing time - simulating ico is over
            await instance.setCurrent(start);
            let result = await instance.transfer(accounts[2], 10000e18, {from: accounts[1]});
            var event = result.logs[0].args;
            assert.equal(event.from, accounts[1]);
            assert.equal(event.to, accounts[2]);
            assert.equal(event.value,10000e18);
            let balance = await instance.balances(accounts[2]);
            assert.equal(balance.toNumber(),10000e18);
            let bal = await instance.balances(accounts[1]);
            assert.equal(bal.toNumber(),10000e18);
        });
         
         it("test token transfering: should fail to transfer from acc1 because of insufficient funds", async() => {
            try {
                let result = await instance.transfer(accounts[2], 60000e18, {from: accounts[1]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
        });
         
         it("test token burning: should burn all of the owner's tokens but the reserved amount", async() => {
            await instance.setCurrent(start+10);
            let result = await instance.burn();
            let event = result.logs[0].args;
            assert.equal(event.amount.toNumber(), (tokensICO / 1e18 + tokensPreICO / 1e18 - 20000e18 / 1e18) * 1e18, 'burned'); // burned = all_token_in_ico - (acc1+acc2) tokens
            
            // check team reserve
            let team_reserved = await instance.balances.call(accounts[0]);
            assert.equal(team_reserved.toNumber(), team_reserve);
            
            // check eco system reserve
            let ecosystem_balance = await instance.balances.call(accounts[8]);
            assert.equal(ecosystem_balance.toNumber(), ecosystem_reserve);
            
            let supply = await instance.totalSupply.call();
            assert.equal(supply.toNumber(), (team_reserve / 1e18 + ecosystem_reserve / 1e18 + 20000e18 / 1e18) * 1e18, 'suppply');
        });
         
         it("test token burning: call burn a second time. should do nothing", async() => {
                let result = await instance.burn();
                assert.equal(result.logs.length, 0);//no Burn event
        });
         
         it("test token reservation: should fail spend a few tokens from team reserve (earlier then 2 years after ICO)", async() => {
            try {
                let result = await instance.transfer(accounts[7], 50000000e18);
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
         });
         
         it("test token reservation: spend a few tokens from team reserve after 2 years", async() => {
            await instance.setCurrent(start + 31536000 * 2);
            let result = await instance.transfer(accounts[7], 50000000e18);
            let bal = await instance.balances.call(accounts[7]);
            assert.equal(bal.toNumber(),50000000e18);
        });
         
         it("test token reservation: should fail to spend the more then reserve tokens", async() => {
            try {
                let result = await instance.transfer(accounts[7], 110000000e18, {from: owner}); // total 150million and 50million already transfered
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
                let bal = await instance.balances.call(accounts[7]);
                assert.equal(bal.toNumber(), 50000000e18); // should be still 50million, because we tried to transfer more then reserved
            }
        });
         
         it("test token reservation: should fail spend all tokens from eco system reserve", async() => {
            await instance.setCurrent(start+10);
            try {
                let result = await instance.transfer(accounts[8], ecosystem_reserve, {from: accounts[1]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
        });
         
         it("test token reservation: should allow to spend 1/3 tokens from eco system reserve in first year", async() => {
            let result = await instance.transfer(accounts[1], ecoLock13, {from: accounts[8]});
            let bal = await instance.balances.call(accounts[8]);
            assert.equal(bal.toNumber(), (ecosystem_reserve / 1e18 - ecoLock13 / 1e18) * 1e18);
        });
         
         it("test token reservation: should fail spend more tokens from eco system reserve in first year", async() => {
            try {
                let result = await instance.transfer(accounts[1], ecoLock13, {from: accounts[8]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
        });
         
         it("test token reservation: should allow to spend another 1/3 tokens from eco system reserve in second year", async() => {
            await instance.setCurrent(start + 31536000 * 1); // move time a year ahead
            let result = await instance.transfer(accounts[1], ecoLock13, {from: accounts[8]});
            let bal = await instance.balances.call(accounts[8]);
            assert.equal(bal.toNumber(), (ecosystem_reserve / 1e18 - ecoLock23 / 1e18) * 1e18);
        });
         
         it("test token reservation: should allow to spend what's from eco system reserve in third year", async() => {
            await instance.setCurrent(start + 31536000 * 2); // move time two years ahead
            let result = await instance.transfer(accounts[1], 73348000e18, {from: accounts[8]});
            let bal = await instance.balances.call(accounts[8]);
            assert.equal(bal.toNumber(), 0);
        });
         
         
});


