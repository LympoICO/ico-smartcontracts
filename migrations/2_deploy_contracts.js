var token = artifacts.require("./LympoToken.sol");
var ico = artifacts.require("./LympoICO.sol");

module.exports = function(deployer) {
    const owner = "0x376c9fde9555e9a491c4cd8597ca67bb1bbf397e";
    const wallet = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
    const ecosystemHolder = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
    
    deployer.deploy(token, owner, ecosystemHolder).then(function(){
                                                  return deployer.deploy(ico,
                                                                         token.address,
                                                                         wallet,
                                                                         owner
                                                                         )
                                                  });
  
   
};
