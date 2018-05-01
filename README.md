# Kadence简单使用方法

[Kadence](https://github.com/kadence/kadence)是GitHub的一个开源项目，它用JavaScript完整地实现了Kademlia（A peer-to-peer information system based on the XOR Metric，一种基于 XOR 度量的 P2P 信息系统）协议。[Kadence官网](https://kadence.github.io/)有安装和使用方法的介绍，但是使用方法写的不是很详细，下面补充地介绍一下在Nodejs中利用Kadence实现网络节点的加入、数据的存储和访问等操作。

## 存在的问题

由于大多数用户的IP地址都是内网IP，如果要在公网中部署KAD网络，就要涉及到NAT地址转换，如果各计算机（假设不处于同一个局域网中）使用Kadence创建KAD网络节点（即KademliaNode类的对象）时传递的IP为内网ID，那么将节点之间将无法正常调用Kademlia协议中定义的RPC操作。暂时没有研究出来如何将处于不同局域网间的节点加入同一个KAD网络中，在GitHub有个repo给出了的如下代码可能和NAT转换有关：

```
node.traverse = node.plugin(
  kadence.traverse([
    new kadence.traverse.UPNPStrategy({
      mappingTtl: 0, // config.TraversePortForwardTTL
      publicPort: parseInt(node.contact.port)
    }),
    new kadence.traverse.NATPMPStrategy({
      mappingTtl: 0, // config.TraversePortForwardTTL
      publicPort: parseInt(node.contact.port)
    })
  ])
);
```

功能大概是进行NAT地址转换吧，具体需要再研究。

## kadence加入网络和存取数据

### 具体步骤

1. 各节点创建kadence对象（设置160bits的ID，底层的传输协议（如UDP、HTTP或HTTPS等），数据库存储路径，自己的联系信息（如IP、port等）），调用`listen`方法监听端口；除了第一个建立的节点，其他每个节点都要调用`join`方法，传递已知的处于KAD网络中的节点信息，从而加入到KAD网络中。
2. 调用`iterativeStore`函数存储资源到KAD网络中，调用`iterativeFindValue`函数从KAD网络中获取资源。

### 简单示例

本示例一共包含三个js文件：config.js、firstNode.js和storeTest.js。其中，config.js用于存储种子节点（即第一个节点）的NodeID以及将要存储的资源的ID；firstNode.js运行于其中一个节点计算机中，storeTest.js运行于另一个节点计算机中。代码如下：

#### config.js文件

```
'use strict'

// 种子节点的信息
module.exports.seedInfo = {
  identity: '1111122222333334444455555666667777788888',
  contact: { hostname: '192.168.1.111', port: 1337 }
};

// 存储到KAD网络的资源ID
module.exports.resourceKey = '9999999999999999999999999999999999999999';
```

#### firstNode.js文件

```
'use strict';

// 需要在本js代码运行后的10s内，运行storeTest.js脚本将resourceKey资源存储到KAD网络中

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kadence = require('@kadenceproject/kadence');
const {seedInfo, resourceKey} = require('./config');

// Construct a kademlia node interface
const node = kadence({
  identity: seedInfo.identity,
  transport: new kadence.UDPTransport(),
  storage: levelup(encoding(leveldown('./db_first'))),
  contact: seedInfo.contact
});

// When you are ready, start listening for messages and join the network.
// The Node#listen method takes different arguments based on the transport adapter being used.
node.listen(node.contact.port);
console.log('seed node: ', node.identity.toString('hex'));

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

```

#### storeTest.js文件

```
'use strict';

const levelup = require('levelup');
const leveldown = require('leveldown');
const encoding = require('encoding-down');
const kadence = require('@kadenceproject/kadence');
const { Transform } = require('stream');
const {seedInfo, resourceKey} = require('./config');

// Construct a kademlia node interface
const node = kadence({
  transport: new kadence.UDPTransport(),
  storage: levelup(encoding(leveldown('./db_third'))),
  contact: { hostname: '192.168.109.101', port: 1337 }
});

// When you are ready, start listening for messages and join the network.
// The Node#listen method takes different arguments based on the transport adapter being used.
node.listen(node.contact.port);
console.log(node.identity.toString('hex'));

// Join a known peer by it's [identity, contact]
node.join([seedInfo.identity, seedInfo.contact], () => {
  // Add 'join' callback which indicates peers were discovered and our node is now connected to the overlay network
  console.log(`Connected to ${node.router.size} peers!`);
});

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
```
**PS**:
- 需要修改config.js和storeTest.js中的IP地址为相应节点计算机的IP。
- 创建kadence节点时，传递的各个参数需要注意如下几点：
  - 如果不传递identity参数，将随机生成一个160bits的ID，firstNode.js中指定identity是为了测试时提前让运行storeTest.js的节点计算机知道已在KAD网络中的某个节点信息。
  - transport参数可以是UDPTransport也可以是HTTPTransport，甚至是自定义协议，但是要保证各节点用同一的协议，否则将无法加入到同一个KAD网络中。
  - 如果指定的transport参数是UDPTransport或HTTPTransport，那么contact参数是ip和port组成的字典，该参数的主要作用是表示节点自身的身份，即告诉KAD网络本节点的ip和监听的端口是什么，如果改参数指定错误。另外，如果transport参数是其他自定义协议，可以自己定制该参数的值。

**运行方法**：在其中一个节点计算机(A节点)中运行`node firstNode.js`命令，然后在10s时间内，在另一个节点计算机(B节点)中运行`node storeTest.js`命令，等待一段时间后（保证A节点的10s延时结束），如果运行正常的话，结果可能类似如下：

A节点输出：

```
seed node:  1111122222333334444455555666667777788888
Can't find this resources!
Found:  { publisher: 'f10351a6dca1b1bfbabf849a7e80221e2ee74123',
  timestamp: 1525158455834,
  value: '哈哈哈哈哈哈哈哈哈哈' }  in [ 'f10351a6dca1b1bfbabf849a7e80221e2ee74123',
  { hostname: '192.168.109.101', port: 1337 } ]
```

B节点输出：

```
f10351a6dca1b1bfbabf849a7e80221e2ee74123
Connected to 1 peers!
Number of nodes storing pair:  2
Found:  { publisher: 'f10351a6dca1b1bfbabf849a7e80221e2ee74123',
  timestamp: 1525158455823,
  value: '哈哈哈哈哈哈哈哈哈哈' }  in [ '1111122222333334444455555666667777788888',
  { hostname: '192.168.1.111', port: 1337 } ]
```
