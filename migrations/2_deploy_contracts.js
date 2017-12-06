var token = artifacts.require("./LympoToken.sol");
var ico = artifacts.require("./LympoICO.sol");

module.exports = function(deployer) {
    const owner = "0x376c9fde9555e9a491c4cd8597ca67bb1bbf397e";
    const wallet = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
    const advisers_wallet = "0x0cbe666498dd2bb2f85b644b5f882e4136ac9558";
    const ecosystemHolder = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
    
    deployer.deploy(token, owner, advisers_wallet, ecosystemHolder).then(function(){
                                                  return deployer.deploy(ico,
                                                                         token.address,
                                                                         wallet,
                                                                         owner
                                                                         )
                                                  });
  
   
};
