const axios = require("axios");
const Web3 = require("web3");
const { createWriteStream } = require('fs');
const limit = 20;

const apiCall = (address, page) => `https://api.scanmydefi.com/address/${address}/transactions?limit=${limit}&page=${page}`


const Twitter = require("twitter");


const client = new Twitter({
  consumer_key: "nZ2svFKO1dDiogksJNhH05u76",
  consumer_secret: "20h8F6WayuYcpEdVgaGo8AN3DflQV2RE6p3OuFIqGlMEQ2D5CH",
  access_token_key: "1486096407299694593-xXHWqu7N6TwABsNyh17Xbw3Mwnjmyv",
  access_token_secret: "3Ep5A6hUOTZyy77thXudXKO0r5UzT4hE41imlxlQQnFqZ",
});


postUpdate = async (count) => {
  client.post(
    "statuses/update",
    {
      status:`${count} transactions processed for hex protocol`,
    },
    function (error, tweet, response) {
      if (error) throw error;
    }
  );
};

//Array for infura servers
const serverArr = [
    "https://mainnet.infura.io/v3/65ef0d20bce5453297371820335b0409",
    "https://mainnet.infura.io/v3/5e7260c217304f78a79b5e380feaab75",
    "https://mainnet.infura.io/v3/9391decbb427428fa4dcd947978e148d",
    "https://mainnet.infura.io/v3/85fae8d1614f4132b90afce4aa0e1292",
    "https://mainnet.infura.io/v3/e0c50dd3725b4d7e8c803a0d0db3c677",
    "https://mainnet.infura.io/v3/8a2345c9fdac4bb68099e914a91a0b2a",
    "https://mainnet.infura.io/v3/41fae05e0a2b4a7da83c689c5f7864af",
    "https://mainnet.infura.io/v3/deb3bac0272e46eab9003e57f1c30c6f",
    "https://mainnet.infura.io/v3/8d94194d3955498f9516fdd8d3247691",
    "https://mainnet.infura.io/v3/801c6ce484e44827891cde0ddd6aee0a",
    "https://mainnet.infura.io/v3/75a187fe366c46079a310da4c306e238",
    "https://mainnet.infura.io/v3/dc287669d7b54e7484ba2203f1312447",
    "https://mainnet.infura.io/v3/5b540620294847bc8514b59905619304",
    "https://mainnet.infura.io/v3/45bee824bd7a463789e6648ef0a29d74",
    "https://mainnet.infura.io/v3/dd29c3bf7bee424b9dbb98596e72ebdc",
    "https://mainnet.infura.io/v3/19e431afb27a4b35be7061a1b4b6b6a0",
    "https://mainnet.infura.io/v3/b00553321560431f808482760dbbfacf",
    "https://mainnet.infura.io/v3/96d82bb4d4a449d5a17c2ddf96969a79",
    "https://mainnet.infura.io/v3/f81722d6fda140f4a515c08485ee4e91",
    "https://mainnet.infura.io/v3/3d6a37a01ef74bbc917219b4f4d9b7ec",
    "https://mainnet.infura.io/v3/45a473125c9b4f938842b3c2aa3a9e92",
    "https://mainnet.infura.io/v3/45fc9bf3969140488231fc73578083bc",
    "https://mainnet.infura.io/v3/1c0b026e4afe47bba63fb80ee3c5cb51",
    "https://mainnet.infura.io/v3/4376590313124e3289a13ac3028571c4",
    "https://mainnet.infura.io/v3/e269089a73684bdba0b5577104e1eac8",
    "https://mainnet.infura.io/v3/eac4be7420724ec289e71ded9c0afae9",
    "https://mainnet.infura.io/v3/f47ddbe5274242919287d1fac55312f6",
];
// Contract address for the protocol
let address = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39";
address = address.toLowerCase();
var web3Server = [];
for (let i = 0; i < serverArr.length; ++i) {
    web3Server.push(new Web3(new Web3.providers.HttpProvider(serverArr[i])))
}
//To get all the txn hash for that protocol
async function getTxnHashList(address,page) {
    return new Promise(async (resolve, reject) => {
        try {
            let txnHashList=[];
            let blockTimestampList=[];
            let response;
            let data;
            response = await axios.get(apiCall(address,page));
            data = response.data.result.data.transactionHashJSONDataList
            data.forEach((d) => {
                txnHashList.push(d.transactionHash);
                blockTimestampList.push(d.blockTimeStamp)
            });
           resolve({txnHashList:txnHashList,blockTimestampList: blockTimestampList, pageReturned:page+1});
        } catch (err) {
            reject(err);
        }
    })
};

var transactionsPromises=[],transactionsData=[],objTransaction={},str;
var tx;
var blockTimestamp;
const output = createWriteStream(`${address}.csv`);
output.write('TransactionHash,From,BlockTimeStamp\n');

// To get the required data from the txn hashes
async function getDataFromTxnHash() { //MAIN function
    return new Promise(async (resolve, reject) => {
        try {
            let count=0;
            let flag=true;
            let page=66231;
            while(flag){
                if(count%3000==0){
                    postUpdate(count);
                }
                var {txnHashList, blockTimestampList, pageReturned} = await getTxnHashList(address,page);
                transactionsPromises=[]
                txnHashList.forEach((hash,iter)=>{
                    count++
                    transactionsPromises.push(web3Server[iter%web3Server.length].eth.getTransaction(hash))
                })
                transactionsData = await Promise.all(transactionsPromises);
                for(let iterTransaction=0;iterTransaction<transactionsData.length;++iterTransaction){
                    tx=transactionsData[iterTransaction];
                    blockTimestamp = blockTimestampList[iterTransaction];
                    objTransaction = {
                        hash: tx.hash.toLowerCase(),
                        from : tx.from.toLowerCase(),
                        blockTimestamp : blockTimestamp,
                    }
                    str = `${objTransaction.hash},${objTransaction.from},${objTransaction.blockTimestamp}`;
                    output.write(`${str}\n`);
                }
                console.log(`${count} rows entered. On page ${page}`);
                page=pageReturned;
           }
            output.on('error', (err) => {
                throw err;
            })
            console.log("processed finished")
            resolve();
        } catch (err) {
            console.log(err);
            reject(err);
            process.exit();
        }
    })
};
getDataFromTxnHash();