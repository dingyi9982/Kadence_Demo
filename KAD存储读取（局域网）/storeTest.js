'use strict';

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kadence = require('@kadenceproject/kadence');
// const crypto = require('crypto');
const {seedInfo, resourceKey} = require('./config');

// // join失败等现象时会出现rejected（异步操作执行失败）错误，此处忽略该错误
// process.on('unhandledRejection', (/*error*/) => {
//   //console.error('unhandledRejection', error);
//   console.log('errrrrrrrrrrrrrrrrror');
// });

// Construct a kademlia node interface
const node = kadence({
  // transport: new kadence.HTTPTransport(),
  transport: new kadence.UDPTransport(),
  storage: levelup(encoding(leveldown('./db_third'))),
  contact: { hostname: '192.168.56.101', port: 1337 }
});

// When you are ready, start listening for messages and join the network.
// The Node#listen method takes different arguments based on the transport adapter being used.
node.listen(node.contact.port);
console.log(node.identity.toString('hex'));

// Join a known peer by it's [identity, contact]
node.join([seedInfo.identity, seedInfo.contact], () => {
  // Add 'join' callback which indicates peers were discovered and our node is now connected to the overlay network
  console.log(`Connected to ${node.router.size} peers!`);

  // // 打印所有非空K桶
  // for (let item of node.router.entries()) {
  //   if (item[1].size !== 0){
  //     console.log(item[0], item[1]);
  //   }
  // } 
});

// const getRandomKeyBuffer = function() {
//   return crypto.randomBytes(160 / 8);
// };
//const nodeKey = getRandomKeyBuffer();
//const byteValues = [163, 127, 17, 14, 100, 83, 221, 129, 205, 61, 198, 248, 20, 183, 6, 52, 86, 244, 103, 34];
//const nodeKey = Buffer.from(byteValues)

//resourceKey和resourceValue分别是要存储到KAD网络的键值对
const resourceValue = {
  publisher: node.identity,
  timestamp: Date.now(),
  value: '哈哈哈哈哈哈哈哈哈哈'
}

setTimeout(() => {
  // 存储资源到KAD网络中
  node.iterativeStore(resourceKey, resourceValue, (err, number) => {
    if (err) { 
      console.log('Store error!', err ? err : '');
    } else {
      console.log('Number of nodes storing pair: ', number);

      // 在KAD网络中查找资源
      node.iterativeFindValue(resourceKey, (err, value, contacts) => {
        if (err || !contacts) { 
          console.log('Can\'t find this resources!', err ? err : '');
        } else {
          console.log('Found: ', value, ' in', contacts);
        }
      });
    }
  })
}, 1000);
