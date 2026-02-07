/**
 * @jest-environment node
 */

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

import { withApproval } from '../with-approval';
import { requireApprovedUserApi } from '@/lib/auth/require-approval';

describe('withApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the error Response when not approved/authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const handler = jest.fn(async (_session: unknown, _request: Request) => {
      void _session
      void _request
      return Response.json({ ok: true })
    })
    const wrapped = withApproval(handler);

    const res = await wrapped(new Request('http://localhost/api/chores'));
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler with session when approved', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Test', image: null },
      session: { id: 's1', userId: 'u1', expiresAt: new Date(), token: 't' },
    });

    const handler = jest.fn(async (_session, request: Request) =>
      Response.json({ url: request.url }, { status: 200 }),
    );
    const wrapped = withApproval(handler);

    const req = new Request('http://localhost/api/chores');
    const res = await wrapped(req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.any(Object), req);
  });
});
