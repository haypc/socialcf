import { Hono } from 'hono';
import type { Env } from '../env';
import { authRequired } from '../middleware/auth';
const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();
app.use('*', authRequired);
app.post('/:userId', async c => {
  const uid = c.get('user').sub;
  const target = c.req.param('userId');
  if (uid === target) return c.json({ error: 'Cannot follow yourself' }, 400);
  const exists = await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?').bind(uid, target).first();
  if (exists) await c.env.DB.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').bind(uid, target).run();
  else await c.env.DB.prepare('INSERT INTO follows (follower_id,following_id) VALUES (?,?)').bind(uid, target).run();
  return c.json({ following: !exists });
});
export default app;
