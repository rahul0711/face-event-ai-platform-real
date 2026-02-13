import { db } from "../database/db.js";



/* ===============================
   VIEW ALL USER SEARCH REQUESTS
================================= */
export const getUserRequests = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
          ur.email,
          ur.event_id,
          MAX(e.event_name) AS event_name,
          MAX(ur.request_status) AS request_status,
          COUNT(ur.request_id) AS total_requests,

          MAX(usa.total_searches) AS total_searches,
          MAX(usa.last_search) AS last_search,

          MAX(bu.is_blocked) AS is_blocked

      FROM user_requests ur

      LEFT JOIN events e 
        ON e.event_id = ur.event_id

      LEFT JOIN user_search_analytics usa
        ON LOWER(usa.email) = LOWER(ur.email)

      LEFT JOIN blocked_users bu
        ON LOWER(bu.email) = LOWER(ur.email)

      GROUP BY ur.email, ur.event_id
      ORDER BY MAX(ur.created_at) DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};






/* ===============================
   GET USER SEARCH HISTORY BY EMAIL
================================= */
export const getUserHistoryByEmail = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();

    const [rows] = await db.query(`
      SELECT 
        ur.*,
        e.event_name,
        COALESCE(usa.total_searches, 0) AS total_searches
      FROM user_requests ur
      LEFT JOIN events e ON ur.event_id = e.event_id
      LEFT JOIN user_search_analytics usa 
        ON LOWER(usa.email) = LOWER(ur.email)
      WHERE LOWER(ur.email)=?
      ORDER BY ur.created_at DESC
    `, [email]);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




export const getMatchedResults = async (req, res) => {
  try {
    const { requestId } = req.params;

    const [rows] = await db.query(`
      SELECT mr.*, ei.image_url
      FROM matched_results mr
      LEFT JOIN event_images ei ON mr.image_id = ei.image_id
      WHERE mr.request_id=?
    `, [requestId]);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




export const blockUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();

    await db.query(`
      INSERT INTO blocked_users (email, is_blocked)
      VALUES (?, TRUE)
      ON DUPLICATE KEY UPDATE is_blocked=TRUE
    `, [email]);

    res.json({ message: "User blocked successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





export const unblockUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();

    await db.query(`
      UPDATE blocked_users
      SET is_blocked=FALSE
      WHERE email=?
    `, [email]);

    res.json({ message: "User unblocked" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




export const logDownload = async (req, res) => {
  try {
    const { request_id, image_id } = req.body;

    await db.query(`
      INSERT INTO download_logs(request_id,image_id)
      VALUES (?,?)
    `, [request_id, image_id]);

    res.json({ message: "Download logged" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




/* ===============================
   DOWNLOAD STATISTICS
================================= */
export const getDownloadStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT image_id, COUNT(*) AS total_downloads
      FROM download_logs
      GROUP BY image_id
      ORDER BY total_downloads DESC
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



/* ===============================
   TOTAL IMAGE DELIVERY ANALYTICS
================================= */
export const getImageDeliveryStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS total_images_delivered
      FROM matched_results
    `);

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
