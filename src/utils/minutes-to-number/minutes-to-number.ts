const minutesToNum = (minutes: number) => {
    let duration: number;
    if (minutes == 60) {
        duration = 100;
    } else if (minutes < 60) {
        duration = minutes;
    } else duration = (minutes / 60) * 100;
    return duration;
};

export { minutesToNum };