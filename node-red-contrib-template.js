"use strict";
exports.__esModule = true;
module.exports = function (RED) {
    'use strict';
    function CredentialsNode(n) {
        // @ts-ignore
        var node = this;
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
        var node = this;
        RED.nodes.createNode(node, n);
        node.status({});
        node.on('input', function (msg) {
            node.status({ fill: 'blue', shape: 'ring', text: node.action });
        });
    }
    RED.nodes.registerType('template-node1', TemplateNode1);
    function TemplateNode2(n) {
        // @ts-ignore
        var node = this;
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
