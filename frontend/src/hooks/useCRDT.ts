import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { Socket } from 'socket.io-client';

export interface Node {
  id: string;
  content: string;
  x: number;
  y: number;
  color?: string;
  width?: number;
  height?: number;
  createdBy: string;
  createdAt: number;
}

export function useCRDT(socket: Socket | null, roomId: string) {
  const [doc] = useState(() => new Y.Doc());
  const [nodes, setNodes] = useState<Node[]>([]);
  const [undoManager] = useState(() => {
    const nodesMap = doc.getMap<Node>('nodes');
    return new Y.UndoManager(nodesMap);
  });

  useEffect(() => {
    if (!socket || !roomId) return;

    const nodesMap = doc.getMap<Node>('nodes');

    socket.on('crdt:sync', (state: number[]) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);
      updateNodesFromMap();
    });

    socket.on('crdt:update', (update: number[]) => {
      const updateArray = new Uint8Array(update);
      Y.applyUpdate(doc, updateArray);
    });

    socket.on('node:added', (node: Node) => {
      nodesMap.set(node.id, node);
      updateNodesFromMap();
    });

    socket.on('node:updated', (update: Partial<Node> & { id: string }) => {
      const existing = nodesMap.get(update.id);
      if (existing) {
        nodesMap.set(update.id, { ...existing, ...update });
        updateNodesFromMap();
      }
    });

    socket.on('node:deleted', ({ nodeId }: { nodeId: string }) => {
      nodesMap.delete(nodeId);
      updateNodesFromMap();
    });

    const observer = () => {
      updateNodesFromMap();
      const update = Y.encodeStateAsUpdate(doc);
      socket.emit('crdt:update', { roomId, update: Array.from(update) });
    };

    nodesMap.observe(observer);

    function updateNodesFromMap() {
      const nodeArray: Node[] = [];
      nodesMap.forEach((node) => nodeArray.push(node));
      setNodes(nodeArray);
    }

    updateNodesFromMap();

    return () => {
      nodesMap.unobserve(observer);
      socket.off('crdt:sync');
      socket.off('crdt:update');
      socket.off('node:added');
      socket.off('node:updated');
      socket.off('node:deleted');
    };
  }, [socket, roomId, doc]);

  const addNode = useCallback((node: Node) => {
    if (!socket) return;
    const nodesMap = doc.getMap<Node>('nodes');
    nodesMap.set(node.id, node);
    socket.emit('node:add', { roomId, node });
  }, [socket, roomId, doc]);

  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    if (!socket) return;
    const nodesMap = doc.getMap<Node>('nodes');
    const existing = nodesMap.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      nodesMap.set(id, updated);
      socket.emit('node:update', { roomId, update: { id, ...updates } });
    }
  }, [socket, roomId, doc]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!socket) return;
    const nodesMap = doc.getMap<Node>('nodes');
    nodesMap.delete(nodeId);
    socket.emit('node:delete', { roomId, nodeId });
  }, [socket, roomId, doc]);

  const undo = useCallback(() => {
    if (undoManager.canUndo()) {
      undoManager.undo();
    }
  }, [undoManager]);

  const redo = useCallback(() => {
    if (undoManager.canRedo()) {
      undoManager.redo();
    }
  }, [undoManager]);

  return { nodes, addNode, updateNode, deleteNode, undo, redo, canUndo: undoManager.canUndo(), canRedo: undoManager.canRedo() };
}
