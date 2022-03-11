import type { NextApiRequest, NextApiResponse } from 'next'
import RoomData from "../../models/RoomData";
import { promises as fs } from 'fs'
import getFileData from "../../helpers/getFileData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RoomData>
) {
  res.status(200).json(await getFileData())
}
