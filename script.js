  const nodeTypes = {
    NumberNode: {
      title: "Number",
      inputs: [],
      outputs: ["value"],
      renderContent(node) {
        if (node.value === undefined) node.value = 0;
        return `<div class="node-content"><input class="node-input number-input" type="number" value="${node.value}" /></div>`;
      },
      update(node) {
        const input = node.dom.querySelector('input.number-input');
        if (input) node.value = Number(input.value);
      },
      getOutput() {
        return this.value;
      }
    },
    TextNode: {
      title: "Text",
      inputs: [],
      outputs: ["text"],
      renderContent(node) {
        if (node.value === undefined) node.value = "";
        return `<div class="node-content"><input class="node-input text-input" type="text" value="${node.value}" placeholder="Enter text..." /></div>`;
      },
      update(node) {
        const input = node.dom.querySelector('input.text-input');
        if (input) node.value = input.value;
      },
      getOutput() {
        return this.value;
      }
    },
    CurrentDateNode: {
        title: "Current Date",
        inputs: [],
        outputs: ["dateString"],
        renderContent() {
            return `<div class="node-content" style="padding:10px; font-size:0.9rem; text-align:center;"></div>`;
        },
        getOutput() {
            const date = new Date();
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        }
    },
    CurrentTimeNode: {
        title: "Current Time",
        inputs: [],
        outputs: ["timeString"],
        renderContent() {
            return `<div class="node-content" style="padding:10px; font-size:0.9rem; text-align:center;"></div>`;
        },
        getOutput() {
            const date = new Date();
            return String(date.getHours()).padStart(2, '0') + ':' + 
                   String(date.getMinutes()).padStart(2, '0') + ':' + 
                   String(date.getSeconds()).padStart(2, '0');
        }
    },
    AddNode: {
      title: "Add",
      inputs: ["a", "b"],
      outputs: ["sum"],
      renderContent() {
        return `<div class="node-content" style="padding:10px; font-size:0.9rem;">Adds two numbers.</div>`;
      },
      compute(inputs) {
        const a = inputs["a"];
        const b = inputs["b"];
        if (typeof a !== 'number' || typeof b !== 'number') return null;
        return a + b;
      }
    },
    SubtractNode: {
      title: "Subtract",
      inputs: ["a", "b"],
      outputs: ["difference"],
      renderContent() {
        return `<div class="node-content" style="padding:10px; font-size:0.9rem;">Subtracts b from a.</div>`;
      },
      compute(inputs) {
        const a = inputs["a"];
        const b = inputs["b"];
        if (typeof a !== 'number' || typeof b !== 'number') return null;
        return a - b;
      }
    },
    MultiplyNode: {
      title: "Multiply",
      inputs: ["x", "y"],
      outputs: ["product"],
      renderContent() {
        return `<div class="node-content" style="padding:10px; font-size:0.9rem;">Multiplies two numbers.</div>`;
      },
      compute(inputs) {
        const x = inputs["x"];
        const y = inputs["y"];
        if (typeof x !== 'number' || typeof y !== 'number') return null;
        return x * y;
      }
    },
    DivideNode: {
      title: "Divide",
      inputs: ["a", "b"],
      outputs: ["quotient"],
      renderContent() {
        return `<div class="node-content" style="padding:10px; font-size:0.9rem;">Divides a by b.</div>`;
      },
      compute(inputs) {
        const a = inputs["a"];
        const b = inputs["b"];
        if (typeof a !== 'number' || typeof b !== 'number' || b === 0) return null;
        return a / b;
      }
    },
    MergeTextNode: {
      title: "Merge Text",
      inputs: ["text1", "text2"],
      outputs: ["mergedText"],
      renderContent() {
        return `<div class="node-content" style="padding:10px; font-size:0.9rem;">Merges two text strings.</div>`;
      },
      compute(inputs) {
        const text1 = inputs["text1"] !== null ? String(inputs["text1"]) : "";
        const text2 = inputs["text2"] !== null ? String(inputs["text2"]) : "";
        return text1 + text2;
      }
    },
    AskPollinationsNode: {
      title: "Ask Pollinations",
      inputs: ["prompt"],
      outputs: ["response"],
      renderContent(node) {
        if (node.value === undefined) node.value = "";
        return `
          <div class="node-content">
            <textarea class="node-input text-input" placeholder="Enter prompt or connect..." rows="3">${node.value}</textarea>
            <div style="padding:5px 10px; font-size:0.8rem; color:#aaa;">Result: <span class="pollinations-result">...</span></div>
            <div style="font-size: 0.7rem; color: #888; padding: 0 10px 8px; text-align: center; font-style: italic;">Uses an external service (pollinations.ai)</div>
          </div>
        `;
      },
      update(node) {
        const textarea = node.dom.querySelector('textarea.text-input');
        if (textarea) node.value = textarea.value;
      },
      async compute(inputs) {
        const promptText = inputs["prompt"] !== null ? String(inputs["prompt"]) : (this.value || "");
        const resultSpan = this.dom.querySelector('.pollinations-result');
        if (resultSpan) resultSpan.textContent = 'Loading...';

        if (!promptText) {
          if (resultSpan) resultSpan.textContent = 'No prompt provided.';
          return null;
        }

        try {
          const encodedPrompt = encodeURIComponent(promptText);
          const url = `https://text.pollinations.ai/${encodedPrompt}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const textResponse = await response.text();
          if (resultSpan) resultSpan.textContent = textResponse.substring(0, 50) + (textResponse.length > 50 ? '...' : '');
          return textResponse;
        } catch (error) {
          console.error("Error fetching from Pollinations:", error);
          if (resultSpan) resultSpan.textContent = `Error: ${error.message}`;
          return null;
        }
      }
    },
    OutputNode: {
      title: "Output",
      inputs: ["input"],
      outputs: [],
      renderContent(node) {
        return `<div class="node-content" style="padding:10px; font-size:0.9rem; text-align:center; min-height: 20px;"></div>`;
      }
    }
  };

  const app = {
    nodes: [],
    connections: [],
    nextNodeId: 1,
    draggedNode: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    connecting: null,
    contextMenuNodeId: null,
  };

  const canvas = document.getElementById('canvas');
  const nodeList = document.getElementById('node-list');
  const connectionsSvg = document.getElementById('connections');
  const runBtn = document.getElementById('run-btn');
  const exportJsBtn = document.getElementById('export-js-btn');
  const exportPythonBtn = document.getElementById('export-python-btn');
  const importNodesBtn = document.getElementById('import-nodes-btn');
  const importNodesFile = document.getElementById('import-nodes-file');
  const contextMenu = document.getElementById('context-menu');
  const searchNodesInput = document.getElementById('search-nodes');

  function createNode(typeKey, x = 250, y = 150) {
    const type = nodeTypes[typeKey];
    if (!type) return;

    const node = {
      id: app.nextNodeId++,
      type: typeKey,
      x,
      y,
      dom: null,
      value: undefined
    };
    app.nodes.push(node);
    renderNode(node);
  }

  function renderNode(node) {
    const type = nodeTypes[node.type];
    const nodeEl = document.createElement('div');
    nodeEl.classList.add('node');
    nodeEl.style.left = node.x + 'px';
    nodeEl.style.top = node.y + 'px';
    nodeEl.dataset.id = node.id;

    nodeEl.innerHTML = `
      <div class="node-header">${type.title}</div>
      <div class="node-io">
        <div class="inputs">
          ${type.inputs.map(name => `
            <div class="io-item">
              <div class="io-connector input" data-nodeid="${node.id}" data-type="input" data-name="${name}" title="Input: ${name}"></div>
              <span style="margin-left:8px;">${name}</span>
            </div>`).join('')}
        </div>
        <div class="outputs">
          ${type.outputs.map(name => `
            <div class="io-item" style="justify-content:flex-end;">
              <span style="margin-right:8px;">${name}</span>
              <div class="io-connector output" data-nodeid="${node.id}" data-type="output" data-name="${name}" title="Output: ${name}"></div>
            </div>`).join('')}
        </div>
      </div>
      ${type.renderContent ? type.renderContent(node) : ''}
    `;

    canvas.appendChild(nodeEl);
    node.dom = nodeEl;

    nodeEl.querySelector('.node-header').addEventListener('mousedown', onNodeDragStart);

    nodeEl.querySelectorAll('.io-connector').forEach(connector => {
      connector.addEventListener('mousedown', onConnectorClick);
    });
  }

  function updateNodePosition(node, x, y) {
    node.x = x;
    node.y = y;
    node.dom.style.left = x + 'px';
    node.dom.style.top = y + 'px';
    updateConnectionsForNode(node.id);
  }

  function getConnectorPosition(nodeId, ioType, ioName) {
    const node = app.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const el = node.dom.querySelector(`.io-connector.${ioType}[data-name="${ioName}"]`);
    if (!el) return null;

    const canvasRect = canvas.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2 - canvasRect.left,
      y: rect.top + rect.height / 2 - canvasRect.top,
    };
  }

  function updateConnectionsForNode(nodeId) {
    connectionsSvg.querySelectorAll(`[data-from-nodeid="${nodeId}"], [data-to-nodeid="${nodeId}"]`).forEach(line => {
        const fromNodeId = Number(line.dataset.fromNodeid);
        const fromOutput = line.dataset.fromoutput;
        const toNodeId = Number(line.dataset.toNodeid);
        const toInput = line.dataset.toinput;

        const fromPos = getConnectorPosition(fromNodeId, 'output', fromOutput);
        const toPos = getConnectorPosition(toNodeId, 'input', toInput);
        if (fromPos && toPos) {
            line.setAttribute('x1', fromPos.x);
            line.setAttribute('y1', fromPos.y);
            line.setAttribute('x2', toPos.x);
            line.setAttribute('y2', toPos.y);
        } else {
            line.remove();
            app.connections = app.connections.filter(conn => 
                !(conn.fromNodeId === fromNodeId && conn.fromOutput === fromOutput && 
                  conn.toNodeId === toNodeId && conn.toInput === toInput)
            );
        }
    });
  }
  
  function redrawAllConnections() {
    connectionsSvg.innerHTML = '';
    for (const conn of app.connections) {
      const fromPos = getConnectorPosition(conn.fromNodeId, 'output', conn.fromOutput);
      const toPos = getConnectorPosition(conn.toNodeId, 'input', conn.toInput);
      if (fromPos && toPos) {
        const line = createSVGLine(fromPos.x, fromPos.y, toPos.x, toPos.y);
        line.dataset.fromNodeid = conn.fromNodeId;
        line.dataset.fromoutput = conn.fromOutput;
        line.dataset.toNodeid = conn.toNodeId;
        line.dataset.toinput = conn.toInput;
      }
    }
  }

  function startConnecting(startNodeId, startIoName, startIoType) {
    const startPos = getConnectorPosition(startNodeId, startIoType, startIoName);
    if (!startPos) return;

    const tempLine = createSVGLine(startPos.x, startPos.y, startPos.x, startPos.y);
    tempLine.style.pointerEvents = 'none';

    app.connecting = { startNodeId, startIoName, startIoType, tempLine };
    
    window.addEventListener('mousemove', onConnectionDrag);
    window.addEventListener('mouseup', onConnectionEnd, { once: true });
  }

  function cancelConnecting() {
    if (!app.connecting) return;
    connectionsSvg.removeChild(app.connecting.tempLine);
    app.connecting = null;
    window.removeEventListener('mousemove', onConnectionDrag);
  }

  function deleteNode(nodeId) {
    app.nodes = app.nodes.filter(node => node.id !== nodeId);
    app.connections = app.connections.filter(conn => 
      conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    );
    const nodeEl = canvas.querySelector(`.node[data-id="${nodeId}"]`);
    if (nodeEl) {
      nodeEl.remove();
    }
    redrawAllConnections();
  }

  function duplicateNode(nodeId) {
    const originalNode = app.nodes.find(n => n.id === nodeId);
    if (!originalNode) return;

    // Call update to ensure the value is current before duplicating
    const type = nodeTypes[originalNode.type];
    if (type && type.update) {
        type.update(originalNode);
    }

    const newNodeX = originalNode.x + 30;
    const newNodeY = originalNode.y + 30;

    const newNode = {
      id: app.nextNodeId++,
      type: originalNode.type,
      x: newNodeX,
      y: newNodeY,
      dom: null,
      value: originalNode.value !== undefined ? JSON.parse(JSON.stringify(originalNode.value)) : undefined
    };

    app.nodes.push(newNode);
    renderNode(newNode);
  }

  function clearWorkbench() {
    app.nodes = [];
    app.connections = [];
    app.nextNodeId = 1;
    canvas.querySelectorAll('.node').forEach(nodeEl => nodeEl.remove());
    connectionsSvg.innerHTML = '';
  }

  function onNodeDragStart(e) {
    if (e.target.closest('.io-connector') || e.target.closest('.node-input')) return;
    e.preventDefault();
    const nodeId = parseInt(e.target.closest('.node').dataset.id);
    const node = app.nodes.find(n => n.id === nodeId);
    if (!node) return;

    app.draggedNode = node;
    app.dragOffsetX = e.clientX - node.x;
    app.dragOffsetY = e.clientY - node.y;

    node.dom.classList.add('dragging');
    window.addEventListener('mousemove', onNodeDrag);
    window.addEventListener('mouseup', onNodeDragEnd, { once: true });
  }

  function onNodeDrag(e) {
    if (!app.draggedNode) return;
    let newX = e.clientX - app.dragOffsetX;
    let newY = e.clientY - app.dragOffsetY;

    newX = Math.max(0, Math.min(newX, canvas.clientWidth - app.draggedNode.dom.offsetWidth));
    newY = Math.max(0, Math.min(newY, canvas.clientHeight - app.draggedNode.dom.offsetHeight));

    updateNodePosition(app.draggedNode, newX, newY);
  }

  function onNodeDragEnd() {
    if (app.draggedNode) {
      app.draggedNode.dom.classList.remove('dragging');
    }
    app.draggedNode = null;
    window.removeEventListener('mousemove', onNodeDrag);
  }
  
  function onConnectorClick(e) {
    e.stopPropagation();
    const { nodeid, type, name } = e.target.dataset;
    const clickedNodeId = parseInt(nodeid);

    if (app.connecting) {
        const { startNodeId, startIoType } = app.connecting;

        if (clickedNodeId === startNodeId || type === startIoType) {
            cancelConnecting();
            return;
        }

        const from = startIoType === 'output'
            ? { nodeId: startNodeId, ioName: app.connecting.startIoName }
            : { nodeId: clickedNodeId, ioName: name };
        const to = startIoType === 'input'
            ? { nodeId: startNodeId, ioName: app.connecting.startIoName }
            : { nodeId: clickedNodeId, ioName: name };

        if (app.connections.some(c => c.toNodeId === to.nodeId && c.toInput === to.ioName)) {
            cancelConnecting();
            return;
        }

        app.connections.push({
            fromNodeId: from.nodeId,
            fromOutput: from.ioName,
            toNodeId: to.nodeId,
            toInput: to.ioName
        });

        cancelConnecting();
        redrawAllConnections();

    } else {
        startConnecting(clickedNodeId, name, type);
    }
}


  function onConnectionDrag(e) {
    if (!app.connecting) return;
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    app.connecting.tempLine.setAttribute('x2', x);
    app.connecting.tempLine.setAttribute('y2', y);
  }
  
  function onConnectionEnd(e) {
    if (app.connecting && !e.target.closest('.io-connector')) {
        cancelConnecting();
    }
  }

  function onCanvasRightClick(e) {
    e.preventDefault();
    const clickedNodeEl = e.target.closest('.node');
    if (clickedNodeEl) {
      app.contextMenuNodeId = parseInt(clickedNodeEl.dataset.id);
      contextMenu.style.left = `${e.clientX}px`;
      contextMenu.style.top = `${e.clientY}px`;
      contextMenu.style.display = 'block';
    } else {
      hideContextMenu();
    }
  }

  function onContextMenuClick(e) {
    const action = e.target.dataset.action;
    if (app.contextMenuNodeId && action) {
      if (action === 'delete') {
        deleteNode(app.contextMenuNodeId);
      } else if (action === 'duplicate') {
        duplicateNode(app.contextMenuNodeId);
      }
    }
    hideContextMenu();
  }

  function hideContextMenu() {
    contextMenu.style.display = 'none';
    app.contextMenuNodeId = null;
  }

  async function evaluateNodeOutput(nodeId, outputName, visited = new Set()) {
    const visitedKey = `${nodeId}-${outputName}`;
    if (visited.has(visitedKey)) {
        console.warn("Circular dependency detected at node", nodeId);
        return null;
    }
    visited.add(visitedKey);

    const node = app.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const type = nodeTypes[node.type];
    
    if (type.update) {
      type.update(node);
    }

    if (type.getOutput) {
      return type.getOutput.call(node, outputName);
    }

    if (type.compute) {
      const inputs = {};
      for (const inputName of type.inputs) {
        const conn = app.connections.find(c => c.toNodeId === nodeId && c.toInput === inputName);
        if (!conn) {
          if (node.type === 'AskPollinationsNode' && inputName === 'prompt') {
            inputs[inputName] = node.value; 
          } else {
            inputs[inputName] = null;
          }
          continue;
        }
        inputs[inputName] = await evaluateNodeOutput(conn.fromNodeId, conn.fromOutput, new Set(visited));
      }
      return await type.compute.call(node, inputs);
    }

    return null;
  }

  async function runGraph() {
    const outputNodes = app.nodes.filter(n => n.type === 'OutputNode');
    if (outputNodes.length === 0) {
      const prevMessage = document.getElementById('user-message');
      if(prevMessage) prevMessage.remove();
      
      const message = document.createElement('div');
      message.id = 'user-message';
      message.textContent = "No Output Node found! Add an 'Output' node to see results.";
      message.style.position = 'fixed';
      message.style.top = '20px';
      message.style.left = '50%';
      message.style.transform = 'translateX(-50%)';
      message.style.backgroundColor = 'var(--node-header-bg)';
      message.style.color = 'white';
      message.style.padding = '10px 20px';
      message.style.borderRadius = '8px';
      message.style.zIndex = '1000';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
      return;
    }
    
    app.nodes.forEach(node => {
        if (node.type === 'OutputNode') {
            const contentDiv = node.dom.querySelector('.node-content');
            if(contentDiv) {
                contentDiv.textContent = 'Calculating...';
            }
        } else if (node.type === 'AskPollinationsNode') {
            const resultSpan = node.dom.querySelector('.pollinations-result');
            if (resultSpan) resultSpan.textContent = '...';
        }
    });


    for (const outNode of outputNodes) {
      const conn = app.connections.find(c => c.toNodeId === outNode.id && c.toInput === "input");
      let result = null;
      if (conn) {
        result = await evaluateNodeOutput(conn.fromNodeId, conn.fromOutput);
      }
      const contentDiv = outNode.dom.querySelector('.node-content');
      if(contentDiv) {
        contentDiv.textContent = result !== null ? JSON.stringify(result, null, 2) : 'null';
      }
    }
  }

  function exportGraphData() {
    // Update all node values from their DOM inputs before exporting
    app.nodes.forEach(node => {
        const type = nodeTypes[node.type];
        if (type && type.update) {
            type.update(node);
        }
    });

    return {
      nodes: app.nodes.map(node => {
        const exportedNode = {
          id: node.id,
          type: node.type,
          x: node.x,
          y: node.y
        };
        if (['NumberNode', 'TextNode', 'AskPollinationsNode'].includes(node.type) && node.value !== undefined) {
          exportedNode.value = node.value;
        }
        return exportedNode;
      }),
      connections: app.connections.map(conn => ({
        fromNodeId: conn.fromNodeId,
        fromOutput: conn.fromOutput,
        toNodeId: conn.toNodeId,
        toInput: conn.toInput
      }))
    };
  }

  function exportCodeJS() {
    const graphData = exportGraphData();

    const code = `
const nodeGraph = ${JSON.stringify(graphData, null, 2)};

// Created using Adolfo GM's Node Graph Editor

const exportedNodeTypes = {
  NumberNode: {
    inputs: [],
    outputs: ["value"],
    getOutput: (node) => node.value
  },
  TextNode: {
    inputs: [],
    outputs: ["text"],
    getOutput: (node) => node.value
  },
  CurrentDateNode: {
    inputs: [],
    outputs: ["dateString"],
    getOutput: () => {
        const date = new Date();
        return date.getFullYear() + '-' +
               String(date.getMonth() + 1).padStart(2, '0') + '-' +
               String(date.getDate()).padStart(2, '0');
    }
  },
  CurrentTimeNode: {
    inputs: [],
    outputs: ["timeString"],
    getOutput: () => {
        const date = new Date();
        return String(date.getHours()).padStart(2, '0') + ':' +
               String(date.getMinutes()).padStart(2, '0') + ':' +
               String(date.getSeconds()).padStart(2, '0');
    }
  },
  AddNode: {
    inputs: ["a", "b"],
    outputs: ["sum"],
    compute: (inputs) => {
      const a = inputs["a"];
      const b = inputs["b"];
      if (typeof a !== 'number' || typeof b !== 'number') return null;
      return a + b;
    }
  },
  SubtractNode: {
    inputs: ["a", "b"],
    outputs: ["difference"],
    compute: (inputs) => {
      const a = inputs["a"];
      const b = inputs["b"];
      if (typeof a !== 'number' || typeof b !== 'number') return null;
      return a - b;
    }
  },
  MultiplyNode: {
    inputs: ["x", "y"],
    outputs: ["product"],
    compute: (inputs) => {
      const x = inputs["x"];
      const y = inputs["y"];
      if (typeof x !== 'number' || typeof y !== 'number') return null;
      return x * y;
    }
  },
  DivideNode: {
    inputs: ["a", "b"],
    outputs: ["quotient"],
    compute: (inputs) => {
      const a = inputs["a"];
      const b = inputs["b"];
      if (typeof a !== 'number' || typeof b !== 'number' || b === 0) return null;
      return a / b;
    }
  },
  MergeTextNode: {
    inputs: ["text1", "text2"],
    outputs: ["mergedText"],
    compute: (inputs) => {
      const text1 = inputs["text1"] !== null ? String(inputs["text1"]) : "";
      const text2 = inputs["text2"] !== null ? String(inputs["text2"]) : "";
      return text1 + text2;
    }
  },
  AskPollinationsNode: {
    inputs: ["prompt"],
    outputs: ["response"],
    compute: async function(inputs) {
      const promptText = inputs["prompt"] !== null ? String(inputs["prompt"]) : (this.value || "");

      if (!promptText) {
        console.warn("Pollinations: No prompt provided.");
        return null;
      }

      try {
        const encodedPrompt = encodeURIComponent(promptText);
        const url = \`https://text.pollinations.ai/\${encodedPrompt}\`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        const textResponse = await response.text();
        return textResponse;
      } catch (error) {
        console.error("Error fetching from Pollinations:", error);
        return null;
      }
    }
  },
  OutputNode: {
    inputs: ["input"],
    outputs: [],
  }
};

async function executeNodeGraph(graph, nodeDefinitions) {
  const nodeOutputs = new Map();

  async function resolveNodeOutput(nodeId, outputName, visited = new Set()) {
    const visitedKey = \`\${nodeId}-\${outputName}\`;
    if (visited.has(visitedKey)) {
      console.warn("Circular dependency detected:", visitedKey);
      return null;
    }
    visited.add(visitedKey);

    if (nodeOutputs.has(visitedKey)) {
      return nodeOutputs.get(visitedKey);
    }

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) { console.error('Node not found:', nodeId); return null; }

    const typeDef = nodeDefinitions[node.type];
    if (!typeDef) { console.error('Node type definition not found:', node.type); return null; }

    let result = null;

    if (typeDef.getOutput) {
      result = typeDef.getOutput.call(node);
    } else if (typeDef.compute) {
      const inputs = {};
      for (const inputName of typeDef.inputs) {
        const connection = graph.connections.find(conn => conn.toNodeId === nodeId && conn.toInput === inputName);
        if (connection) {
          inputs[inputName] = await resolveNodeOutput(connection.fromNodeId, connection.fromOutput, new Set(visited));
        } else {
          if (node.type === 'AskPollinationsNode' && inputName === 'prompt' && node.value !== undefined) {
              inputs[inputName] = node.value;
          } else {
              inputs[inputName] = null;
          }
        }
      }
      result = await typeDef.compute.call(node, inputs);
    }
    
    nodeOutputs.set(visitedKey, result);
    return result;
  }

  const finalOutputs = {};
  for (const outputNode of graph.nodes.filter(n => n.type === 'OutputNode')) {
    const outputConnection = graph.connections.find(conn => conn.toNodeId === outputNode.id && conn.toInput === "input");
    if (outputConnection) {
      finalOutputs[\`Output_\${outputNode.id}\`] = await resolveNodeOutput(outputConnection.fromNodeId, outputConnection.fromOutput);
    } else {
      finalOutputs[\`Output_\${outputNode.id}\`] = null;
    }
  }

  return finalOutputs;
}

`;
    downloadFile(code, 'nodes_graph.js', 'text/javascript');
  }

  function exportCodePython() {
    const graphData = exportGraphData();

    let pythonCode = `
import requests
import json
from datetime import datetime

# Created using Adolfo GM's Node Graph Editor

node_graph = ${JSON.stringify(graphData, null, 2)}

node_definitions = {
    "NumberNode": {
        "inputs": [],
        "outputs": ["value"],
        "get_output": lambda node: node["value"]
    },
    "TextNode": {
        "inputs": [],
        "outputs": ["text"],
        "get_output": lambda node: node["value"]
    },
    "CurrentDateNode": {
        "inputs": [],
        "outputs": ["dateString"],
        "get_output": lambda node: datetime.now().strftime("%Y-%m-%d")
    },
    "CurrentTimeNode": {
        "inputs": [],
        "outputs": ["timeString"],
        "get_output": lambda node: datetime.now().strftime("%H:%M:%S")
    },
    "AddNode": {
        "inputs": ["a", "b"],
        "outputs": ["sum"],
        "compute": lambda inputs: (inputs["a"] + inputs["b"]) if isinstance(inputs["a"], (int, float)) and isinstance(inputs["b"], (int, float)) else None
    },
    "SubtractNode": {
        "inputs": ["a", "b"],
        "outputs": ["difference"],
        "compute": lambda inputs: (inputs["a"] - inputs["b"]) if isinstance(inputs["a"], (int, float)) and isinstance(inputs["b"], (int, float)) else None
    },
    "MultiplyNode": {
        "inputs": ["x", "y"],
        "outputs": ["product"],
        "compute": lambda inputs: (inputs["x"] * inputs["y"]) if isinstance(inputs["x"], (int, float)) and isinstance(inputs["y"], (int, float)) else None
    },
    "DivideNode": {
        "inputs": ["a", "b"],
        "outputs": ["quotient"],
        "compute": lambda inputs: (inputs["a"] / inputs["b"]) if isinstance(inputs["a"], (int, float)) and isinstance(inputs["b"], (int, float)) and inputs["b"] != 0 else None
    },
    "MergeTextNode": {
        "inputs": ["text1", "text2"],
        "outputs": ["mergedText"],
        "compute": lambda inputs: str(inputs["text1"] or "") + str(inputs["text2"] or "")
    },
    "AskPollinationsNode": {
        "inputs": ["prompt"],
        "outputs": ["response"],
        "compute": (lambda node_obj: lambda inputs: ask_pollinations_api(inputs["prompt"] if inputs["prompt"] is not None else node_obj.get("value", "")))
    },
    "OutputNode": {
        "inputs": ["input"],
        "outputs": []
    }
}

def ask_pollinations_api(prompt_text):
    if not prompt_text:
        print("Pollinations: No prompt provided.")
        return None
    try:
        encoded_prompt = requests.utils.quote(str(prompt_text))
        url = f"https://text.pollinations.ai/{encoded_prompt}"
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from Pollinations: {e}")
        return None

def execute_node_graph(graph, node_definitions):
    node_outputs = {}

    def resolve_node_output(node_id, output_name, visited=None):
        if visited is None:
            visited = set()

        visited_key = f"{node_id}-{output_name}"
        if visited_key in visited:
            print(f"Circular dependency detected: {visited_key}")
            return None
        visited.add(visited_key)

        if visited_key in node_outputs:
            return node_outputs[visited_key]

        node = next((n for n in graph["nodes"] if n["id"] == node_id), None)
        if not node:
            print(f'Node not found: {node_id}')
            return None

        type_def = node_definitions.get(node["type"])
        if not type_def:
            print(f'Node type definition not found: {node["type"]}')
            return None

        result = None

        if "get_output" in type_def:
            result = type_def["get_output"](node)
        elif "compute" in type_def:
            inputs = {}
            for input_name in type_def["inputs"]:
                connection = next((conn for conn in graph["connections"] 
                                   if conn["toNodeId"] == node_id and conn["toInput"] == input_name), None)
                if connection:
                    inputs[input_name] = resolve_node_output(connection["fromNodeId"], connection["fromOutput"], set(visited))
                else:
                    if node["type"] == 'AskPollinationsNode' and input_name == 'prompt' and "value" in node:
                        inputs[input_name] = node["value"]
                    else:
                        inputs[input_name] = None
            
            if node["type"] == "AskPollinationsNode":
                 result = type_def["compute"](node)(inputs)
            else:
                 result = type_def["compute"](inputs)

        node_outputs[visited_key] = result
        return result

    final_outputs = {}
    for output_node in [n for n in graph["nodes"] if n["type"] == 'OutputNode']:
        output_connection = next((conn for conn in graph["connections"] 
                                  if conn["toNodeId"] == output_node["id"] and conn["toInput"] == "input"), None)
        if output_connection:
            final_outputs[f"Output_{output_node['id']}"] = resolve_node_output(output_connection["fromNodeId"], output_connection["fromOutput"])
        else:
            final_outputs[f"Output_{output_node['id']}"] = None

    return final_outputs

if __name__ == "__main__":
    results = execute_node_graph(node_graph, node_definitions)
    print("Graph Execution Results:", json.dumps(results, indent=2))
`;
    downloadFile(pythonCode, 'nodes_graph.py', 'text/x-python');
  }

  function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importNodes() {
    importNodesFile.click();
  }

  function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target.result;
        let importedGraph;

        try {
            importedGraph = JSON.parse(fileContent);
        } catch (jsonError) {
            const jsMatch = fileContent.match(/const nodeGraph = (\{[\s\S]*?\});/);
            if (jsMatch && jsMatch[1]) {
                importedGraph = JSON.parse(jsMatch[1]);
            } else {
                 throw new Error("File content is not a valid graph JSON or JS export.");
            }
        }
        
        clearWorkbench();

        app.nodes = [];
        app.connections = [];
        app.nextNodeId = 1;

        importedGraph.nodes.forEach(n => {
          const newNode = {
            id: n.id,
            type: n.type,
            x: n.x,
            y: n.y,
            dom: null,
            value: n.value
          };
          app.nodes.push(newNode);
          renderNode(newNode);
          app.nextNodeId = Math.max(app.nextNodeId, n.id + 1);
        });

        app.connections = importedGraph.connections.map(c => ({...c}));
        redrawAllConnections();

        console.log("Nodes imported successfully!");

      } catch (error) {
        console.error("Error importing nodes:", error);
        alert("Failed to import nodes: " + error.message);
      }
    };
    reader.readAsText(file);
  }

  function createSVGLine(x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("stroke", "var(--connector-color)");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    connectionsSvg.appendChild(line);
    return line;
  }

  function renderSidebar(filter = '') {
    nodeList.innerHTML = '';
    const lowerCaseFilter = filter.toLowerCase();
    Object.entries(nodeTypes).forEach(([key, type]) => {
      if (type.title.toLowerCase().includes(lowerCaseFilter)) {
        const el = document.createElement('div');
        el.classList.add('node-type');
        el.textContent = type.title;
        el.title = `Add ${type.title}`;
        el.onclick = () => createNode(key);
        nodeList.appendChild(el);
      }
    });
  }
  
  function initialize() {
    renderSidebar();
    runBtn.onclick = runGraph;
    exportJsBtn.onclick = exportCodeJS;
    exportPythonBtn.onclick = exportCodePython;
    importNodesBtn.onclick = importNodes;
    importNodesFile.addEventListener('change', handleFileImport);

    canvas.addEventListener('contextmenu', onCanvasRightClick);
    contextMenu.addEventListener('click', onContextMenuClick);
    window.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target) && !e.target.closest('.node')) {
        hideContextMenu();
      }
    });

    searchNodesInput.addEventListener('input', (e) => {
      renderSidebar(e.target.value);
    });
  }

  initialize();