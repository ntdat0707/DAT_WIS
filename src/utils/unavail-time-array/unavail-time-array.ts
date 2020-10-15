import moment from 'moment';
import { minutesToNum } from '../minutes-to-number';
interface IStaffUnavailTime {
  staffId: any;
  unavailTimes: any[];
}
const removeDuplicates = (array: any) => {
  return array.filter((a: any, b: any) => array.indexOf(a) === b);
};

const getStaffUnavailTime = (item: any) => {
  const tempIds = [];
  const tempTime = [];
  const staffUnavailTimeArray: any[] = [];
  for (let i = 0; i < item.count; i++) {
    tempIds.push(item.rows[0].staffs[i].id);
    const tmp: any[][] = Array.from({ length: item.count }, (_) => []);
    for (let j = 0; j < item.rows[0].staffs[i].appointmentDetails.length; j++) {
      let startTime = parseInt(item.rows[0].staffs[i].appointmentDetails[j].start_time.split(':').join(''), 10);
      const duration = minutesToNum(item.rows[0].staffs[i].appointmentDetails[j].duration);
      const endTime = startTime + duration;
      let temp;
      tmp[i].push(item.rows[0].staffs[i].appointmentDetails[j].start_time);
      while (startTime < endTime) {
        startTime += 5;
        if (startTime % 100 === 60) {
          startTime = (Math.floor(startTime / 100) + 1) * 100;
        }
        temp = moment(startTime, 'hmm').format('HH:mm');
        tmp[i].push(temp);
      }
    }
    tempTime.push(tmp[i]);
  }
  for (let i = 0; i < tempTime.length; i++) {
    tempTime[i] = removeDuplicates(tempTime[i]);
  }
  for (let i = 0; i < tempIds.length; i++) {
    const temp: IStaffUnavailTime = {
      staffId: '',
      unavailTimes: []
    };
    temp.staffId = tempIds[i];
    temp.unavailTimes = tempTime[i];
    staffUnavailTimeArray.push(temp);
  }
  return staffUnavailTimeArray;
};

export { getStaffUnavailTime };
