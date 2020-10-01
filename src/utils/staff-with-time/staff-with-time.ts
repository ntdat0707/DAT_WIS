import moment from 'moment';
interface ITimeItem {
  time: string;
  staffId: string;
  isAvail: boolean;
}

const staffWithTime = (
  staffIds: any,
  staffsUnavailTimesArray: any,
  timeSlots: any,
  duration: any,
  appointmentDay: any,
  workDay: any
) => {
  const staffTimeSlotsArray: any[] = [];
  Object.keys(timeSlots).forEach((key: any) => {
    const staffTimeSlots: ITimeItem = {
      time: '',
      staffId: '',
      isAvail: true
    };
    staffTimeSlots.time = key;
    staffTimeSlots.isAvail = timeSlots[key];
    staffTimeSlotsArray.push(staffTimeSlots);
  });
  staffTimeSlotsArray.forEach((item: any) => {
    for (let i = 0; i < staffsUnavailTimesArray.length; i++) {
      for (let j = 0; j < staffsUnavailTimesArray[i].unavailTimes.length; j++) {
        // let tempTime = parseInt(item.time.split(':').join(''),10);
        // let endTempTime = tempTime + duration;
        // for (let k = tempTime; k <= endTempTime; k+=5){
        //   if (k === staffsUnavailTimesArray[i].unavailTimes[j]){
        //     let filteredStaffs = staffIds.filter((staff: any) => staff !== staffsUnavailTimesArray[i].staffId);
        //     item.staffId = filteredStaffs[Math.floor(Math.random() * filteredStaffs.length)];
        //   }
        // }
        if (item.time === staffsUnavailTimesArray[i].unavailTimes[j]) {
          const filteredStaffs = staffIds.filter((staff: any) => staff !== staffsUnavailTimesArray[i].staffId);
          item.staffId = filteredStaffs[Math.floor(Math.random() * filteredStaffs.length)];
        } else {
          //console.log(staffIds[Math.floor(Math.random() * staffIds.length)]);
          item.staffId = staffIds[Math.floor(Math.random() * staffIds.length)];
        }
      }
    }
  });
  staffTimeSlotsArray[staffTimeSlotsArray.length - 1].isAvail = false;
  const endTime = parseInt(staffTimeSlotsArray[staffTimeSlotsArray.length - 1].time.split(':').join(''), 10);
  staffTimeSlotsArray.forEach((item: any) => {
    const temp = parseInt(item.time.split(':').join(''), 10);
    if (temp + duration > endTime) {
      for (let i = 0; i < staffTimeSlotsArray.length; i++) {
        const tempString = moment(temp, 'hmm').format('HH:mm');
        if (staffTimeSlotsArray[i].time === tempString) {
          staffTimeSlotsArray[i].isAvail = false;
        }
      }
    }
  });
  const currentTime = parseInt(moment().utc().add(7, 'h').format('HH:mm').split(':').join(''), 10);
  const currentDay = moment().utc().format('MMMM DD YYYY');
  staffTimeSlotsArray.forEach((item: any) => {
    const temp = parseInt(item.time.split(':').join(''), 10);
    if (temp < currentTime && currentDay === workDay) {
      for (let i = 0; i < staffTimeSlotsArray.length; i++) {
        const tempString = moment(temp, 'hmm').format('HH:mm');
        if (staffTimeSlotsArray[i].time === tempString) {
          staffTimeSlotsArray[i].isAvail = false;
        }
      }
    }
  });
  const isBefore = moment(appointmentDay).isBefore(currentDay);
  if (isBefore === true) {
    staffTimeSlotsArray.forEach((item: any) => {
      item.isAvail = false;
    });
  }
  return staffTimeSlotsArray;
};

export { staffWithTime };
