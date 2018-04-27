'use strict';

// 需要在本js代码运行后的10s内，运行storeTest.js脚本将resourceKey资源存储到KAD网络中

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kadence = require('@kadenceproject/kadence');
const {seedInfo, resourceKey} = require('./config');

// // join失败等现象时会出现rejected（异步操作执行失败）错误，此处忽略该错误
// process.on('unhandledRejection', (/*error*/) => {
//   //console.error('unhandledRejection', error);
// });

// Construct a kademlia node interface
const node = new kadence.KademliaNode({
  identity: seedInfo.identity,
  transport: new kadence.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_first'))),
  contact: seedInfo.contact
});

// When you are ready, start listening for messages and join the network.
// The Node#listen method takes different arguments based on the transport adapter being used.
node.listen(node.contact.port);
console.log('seed node: ', node.identity.toString('hex'));

// const secondNode = new kadence.KademliaNode({
//   transport: new kadence.HTTPTransport(),
//   storage: levelup(encoding(leveldown('./db_second'))),
//   contact: { hostname: node.contact.hostname, port: 1345 },
// });
// secondNode.listen(secondNode.contact.port);
// console.log('second node: ', secondNode.identity.toString('hex'));
// // 通过seedInfo对应的节点加入KAD网络
// secondNode.join([seedInfo.identity, seedInfo.contact]);

// 在KAD网络中查找资源，此时KAD网络中还没有存储这个资源
node.iterativeFindValue(resourceKey, (err, value, contacts) => {
  if (err || !contacts) { 
    console.log('Can\'t find this resources!', err ? err : '');
  } else {
    console.log('Found: ', value, ' in', contacts);
  }
});

// 应能找到相应资源
setTimeout(() => {
  node.iterativeFindValue(resourceKey, (err, value, contacts) => {
    if (err || !contacts) { 
      console.log('Can\'t find this resources!', err ? err : '');
    } else {
      console.log('Found: ', value, ' in', contacts);
    }
  });
}, 10000);
