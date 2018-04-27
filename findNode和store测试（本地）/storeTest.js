'use strict';

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kad = require('@kadenceproject/kadence');
const crypto = require('crypto');

const getRandomKeyBuffer = function() {
  return crypto.randomBytes(160 / 8);
};

const node = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_store_node'))),
  contact: { hostname: 'localhost', port: 1337 }
});
node.listen(node.contact.port);

const otherNode = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_store_other'))),
  contact: { hostname: 'localhost', port: 1338}
});
otherNode.listen(otherNode.contact.port);

const otherNode2 = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_store_other2'))),
  contact: { hostname: 'localhost', port: 1339}
});
otherNode2.listen(otherNode2.contact.port);

const otherNode3 = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_store_other3'))),
  contact: { hostname: 'localhost', port: 1340}
});
otherNode3.listen(otherNode3.contact.port);

// node joins otherNodes routing table
node.join([otherNode.identity, otherNode.contact], () => {});
otherNode.join([otherNode2.identity, otherNode2.contact], () => {});
otherNode2.join([otherNode3.identity, otherNode3.contact], () => {});

console.log('Node contacts in router: ', node.router.size);

const nodeKey = getRandomKeyBuffer();
//const byteValues = [163, 127, 17, 14, 100, 83, 221, 129, 205, 61, 198, 248, 20, 183, 6, 52, 86, 244, 103, 34];
//const nodeKey = Buffer.from(byteValues)

setTimeout(()=>{
  node.iterativeStore(nodeKey, {
    publisher: node.identity,
    timestamp: Date.now(),
    value: 'Test value',
  }, (err, number) => {
    if (err) { console.log("Error!", err); }
    console.log('Number of nodes storing pair', number); // logs 0
  
    node.iterativeFindValue(nodeKey, (err, value, contacts) => {
      if (err) { console.log("Error!", err); }
      console.log('Found: ', value, ' in', contacts);
    });
  })
}, 1000);

// setTimeout(() => {
//   node.iterativeStore(nodeKey, {
//     publisher: node.identity,
//     timestamp: Date.now(),
//     value: 'Other node',
//   }, (err, number) => {
//     console.log('Number of nodes storing pair', number);
    
//     //经过上面的iterativeStore调用后，otherNode中应该存储了nodeKey对应的内容，但是为何
//     //如下代码会出现key not found错误？？？？？？？？？？？？？？
//     setTimeout((err, number) => {
//       otherNode.storage.get(nodeKey, function(err, value) {
//         if (err) {throw err;}                // throws error - key not found
//         console.log('otherNode=' + value)
//       }, 1000);
//     });
  
//     // setTimeout(function() {
//     //   otherNode.storage.get(nodeKey, function(err, value) {
//     //     if (err) {throw err;} // key not found
//     //     console.log('batNode=' + value);
//     //   });
//     // }, 1000);
  
//     // node.storage.put('batNode', 'true', function (err) {
//     //   if (err) {throw err;} // I/O error
//     //   node.storage.get('batNode', function (err, value) {
//     //     if (err) {throw err;} // key not found
//     //     console.log('batNode=' + value)
//     //   })
//     // })
//   })
// }, 1000);
