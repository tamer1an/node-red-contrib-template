import {NodeProperties, Red} from 'node-red';

module.exports = function(RED: Red) {
  'use strict';

  function CredentialsNode(n: NodeProperties) {
    // @ts-ignore
    const node: any = this;
    RED.nodes.createNode(node, n);
    node.name = n.name;
  }

  RED.nodes.registerType('template-credentials', CredentialsNode, {
    credentials: {
      token: { type: 'password' }
    }
  });

  // @ts-ignore
  function TemplateNode1(n) {
    // @ts-ignore
    const node: any = this;

    RED.nodes.createNode(node, n);
    node.status({});

    node.on('input', function(msg: { payload: object }) {
      node.status({fill: 'blue', shape: 'ring', text: node.action});
    });
  }

  RED.nodes.registerType('template-node1', TemplateNode1);

  function TemplateNode2(n: any) {
    // @ts-ignore
    const node = this;
    RED.nodes.createNode(node, n);

    node.action = n.action;
    node.options = n.options;
    node.optionsType = n.optionsType;
    node.username = n.username;
    node.usernameType = n.usernameType;
    node.orgname = n.orgname;
    node.orgnameType = n.orgnameType;
  }
  RED.nodes.registerType('template-node2', TemplateNode2);
};
