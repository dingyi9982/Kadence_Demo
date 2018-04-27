'use strict';

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kadence = require('@kadenceproject/kadence');
const seedInfo = require('./seedInfo');

// Construct a kademlia node interface
const node = kadence({
  identity: seedInfo.identity,
  transport: new kadence.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db/first'))),
  contact: seedInfo.contact
});

// When you are ready, start listening for messages and join the network.
// The Node#listen method takes different arguments based on the transport adapter being used.
node.listen(seedInfo.contact.port);
console.log(node.identity.toString('hex'));

// node.traverse = node.plugin(
//   kadence.traverse([
//     new kadence.traverse.UPNPStrategy({
//       mappingTtl: 0, // config.TraversePortForwardTTL
//       publicPort: parseInt(node.contact.port)
//     }),
//     new kadence.traverse.NATPMPStrategy({
//       mappingTtl: 0, // config.TraversePortForwardTTL
//       publicPort: parseInt(node.contact.port)
//     })
//   ])
// );
