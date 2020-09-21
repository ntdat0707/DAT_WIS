import TsMap from 'ts-map';
interface Iavailable{
    available: boolean
};
const availableTimeSlots = new TsMap<string,Iavailable>([]);

export { availableTimeSlots };
