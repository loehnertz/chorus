/**
 * Tests for user approval checking utilities
 */

import {
  isUserApproved,
  approveUser,
  revokeUserApproval,
  getUnapprovedUsers,
} from '../check-approval';
import { db } from '@/lib/db';
import type { NeonAuthSession } from '@/types/auth';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('check-approval utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('isUserApproved', () => {
    it('should return true for approved user', async () => {
      const session: NeonAuthSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          expiresAt: new Date(Date.now() + 86400000),
          token: 'token-123',
        },
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        approved: true,
      });

      const result = await isUserApproved(session);

      expect(result).toBe(true);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { approved: true },
      });
    });

    it('should return false for unapproved user', async () => {
      const session: NeonAuthSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          expiresAt: new Date(Date.now() + 86400000),
          token: 'token-123',
        },
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        approved: false,
      });

      const result = await isUserApproved(session);

      expect(result).toBe(false);
    });

    it('should return false when session is null', async () => {
      const result = await isUserApproved(null);

      expect(result).toBe(false);
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return false when user not found', async () => {
      const session: NeonAuthSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          expiresAt: new Date(Date.now() + 86400000),
          token: 'token-123',
        },
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await isUserApproved(session);

      expect(result).toBe(false);
    });

    it('should return false and log error on database error', async () => {
      const session: NeonAuthSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          expiresAt: new Date(Date.now() + 86400000),
          token: 'token-123',
        },
      };

      const dbError = new Error('Database error');
      (db.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      const result = await isUserApproved(session);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking user approval status:',
        dbError
      );
    });
  });

  describe('approveUser', () => {
    it('should approve a user by ID', async () => {
      const userId = 'user-123';
      const updatedUser = {
        id: userId,
        name: 'Test User',
        approved: true,
      };

      (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await approveUser(userId);

      expect(result).toEqual(updatedUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { approved: true },
      });
    });
  });

  describe('revokeUserApproval', () => {
    it('should revoke user approval by ID', async () => {
      const userId = 'user-123';
      const updatedUser = {
        id: userId,
        name: 'Test User',
        approved: false,
      };

      (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await revokeUserApproval(userId);

      expect(result).toEqual(updatedUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { approved: false },
      });
    });
  });

  describe('getUnapprovedUsers', () => {
    it('should return list of unapproved users', async () => {
      const unapprovedUsers = [
        {
          id: 'user-1',
          name: 'User One',
          image: null,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'user-2',
          name: 'User Two',
          image: 'avatar.jpg',
          createdAt: new Date('2024-01-02'),
        },
      ];

      (db.user.findMany as jest.Mock).mockResolvedValue(unapprovedUsers);

      const result = await getUnapprovedUsers();

      expect(result).toEqual(unapprovedUsers);
      expect(db.user.findMany).toHaveBeenCalledWith({
        where: { approved: false },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no unapproved users', async () => {
      (db.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getUnapprovedUsers();

      expect(result).toEqual([]);
    });
  });
});
