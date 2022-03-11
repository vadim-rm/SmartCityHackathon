import type {NextApiRequest, NextApiResponse} from 'next'
import RoomData from "../../models/RoomData"
import {promises as fs} from 'fs'
import getFileData from "../../helpers/getFileData";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        const prevRoomData = await getFileData()



        const data: RoomData = {
            ...req.body,
            moveWithLocked: (req.body.humanInRoom == "1" && req.body.doorOpened == "0") ? Date.now() : prevRoomData.moveWithLocked,
            openedWithWrongCard: req.body.openedWithWrongCard == "1" ? Date.now() : prevRoomData.openedWithWrongCard,
        }

        await fs.writeFile('./data.txt', JSON.stringify(data), 'utf8');
        res.status(200).json({});
    } else {
        res.status(405).json({});
    }
}
