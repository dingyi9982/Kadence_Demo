'use strict';

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kad = require('@kadenceproject/kadence');

//打印所有非空K桶的节点信息
const printAllContacts = function(tmpNode){
  for (let item of tmpNode.router.entries()) {
    if (item[1].size !== 0){
      console.log(item[0], item[1]);
    }
  }
}

const node = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_findNode_node'))),
  contact: { hostname: 'localhost', port: 1337 }
});
node.listen(node.contact.port);

const otherNode = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_findNode_other'))),
  contact: { hostname: 'localhost', port: 1338}
});
otherNode.listen(otherNode.contact.port);

const otherNode2 = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_findNode_other2'))),
  contact: { hostname: 'localhost', port: 1339}
});
otherNode2.listen(otherNode2.contact.port);

const otherNode3 = kad({
  transport: new kad.HTTPTransport(),
  storage: levelup(encoding(leveldown('./db_findNode_other3'))),
  contact: { hostname: 'localhost', port: 1340}
});
otherNode3.listen(otherNode3.contact.port);

node.join([otherNode.identity, otherNode.contact], () => {});
otherNode.join([otherNode2.identity, otherNode2.contact], () => {});
otherNode2.join([otherNode3.identity, otherNode3.contact], () => {});

//由于上面的join操作需要一定时间完成，此处需要延时一段时间再调用iterativeFindNode函数
setTimeout(() => {
  node.iterativeFindNode(node.identity, (err, contacts) => {
    console.log("Node router size", node.router.size);
    if (err) { console.log("Error!", err); }
    console.log('Returned contacts: ', contacts);
  })
}, 1000);
