import Head from 'next/head'
import React, {ChangeEvent, useEffect, useState} from "react";
import RoomData from "../models/RoomData";
import moment from "moment/moment";
import {useSession, signIn, signOut} from "next-auth/react";

const ARDUINO_IP = "192.168.0.42"

export default function Home() {
    const {data: session} = useSession()
    const [data, setData] = useState<RoomData>({})
    const [tempSettingState, setTempSetting] = useState('idle');
    const [tempValue, setTempValue] = useState("");

    const updateData = () => {
        fetch('/api/getData')
            .then((response) => {
                return response.json()
            })
            .then((data) => {
                const roomData = data as RoomData;
                setData(roomData)
            })
    }

    const getHeatingDescription = (isHeating: boolean) => isHeating ? "Включен" : "Выключен"
    const getCoolingDescription = (isCooling: boolean) => isCooling ? "Включено" : "Выключено"
    const getHumanInRoomDescription = (humanInRoom: boolean) => humanInRoom ? "В палате" : "Вышел"
    const getDoorOpenedDescription = (doorOpened: boolean) => doorOpened ? "Открыта" : "Закрыта"

    useEffect(() => {
        setInterval(
            updateData,
            1000,
        )
    }, [])

    useEffect(() => {
        if (tempSettingState === 'idle' && data.targetTemp) setTempValue(data.targetTemp.toString())
    }, [data])

    const onSetClick = async (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault()
        if (tempSettingState === 'opened' && parseInt(tempValue) != data.targetTemp) {
            setTempSetting('loading')
            const rawResponse = await fetch(`http://${ARDUINO_IP}/setTemp`, {
                    mode: 'no-cors',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: tempValue
                },
            )

            console.log(rawResponse.body)
            setTimeout(() => {
                setTempSetting('idle')
            }, 2000)
        } else
            setTempSetting(tempSettingState === 'idle' ? 'opened' : 'idle')
    }

    const onTargetTempChange = (event: ChangeEvent<HTMLInputElement>) => {
        const temp = event.target.value
        if (temp.match(/^\d+$/) && temp.length <= 2)
            setTempValue(temp)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <Head>
                <title>Умная Больница</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center my-6">
                <h1 className="text-6xl font-bold">
                    Добро пожаловать в{' '}
                    <h1 className="text-blue-600">
                        Умную Больницу!
                    </h1>
                </h1>

                <p className="mt-3 text-2xl">
                    {session?.user ?
                        <>Вы вошли как {session.user.name}, <a className="text-blue-600 cursor-pointer"
                                                          onClick={() => signOut()}> выйти</a></> :
                        <><a className="ml-4 text-blue-600 cursor-pointer"
                           onClick={() => signIn()}>Войдите</a>, чтобы изменять температуру</>
                    }
                </p>

                <div className="mt-6 flex max-w-4xl flex-wrap items-center justify-around sm:w-full">
                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Температура {(tempSettingState === "idle" && session?.user?.email == "true") && <a
                            className="ml-2 font-normal text-xl text-blue-600 cursor-pointer"
                            onClick={onSetClick}>Изменить</a>}</h3>
                        <p className="mt-2 text-3xl">
                            {tempSettingState !== "idle" ?
                                <>{tempSettingState === 'opened' ?

                                    <div className="flex flex-row">
                                        <input type="number" className="w-40 mr-2" value={tempValue}
                                               onChange={onTargetTempChange}/>
                                        ºC
                                        <a className="ml-4 text-blue-600 cursor-pointer" onClick={onSetClick}>OK</a>
                                    </div> : "Загрузка..."

                                }</>

                                : <>
                                    {data.temperature != undefined ? `${data.temperature} ºC (уст. ${data.targetTemp} ºC)` : "Загрузка..."}
                                </>}

                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Влажность</h3>
                        <p className="mt-2 text-3xl">
                            {data.humidity != undefined ? `${data.humidity}%` : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Освещенность</h3>
                        <p className="mt-2 text-3xl">
                            {data.illumination != undefined ? `${data.illumination} Lux` : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Потребление нагревателя</h3>
                        <p className="mt-2 text-3xl">
                            {data.consumption != undefined ? `${data.consumption} Вт` : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">{`Нагрев`}</h3>
                        <p className="mt-2 text-3xl">
                            {data.isHeating != undefined ? getHeatingDescription(data.isHeating) : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">{`Охлаждение`}</h3>
                        <p className="mt-2 text-3xl">
                            {data.isCooling != undefined ? getCoolingDescription(data.isCooling) : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Человек</h3>
                        <p className="mt-2 text-3xl">
                            {data.humanInRoom != undefined ? getHumanInRoomDescription(data.humanInRoom) : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Дверь</h3>
                        <p className="mt-2 text-3xl">
                            {data.doorOpened != undefined ? getDoorOpenedDescription(data.doorOpened) : "Загрузка..."}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Движение с закрытой дверью</h3>
                        <p className="mt-2 text-3xl">
                            {data.moveWithLocked != undefined ? moment(data.moveWithLocked).fromNow() : "Не было"}
                        </p>
                    </div>

                    <div
                        className="mt-6 w-96 rounded-xl border p-6 text-left"
                    >
                        <h3 className="text-2xl font-bold">Открытие неверной картой</h3>
                        <p className="mt-2 text-3xl">
                            {data.openedWithWrongCard != undefined ? moment(data.openedWithWrongCard).fromNow() : "Не было"}
                        </p>
                    </div>
                </div>
            </main>

            <footer className="flex h-24 w-full items-center justify-center border-t">
                Powered by{' '}
                <img src="/nagib.svg" alt="Nagib Logo" className="ml-1 h-6"/>
            </footer>
        </div>
    )
}
