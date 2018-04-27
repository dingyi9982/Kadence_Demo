'use strict';

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kadence = require('@kadenceproject/kadence');
const seedInfo = require('./seedInfo');

// join失败时会出现rejected（异步操作执行失败）错误，此处忽略该错误
process.on('unhandledRejection', (/*error*/) => {
  //console.error('unhandledRejection', error);
});

// Construct a kademlia node interface
const node = new kadence.KademliaNode({
  // transport: new kadence.HTTPTransport(),
  transport: new kadence.UDPTransport(),
  storage: levelup(encoding(leveldown('./db/second'))),
  contact: { hostname: '192.168.1.119', port: 1337 }
});

// When you are ready, start listening for messages and join the network.
// The Node#listen method takes different arguments based on the transport adapter being used.
node.listen(node.contact.port);

console.log(node.identity.toString('hex'));

// Join a known peer by it's [identity, contact]
node.join([seedInfo.identity, seedInfo.contact], () => {
  // Add 'join' callback which indicates peers were discovered and
  // our node is now connected to the overlay network
  console.log(`Connected to ${node.router.size} peers!`);
  for (let item of node.router.entries()) {
    if (item[1].size !== 0){
      console.log(item[0], item[1]);
    }
  } 
});
