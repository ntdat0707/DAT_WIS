import moment from 'moment';
const dayOfWeek = (day: any) => {
    let dayOfWeek = moment(day).day();
    let res;
    switch(dayOfWeek){
        case 0:
            res = 'sunday';
        case 1:
            res = 'monday';
        case 2:
            res = 'tuesday';
        case 3:
            res = 'wednesday';
        case 4:
            res = 'thursday';
        case 5:
            res = 'friday';
        case 6:
            res = 'saturday';
    };
    return res;
};

export {dayOfWeek};