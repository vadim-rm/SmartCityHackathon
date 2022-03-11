import {promises as fs} from "fs";
import RoomData from "../models/RoomData";

export default async function getFileData() {
    const lines = await fs.readFile("./data.txt", "utf8")
    const fileData = JSON.parse(lines)

    const data: RoomData = {
        temperature: fileData.temperature,
        humidity: fileData.humidity,
        illumination: fileData.illumination,
        consumption: fileData.consumption,
        targetTemp: fileData.targetTemp,
        isHeating: fileData.isHeating == "1",
        isCooling: fileData.isCooling == "1",
        humanInRoom: fileData.humanInRoom == "1",
        doorOpened: fileData.doorOpened == "1",
        moveWithLocked: fileData.moveWithLocked,
        openedWithWrongCard: fileData.openedWithWrongCard,
    }
    return data
}
