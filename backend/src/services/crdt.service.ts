import * as Y from 'yjs';
import { Node } from '../types/crdt.types';
import prisma from '../prisma';

class CRDTManager {
  private rooms: Map<string, Y.Doc> = new Map();
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 2000;

  async getOrCreateRoom(roomId: string): Promise<Y.Doc> {
    if (!this.rooms.has(roomId)) {
      const doc = new Y.Doc();
      
      // Load persisted state from database
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { crdtState: true },
      });

      if (room?.crdtState) {
        Y.applyUpdate(doc, room.crdtState);
      }

      this.rooms.set(roomId, doc);
    }
    return this.rooms.get(roomId)!;
  }

  getNodes(roomId: string): Y.Map<Node> {
    const doc = this.rooms.get(roomId);
    if (!doc) throw new Error('Room not initialized');
    return doc.getMap<Node>('nodes');
  }

  addNode(roomId: string, node: Node): void {
    const nodes = this.getNodes(roomId);
    nodes.set(node.id, node);
    this.scheduleSave(roomId);
  }

  updateNode(roomId: string, nodeId: string, updates: Partial<Node>): void {
    const nodes = this.getNodes(roomId);
    const existing = nodes.get(nodeId);
    if (existing) {
      nodes.set(nodeId, { ...existing, ...updates });
      this.scheduleSave(roomId);
    }
  }

  deleteNode(roomId: string, nodeId: string): void {
    const nodes = this.getNodes(roomId);
    nodes.delete(nodeId);
    this.scheduleSave(roomId);
  }

  getState(roomId: string): Uint8Array {
    const doc = this.rooms.get(roomId);
    if (!doc) throw new Error('Room not initialized');
    return Y.encodeStateAsUpdate(doc);
  }

  applyUpdate(roomId: string, update: Uint8Array): void {
    const doc = this.rooms.get(roomId);
    if (!doc) throw new Error('Room not initialized');
    Y.applyUpdate(doc, update);
    this.scheduleSave(roomId);
  }

  private scheduleSave(roomId: string): void {
    // Clear existing timer
    const existingTimer = this.saveTimers.get(roomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new save
    const timer = setTimeout(() => {
      this.saveToDatabase(roomId);
      this.saveTimers.delete(roomId);
    }, this.DEBOUNCE_MS);

    this.saveTimers.set(roomId, timer);
  }

  private async saveToDatabase(roomId: string): Promise<void> {
    try {
      const doc = this.rooms.get(roomId);
      if (!doc) return;

      const state = Y.encodeStateAsUpdate(doc);
      
      await prisma.room.update({
        where: { id: roomId },
        data: { crdtState: Buffer.from(state) },
      });

      console.log(`💾 Saved CRDT state for room ${roomId}`);
    } catch (error) {
      console.error(`Failed to save CRDT state for room ${roomId}:`, error);
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    // Clear save timer
    const timer = this.saveTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.saveTimers.delete(roomId);
    }

    // Save final state before cleanup
    await this.saveToDatabase(roomId);

    // Cleanup memory
    const doc = this.rooms.get(roomId);
    if (doc) {
      doc.destroy();
      this.rooms.delete(roomId);
    }
  }
}

export const crdtManager = new CRDTManager();
