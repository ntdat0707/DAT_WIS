import { any } from 'bluebird';
import moment from 'moment';
import {minutesToNum} from '../minutes-to-number';
interface IStaffUnavailTime {
    staffId: String,
    unavailTimes: Array<any>
};

const staffUnavailTimeArray: Array<any> = [];

const staffUnavailTime: IStaffUnavailTime = {
    staffId: '',
    unavailTimes: []
};
const removeDuplicates = (array:any) => {
    return array.filter((a:any,b:any) => array.indexOf(a) === b);
};

const getStaffUnavailTime = (item: any) => {
    let tempIds = [];
    let tempTime = [];
    for (let i = 0; i < item.rows.length; i++){
        tempIds.push(item.rows[i].id);
        let tmp: Array<Array<any>> = Array.from({length: item.rows.length}, (_) => []);
        for (let j = 0; j < item.rows[i].appointmentDetails.length;j++){
            let startTime = parseInt(item.rows[i].appointmentDetails[j].start_time.split(':').join(''));
            let duration = minutesToNum(item.rows[i].appointmentDetails[j].duration);
            let endTime = startTime + duration;
            let temp;
            tmp[i].push(item.rows[i].appointmentDetails[j].start_time);
            while (startTime < endTime){
                startTime += 5;
                if ((startTime % 100) == 60){
                    startTime = (Math.floor(startTime/100) + 1) * 100; 
                }
                temp = moment(startTime,'hmm').format('HH:mm');
                console.log(temp);
                tmp[i].push(temp);
            }
        }
        tempTime.push(tmp[i]);
    }
    console.log(tempTime);
    for (let i = 0; i < tempTime.length; i ++ ){
        tempTime[i] = removeDuplicates(tempTime[i]);
    }
    for (let i = 0; i < tempIds.length; i++){
        console.log(i);
        let temp = tempIds[i];
        staffUnavailTimeArray.push(staffUnavailTime);
        staffUnavailTimeArray.map((a:any) => a.staffId = temp);
    }

    return staffUnavailTimeArray;  
};

export { getStaffUnavailTime };