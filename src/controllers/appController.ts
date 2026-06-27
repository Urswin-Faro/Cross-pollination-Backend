// Add the 'type' keyword here to satisfy verbatimModuleSyntax
import type { Request, Response } from 'express'; 
import { FeatureModel } from '../models/dataModels.js';

export const getDiscoverFeed = async (req: Request, res: Response) => {
  try {
    const groups = await FeatureModel.getCommunities();
    const availableTags = await FeatureModel.getTags();
    res.json({ communities: groups, tags: availableTags });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEventsFeed = async (req: Request, res: Response) => {
  try {
    const list = await FeatureModel.getEvents();
    res.json({ events: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};