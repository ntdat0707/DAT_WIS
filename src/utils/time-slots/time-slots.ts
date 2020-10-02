import moment from 'moment';
import { TimeSlotObj } from '../hash-object';
const timeSlots = (start: any, end: any, step: any) => {
  const slots = TimeSlotObj;
  const newStart = parseInt(start.split(':').join(''), 10) / 100;
  const newEnd = parseInt(end.split(':').join(''), 10) / 100;
  const bool = true;
  for (let i = newStart; i < newEnd; i += step) {
    const twoLastDigits = i % 100;
    if (twoLastDigits === 60) {
      i = Math.floor(i / 100 + 1) * 100;
    }
    const momentStart = moment(i.toString(), 'hmm').add(-7, 'h').format('HH:mm');
    slots[momentStart] = bool;
  }
  const momentEnd = moment(newEnd.toString(), 'hmm').add(-7, 'h').format('HH:mm');
  console.log(momentEnd);
  slots[momentEnd] = bool;
  return slots;
};
export { timeSlots };
