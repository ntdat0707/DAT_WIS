import moment from 'moment';
interface ITimeItem {
    time: String,
    staffId: String,
    isAvail: boolean
};

const staffWithTime = (staffIds: any, staffsUnavailTimesArray: any, timeSlots: any, duration: any, appointmentDay: any, workDay: any) => {
    let staffTimeSlotsArray: Array<any> = [];
    Object.keys(timeSlots).forEach((key: any) => {
        let staffTimeSlots: ITimeItem =
        {
            time: '',
            staffId: '',
            isAvail: true,
        };
        staffTimeSlots.time = key;
        staffTimeSlots.isAvail = timeSlots[key];
        staffTimeSlotsArray.push(staffTimeSlots);
    });
    staffTimeSlotsArray.forEach((item:any) => {
        for(let i = 0; i < staffsUnavailTimesArray.length; i ++){
            for (let j = 0; j < staffsUnavailTimesArray[i].unavailTimes.length; j++){
                if (item.time == staffsUnavailTimesArray[i].unavailTimes[j]){
                    let filteredStaffs = staffIds.filter((staff:any) => staff != staffsUnavailTimesArray[i].staffId);
                    item.staffId = filteredStaffs[Math.floor(Math.random() * filteredStaffs.length)];
                }else {
                    item.staffId = staffIds[Math.floor(Math.random() * staffIds.length)];
                }
            }
        }
    });
    staffTimeSlotsArray[staffTimeSlotsArray.length - 1].isAvail = false;
    let endTime = parseInt(staffTimeSlotsArray[staffTimeSlotsArray.length - 1].time.split(':').join(''));
    staffTimeSlotsArray.forEach((item:any) => {
        let temp = parseInt(item.time.split(':').join(''));
        if (temp + duration > endTime){
            for (let i = 0; i < staffTimeSlotsArray.length; i ++){
                let tempString = moment(temp,'hmm').format('HH:mm');
                if(staffTimeSlotsArray[i].time == tempString){
                    staffTimeSlotsArray[i].isAvail = false;
                }
            }
        }
    });
    let currentTime = parseInt(moment().utc().add(7,'h').format('HH:mm').split(':').join(''));
    let currentDay =  moment().utc().format('MMMM DD YYYY');
    staffTimeSlotsArray.forEach((item:any) => {
        let temp = parseInt(item.time.split(':').join(''));
        if(temp < currentTime && currentDay == workDay){
            for (let i = 0; i < staffTimeSlotsArray.length; i++){
                let tempString = moment(temp,'hmm').format('HH:mm');
                if(staffTimeSlotsArray[i].time == tempString){
                    staffTimeSlotsArray[i].isAvail = false;
                }
            }
        }
    });
    let isBefore = moment(appointmentDay).isBefore(currentDay);
    if (isBefore == true){
        staffTimeSlotsArray.forEach((item:any) => {
            item.isAvail = false;
        });
    }
    return staffTimeSlotsArray;
};

export { staffWithTime };