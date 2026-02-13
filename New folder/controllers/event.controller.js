import { db } from "../database/db.js";
import { createCollection,deleteCollection } from "../services/awsRekognition.service.js";

export const createEvent = async (req, res) => {
  const { event_name, event_date, event_location } = req.body;

  const collectionId = `event_${Date.now()}`;

  await createCollection(collectionId);

  await db.query(
    `INSERT INTO events(event_name,event_date,event_location,collection_id,created_by)
     VALUES (?,?,?,?,?)`,
    [
      event_name,
      event_date,
      event_location,
      collectionId,
      req.admin.id
    ]
  );

  res.json({ message: "Event created" });
};


export const getEvents = async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT * FROM events WHERE created_by = ? ORDER BY created_at DESC`,
      [req.admin.id]
    );

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};


export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check event exists & belongs to admin
    const [events] = await db.query(
      `SELECT * FROM events WHERE event_id = ? AND created_by = ?`,
      [id, req.admin.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = events[0];

    // Delete AWS Collection
    await deleteCollection(event.collection_id);

    // Delete from DB
    await db.query(
      `DELETE FROM events WHERE event_id = ?`,
      [id]
    );

    res.json({ message: "Event deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete event" });
  }
};


export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, event_date, event_location } = req.body;

    // Check event exists & belongs to admin
    const [events] = await db.query(
      `SELECT * FROM events WHERE event_id = ? AND created_by = ?`,
      [id, req.admin.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    await db.query(
      `UPDATE events
       SET event_name = ?, event_date = ?, event_location = ?
       WHERE event_id = ?`,
      [event_name, event_date, event_location, id]
    );

    res.json({ message: "Event updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update event" });
  }
};


export const getImagesGroupedByEvent = async (req, res) => {
  try {

    /* ===== SINGLE JOIN QUERY ===== */
    const [rows] = await db.query(`
      SELECT 
        e.event_id,
        e.event_name,
        e.event_date,
        e.event_location,
        ei.image_id,
        ei.image_url
      FROM events e
      LEFT JOIN event_images ei 
        ON e.event_id = ei.event_id
      ORDER BY e.event_id DESC
    `);

    /* ===== GROUP EVENTS WITHOUT DUPLICATION ===== */
    const grouped = new Map();

    for (const row of rows) {

      if (!grouped.has(row.event_id)) {
        grouped.set(row.event_id, {
          event_id: row.event_id,
          event_name: row.event_name,
          event_date: row.event_date,
          event_location: row.event_location,
          images: []
        });
      }

      if (row.image_id) {
        grouped.get(row.event_id).images.push({
          image_id: row.image_id,
          image_url: row.image_url
        });
      }
    }

    res.json([...grouped.values()]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getImagesByEvent = async (req, res) => {
  try {
    const { event_id } = req.params;

    /* ===== GET EVENT + IMAGES ===== */
    const [rows] = await db.query(`
      SELECT 
        e.event_id,
        e.event_name,
        e.event_date,
        e.event_location,
        ei.image_id,
        ei.image_url
      FROM events e
      LEFT JOIN event_images ei 
        ON e.event_id = ei.event_id
      WHERE e.event_id = ?
    `, [event_id]);

    /* ===== EVENT NOT FOUND ===== */
    if (rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    /* ===== FORMAT RESPONSE ===== */
    const eventData = {
      event_id: rows[0].event_id,
      event_name: rows[0].event_name,
      event_date: rows[0].event_date,
      event_location: rows[0].event_location,
      images: []
    };

    rows.forEach(row => {
      if (row.image_id) {
        eventData.images.push({
          image_id: row.image_id,
          image_url: row.image_url
        });
      }
    });

    res.json(eventData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


export const getEventsuser = async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT * FROM events  ORDER BY created_at DESC`
    );

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};