import { Station } from "./station";

export class Record {
    id: number = 0;
    mnc: number = 0;
    lac: number = 0;
    ci: number = 0;
    lat: number = 0;
    lng: number = 0;
    addr: string = '';
    acc: number = 0;
    otherNumber: string = "";
    startTime: string = "";
    callDuration: string = "";
    callType: string = "";

    static toStations(records: Array<Record>): Array<Station> {
        let stations = [];
        //计数基站
        let stationMap = new Map();
        records.forEach(r => {
            if (r.lng != 0 && r.lat != 0 && r.lac != 0 && r.ci != 0) {
                const key = `${r.lac}:${r.ci}`;
                if (!stationMap.has(key)) {
                    const station = Station.toStation(r);
                    station.records.push(r);
                    stations.push(station);
                    stationMap.set(key, station);
                } else {
                    let station = stationMap.get(key)
                    station.records.push(r);
                }
            }
        })
       
        stations.sort((a, b) => {
            if (a.records.length > b.records.length)
                return 1;
            return -1;
        })

        return stations;
    }

    static rowToRecord(row): Record {
        let r = new Record();
        for (let key in row) {
            if (r.hasOwnProperty(key)) {
                r[key] = row[key];
            }
        }
        return r;
    }
}
