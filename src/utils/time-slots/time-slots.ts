import moment from 'moment';
import { TimeSlotObj } from '../hash-object';
const timeSlots = function (start: any, end: any, step: any) {
    let slots = TimeSlotObj;
    let newStart = parseInt(start.split(':').join(''))/100;
    let newEnd = parseInt(end.split(':').join(''))/100;
    let bool = true;
    for (let i = newStart; i < newEnd; i += step) {
        let twoLastDigits = i % 100;
        if (twoLastDigits == 60) {
            i = Math.floor(i/100 + 1) * 100;
        }
        let momentStart = moment(i.toString(), "hmm").format('HH:mm');
        slots[momentStart] = bool;
    }
    let momentEnd = moment(newEnd.toString(), "hmm").format('HH:mm');
    slots[momentEnd] = bool;
    return slots;
}
export { timeSlots };