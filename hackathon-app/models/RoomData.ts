export default interface RoomData {
    temperature?: number,
    humidity?: number,
    targetTemp?: number,
    illumination?: number,
    consumption?: number,
    isHeating?: boolean,
    isCooling?: boolean,
    humanInRoom?: boolean,
    doorOpened?: boolean,
    moveWithLocked?: Date,
    openedWithWrongCard?: Date,
}