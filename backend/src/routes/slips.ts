import express from 'express';
import { Database } from 'sqlite';
import type { WorkSlipEntry } from '../models/WorkSlipEntry.js';

export function createSlipRoutes(db: Database) {
  const router = express.Router();

  // GET all slips
  router.get('/slips', async (req, res) => {
    try {
      const slips = await db.all('SELECT * FROM work_slips ORDER BY createdAt DESC');
      const parsedSlips = slips.map(slip => ({
        ...slip,
        offices: JSON.parse(slip.offices || '[]'),
        technicalReports: JSON.parse(slip.technicalReports || '[]'),
        areaInHouse: Boolean(slip.areaInHouse),
        areaOnSite: Boolean(slip.areaOnSite),
        areaInteragency: Boolean(slip.areaInteragency),
      }));
      res.json(parsedSlips);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch slips' });
    }
  });

  // GET single slip by ID
  router.get('/slips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const slip = await db.get('SELECT * FROM work_slips WHERE id = ?', id);
      if (!slip) {
        return res.status(404).json({ error: 'Slip not found' });
      }
      const parsedSlip = {
        ...slip,
        offices: JSON.parse(slip.offices || '[]'),
        technicalReports: JSON.parse(slip.technicalReports || '[]'),
        areaInHouse: Boolean(slip.areaInHouse),
        areaOnSite: Boolean(slip.areaOnSite),
        areaInteragency: Boolean(slip.areaInteragency),
      };
      res.json(parsedSlip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch slip' });
    }
  });

  // POST create slip
  router.post('/slips', async (req, res) => {
    try {
      const slip: WorkSlipEntry = req.body;
      const existing = await db.get('SELECT id FROM work_slips WHERE soNumber = ?', slip.soNumber);
      if (existing) {
        return res.status(409).json({ error: 'SO number already exists' });
      }
      await db.run(`
        INSERT INTO work_slips (
          id, soNumber, date, areaInHouse, areaOnSite, areaInteragency,
          offices, timeStarted, timeEnded, actionDone, recommendation,
          requesterSignature, technicianName, approvedBy, createdAt,
          printerBrand, printerModel, quarter, technicalReports
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        slip.id, slip.soNumber, slip.date, slip.areaInHouse ? 1 : 0,
        slip.areaOnSite ? 1 : 0, slip.areaInteragency ? 1 : 0,
        JSON.stringify(slip.offices), slip.timeStarted, slip.timeEnded,
        slip.actionDone, slip.recommendation, slip.requesterSignature,
        slip.technicianName, slip.approvedBy, slip.createdAt,
        slip.printerBrand, slip.printerModel, slip.quarter,
        JSON.stringify(slip.technicalReports)
      ]);
      res.status(201).json(slip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create slip' });
    }
  });

  // PUT update slip
  router.put('/slips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const slip: WorkSlipEntry = req.body;
      await db.run(`
        UPDATE work_slips SET
          soNumber = ?, date = ?, areaInHouse = ?, areaOnSite = ?,
          areaInteragency = ?, offices = ?, timeStarted = ?, timeEnded = ?,
          actionDone = ?, recommendation = ?, requesterSignature = ?,
          technicianName = ?, approvedBy = ?, printerBrand = ?,
          printerModel = ?, quarter = ?, technicalReports = ?
        WHERE id = ?
      `, [
        slip.soNumber, slip.date, slip.areaInHouse ? 1 : 0,
        slip.areaOnSite ? 1 : 0, slip.areaInteragency ? 1 : 0,
        JSON.stringify(slip.offices), slip.timeStarted, slip.timeEnded,
        slip.actionDone, slip.recommendation, slip.requesterSignature,
        slip.technicianName, slip.approvedBy, slip.printerBrand,
        slip.printerModel, slip.quarter, JSON.stringify(slip.technicalReports),
        id
      ]);
      res.json(slip);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update slip' });
    }
  });

  // DELETE slip
  router.delete('/slips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.run('DELETE FROM work_slips WHERE id = ?', id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete slip' });
    }
  });

  return router;
}