import { Request, Response, NextFunction } from 'express'
import * as catalogService from './catalog.service'
import { sendSuccess } from '../../utils/apiResponse'

export const getItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, type } = req.query
    const items = await catalogService.getCatalogItems(
      search as string,
      type as string
    )
    sendSuccess(res, items, 'Catalog items retrieved')
  } catch (err) {
    next(err)
  }
}