import { query } from '../db.js';

export const UserModel = {
  // Find account credentials by unique email string
  findByEmail: async (email: string) => {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  },

  // Insert a new secure user baseline record
  createAccount: async (email: string, passwordHash: string) => {
    const res = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    return res.rows[0];
  },

  // Initialize a comprehensive member profile card mapping
  createProfile: async (userId: string, fullName: string, age: number, location: string, church: string) => {
    const res = await query(
      'INSERT INTO profiles (user_id, full_name, age, location, church) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, fullName, age, location, church]
    );
    return res.rows[0];
  },

  // Map chosen interest tag strings directly into the junction array matrix
  assignProfileTags: async (profileId: string, tagIds: string[]) => {
    const formatValues = tagIds.map((tagId) => `('${profileId}', '${tagId}')`).join(',');
    return await query(`INSERT INTO profile_tags (profile_id, tag_id) VALUES ${formatValues}`);
  }
};

export const FeatureModel = {
  // Fetch interest tag lookups to assist matching arrays
  getTags: async () => {
    const res = await query('SELECT * FROM tags ORDER BY name ASC');
    return res.rows;
  },

  // Get dynamic listings of vetted operational channels/communities
  getCommunities: async () => {
    const res = await query(`
      SELECT c.*, t.name as category_name 
      FROM communities c 
      LEFT JOIN tags t ON c.tag_id = t.id
    `);
    return res.rows;
  },

  // Grab global schedules for regional conferences
  getEvents: async () => {
    const res = await query('SELECT * FROM events ORDER BY date_time ASC');
    return res.rows;
  }
};